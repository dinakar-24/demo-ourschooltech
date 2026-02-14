import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push crypto utilities for VAPID
async function generateVapidAuth(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string, subject: string) {
  // For Deno, we use a simpler approach - sign the JWT for VAPID
  const audience = new URL(endpoint).origin;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(String.fromCharCode(...enc.encode(JSON.stringify(header))))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(String.fromCharCode(...enc.encode(JSON.stringify(payload))))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsignedToken)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return {
    authorization: `vapid t=${unsignedToken}.${sigB64}, k=${vapidPublicKey}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
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
          // Simple fetch to push endpoint (browser push service)
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
            // Subscription expired, remove it
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
