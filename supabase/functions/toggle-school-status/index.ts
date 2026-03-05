import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is super_admin
    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) throw new Error("Unauthorized");

    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id);

    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin) throw new Error("Permission denied: Only super admins can toggle school status");

    const { school_id, is_active } = await req.json();
    if (!school_id || typeof is_active !== "boolean") throw new Error("Missing school_id or is_active");

    // Verify school exists
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id, name")
      .eq("id", school_id)
      .single();

    if (!school) throw new Error("School not found");

    console.log(`${is_active ? "Enabling" : "Disabling"} school: ${school.name}`);

    // Update school status
    await supabaseAdmin
      .from("schools")
      .update({ is_active })
      .eq("id", school_id);

    // Get all users belonging to this school (exclude super admins)
    const { data: schoolProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("school_id", school_id);

    const userIds = (schoolProfiles || []).map(p => p.id);

    // Filter out super admins
    const { data: superAdminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin");
    const superAdminIds = new Set((superAdminRoles || []).map(r => r.user_id));
    const usersToToggle = userIds.filter(id => !superAdminIds.has(id));

    console.log(`Toggling ${usersToToggle.length} user accounts`);

    // Ban or unban users
    let successCount = 0;
    let failCount = 0;

    for (const userId of usersToToggle) {
      try {
        if (is_active) {
          // Unban user
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "none",
          });
        } else {
          // Ban user (effectively disabling login)
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "876600h", // ~100 years
          });
        }
        successCount++;
      } catch (e) {
        console.warn(`Failed to toggle user ${userId}:`, e);
        failCount++;
      }
    }

    const action = is_active ? "enabled" : "disabled";
    return new Response(
      JSON.stringify({
        success: true,
        message: `School "${school.name}" ${action}. ${successCount} users ${action}.`,
        usersToggled: successCount,
        usersFailed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
