import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageUserRequest {
  action: "disable" | "enable" | "delete" | "update_role" | "update_profile" | "reset_password";
  user_id: string;
  // For update_profile
  full_name?: string;
  phone?: string;
  school_id?: string;
  // For update_role
  new_role?: string;
  old_role?: string;
}

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

    // Verify caller
    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) throw new Error("Unauthorized");

    // Check super_admin role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id);

    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin) throw new Error("Permission denied: Super admin only");

    const body: ManageUserRequest = await req.json();
    const { action, user_id } = body;

    if (!action || !user_id) throw new Error("Missing action or user_id");

    // Prevent self-modification for destructive actions
    if (callingUser.id === user_id && ["disable", "delete"].includes(action)) {
      throw new Error("Cannot perform this action on your own account");
    }

    let result: Record<string, unknown> = {};

    switch (action) {
      case "disable": {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: "876000h", // ~100 years
        });
        if (error) throw new Error(`Failed to disable user: ${error.message}`);

        // If user is a school_admin, cascade disable to all users in their school
        const { data: targetRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user_id);

        const isSchoolAdmin = targetRoles?.some(r => r.role === "school_admin");
        let cascadeCount = 0;

        if (isSchoolAdmin) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("school_id")
            .eq("id", user_id)
            .single();

          if (profile?.school_id) {
            // Get all users in this school (excluding the admin themselves and super_admins)
            const { data: schoolUsers } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("school_id", profile.school_id)
              .neq("id", user_id);

            if (schoolUsers && schoolUsers.length > 0) {
              // Filter out super_admins
              const { data: superAdminRoles } = await supabaseAdmin
                .from("user_roles")
                .select("user_id")
                .eq("role", "super_admin")
                .in("user_id", schoolUsers.map(u => u.id));

              const superAdminIds = new Set((superAdminRoles || []).map(r => r.user_id));
              const usersToDisable = schoolUsers.filter(u => !superAdminIds.has(u.id));

              for (const u of usersToDisable) {
                const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
                  ban_duration: "876000h",
                });
                if (!banErr) cascadeCount++;
              }

              // Also deactivate the school
              await supabaseAdmin
                .from("schools")
                .update({ is_active: false })
                .eq("id", profile.school_id);
            }
          }
        }

        result = { message: `User disabled successfully${cascadeCount > 0 ? `. ${cascadeCount} school users also disabled.` : ""}` };
        break;
      }

      case "enable": {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: "none",
        });
        if (error) throw new Error(`Failed to enable user: ${error.message}`);

        // If user is a school_admin, cascade enable to all users in their school
        const { data: targetRolesEn } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user_id);

        const isSchoolAdminEn = targetRolesEn?.some(r => r.role === "school_admin");
        let cascadeEnCount = 0;

        if (isSchoolAdminEn) {
          const { data: profileEn } = await supabaseAdmin
            .from("profiles")
            .select("school_id")
            .eq("id", user_id)
            .single();

          if (profileEn?.school_id) {
            const { data: schoolUsersEn } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("school_id", profileEn.school_id)
              .neq("id", user_id);

            if (schoolUsersEn && schoolUsersEn.length > 0) {
              for (const u of schoolUsersEn) {
                const { error: unbanErr } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
                  ban_duration: "none",
                });
                if (!unbanErr) cascadeEnCount++;
              }

              // Re-activate the school
              await supabaseAdmin
                .from("schools")
                .update({ is_active: true })
                .eq("id", profileEn.school_id);
            }
          }
        }

        result = { message: `User enabled successfully${cascadeEnCount > 0 ? `. ${cascadeEnCount} school users also re-enabled.` : ""}` };
        break;
      }

      case "delete": {
        // Check if user is a school_admin — cascade delete all school users
        const { data: delTargetRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user_id);

        const isDelSchoolAdmin = delTargetRoles?.some(r => r.role === "school_admin");
        let cascadeDelCount = 0;

        if (isDelSchoolAdmin) {
          const { data: delProfile } = await supabaseAdmin
            .from("profiles")
            .select("school_id")
            .eq("id", user_id)
            .single();

          if (delProfile?.school_id) {
            const schoolId = delProfile.school_id;

            // Get all other users in this school
            const { data: schoolUsers } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("school_id", schoolId)
              .neq("id", user_id);

            if (schoolUsers && schoolUsers.length > 0) {
              // Filter out super_admins
              const { data: saRoles } = await supabaseAdmin
                .from("user_roles")
                .select("user_id")
                .eq("role", "super_admin")
                .in("user_id", schoolUsers.map(u => u.id));

              const saIds = new Set((saRoles || []).map(r => r.user_id));
              const usersToDelete = schoolUsers.filter(u => !saIds.has(u.id));

              for (const u of usersToDelete) {
                // Clean up related records
                await supabaseAdmin.from("teachers").delete().eq("user_id", u.id);
                await supabaseAdmin.from("students").delete().eq("user_id", u.id);
                await supabaseAdmin.from("user_roles").delete().eq("user_id", u.id);
                await supabaseAdmin.from("profiles").delete().eq("id", u.id);
                const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(u.id);
                if (!delErr || delErr.message.includes("not found")) cascadeDelCount++;
              }
            }

            // Delete the school itself
            await supabaseAdmin.from("schools").delete().eq("id", schoolId);
          }
        }

        // Now delete the admin user themselves
        await supabaseAdmin.from("teachers").delete().eq("user_id", user_id);
        await supabaseAdmin.from("students").delete().eq("user_id", user_id);
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        await supabaseAdmin.from("profiles").delete().eq("id", user_id);

        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        // Ignore "user not found" if already deleted via cascade
        if (error && !error.message.includes("not found")) {
          throw new Error(`Failed to delete user: ${error.message}`);
        }
        result = { message: `User deleted successfully${cascadeDelCount > 0 ? `. ${cascadeDelCount} school users and the school also deleted.` : ""}` };
        break;
      }

      case "update_profile": {
        const updates: Record<string, unknown> = {};
        if (body.full_name) updates.full_name = body.full_name;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.school_id !== undefined) updates.school_id = body.school_id;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update(updates)
          .eq("id", user_id);
        if (error) throw new Error(`Failed to update profile: ${error.message}`);

        // Also update auth metadata
        if (body.full_name) {
          await supabaseAdmin.auth.admin.updateUserById(user_id, {
            user_metadata: { full_name: body.full_name },
          });
        }
        result = { message: "Profile updated successfully" };
        break;
      }

      case "update_role": {
        if (!body.new_role) throw new Error("new_role is required");
        
        // Remove old roles
        if (body.old_role) {
          await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", user_id)
            .eq("role", body.old_role);
        }

        // Add new role
        const { error } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id, role: body.new_role }, { onConflict: "user_id,role" });
        if (error) throw new Error(`Failed to update role: ${error.message}`);
        result = { message: "Role updated successfully" };
        break;
      }

      case "reset_password": {
        const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!1A`;
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: tempPassword,
        });
        if (error) throw new Error(`Failed to reset password: ${error.message}`);
        result = { message: "Password reset successfully", temp_password: tempPassword };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
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
