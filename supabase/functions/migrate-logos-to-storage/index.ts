import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check: only super_admin or service role can run this migration
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
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
      const adminCheck = createClient(supabaseUrl, serviceRoleKey);
      const { data: roles } = await adminCheck
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const isSuperAdmin = roles?.some((r: any) => r.role === "super_admin");
      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden: super admin only" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all schools with base64 logos
    const { data: schools, error: fetchError } = await supabase
      .from("schools")
      .select("id, name, logo")
      .not("logo", "is", null)
      .like("logo", "data:%");

    if (fetchError) throw fetchError;
    if (!schools || schools.length === 0) {
      return new Response(
        JSON.stringify({ message: "No base64 logos to migrate", migrated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { school_id: string; name: string; status: string; url?: string; error?: string }[] = [];

    for (const school of schools) {
      try {
        const logo = school.logo as string;
        const match = logo.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) {
          results.push({ school_id: school.id, name: school.name, status: "skipped", error: "Invalid base64 format" });
          continue;
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.split("/")[1] || "png";
        const fileName = `school-logos/${school.id}.${ext}`;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const { error: uploadError } = await supabase.storage
          .from("platform-assets")
          .upload(fileName, bytes, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("platform-assets")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        const { error: updateError } = await supabase
          .from("schools")
          .update({ logo: publicUrl })
          .eq("id", school.id);

        if (updateError) throw updateError;

        results.push({ school_id: school.id, name: school.name, status: "migrated", url: publicUrl });
      } catch (err: any) {
        results.push({ school_id: school.id, name: school.name, status: "error", error: err.message });
      }
    }

    const migrated = results.filter((r) => r.status === "migrated").length;

    return new Response(
      JSON.stringify({ message: `Migrated ${migrated}/${schools.length} logos`, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
