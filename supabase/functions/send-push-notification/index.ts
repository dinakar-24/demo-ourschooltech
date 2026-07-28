import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check: require valid JWT or service-role/anon key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Allow service role key directly (used by other edge functions / cron)
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      // Validate JWT and check caller has admin/super_admin role
      const supabaseUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await supabaseUser.auth.getClaims(token);
      if (error || !data?.claims) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userId = data.claims.sub as string;
      // Check that the caller is an admin
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const allowedRoles = ["super_admin", "school_admin", "teacher"];
      const hasAllowedRole = roles?.some((r: any) => allowedRoles.includes(r.role));
      if (!hasAllowedRole) {
        return new Response(
          JSON.stringify({ error: "Forbidden: insufficient permissions" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_ids, title, body, type = "general", reference_id, school_id } = await req.json();

    if (!user_ids?.length || !title || !body) {
      return new Response(
        JSON.stringify({ error: "user_ids, title, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Insert notification records for all users
    const notificationRows = user_ids.map((uid: string) => ({
      user_id: uid,
      school_id: school_id || null,
      title,
      body,
      type,
      reference_id: reference_id || null,
    }));

    const { error: insertError } = await supabase.from("notifications").insert(notificationRows);
    if (insertError) {
      console.error("Failed to insert notifications:", insertError);
    }

    // 2. Send Web Push to all subscribed devices
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.log("VAPID keys not configured, skipping push notifications");
      return new Response(
        JSON.stringify({ success: true, pushed: 0, notifications: notificationRows.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", user_ids);

    let pushCount = 0;

    if (subscriptions?.length) {
      const pushPayload = JSON.stringify({ title, body, type, reference_id });

      for (const sub of subscriptions) {
        try {
          const res = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              TTL: "86400",
            },
            body: pushPayload,
          });

          if (res.ok || res.status === 201) {
            pushCount++;
          } else if (res.status === 404 || res.status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        } catch (err) {
          console.error(`Push failed for ${sub.endpoint}:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, pushed: pushCount, notifications: notificationRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
