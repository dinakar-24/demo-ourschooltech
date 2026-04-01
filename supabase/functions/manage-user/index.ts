import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Input validation ────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["super_admin", "school_admin", "teacher", "parent", "student"]);
const VALID_ACTIONS = new Set(["disable", "enable", "delete", "update_role", "update_profile", "reset_password"]);

function sanitize(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function validateUUID(val: unknown): string {
  const s = sanitize(val, 36);
  if (!UUID_RE.test(s)) throw new Error("Invalid ID format");
  return s;
}

interface ManageUserRequest {
  action: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  school_id?: string;
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

    const rawBody: ManageUserRequest = await req.json();

    // Validate action
    const action = sanitize(rawBody.action, 30);
    if (!VALID_ACTIONS.has(action)) throw new Error("Invalid action");

    // Validate user_id
    const user_id = validateUUID(rawBody.user_id);

    // Prevent self-modification for destructive actions
    if (callingUser.id === user_id && ["disable", "delete"].includes(action)) {
      throw new Error("Cannot perform this action on your own account");
    }

    let result: Record<string, unknown> = {};

    switch (action) {
      case "disable": {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: "876000h",
        });
        if (error) throw new Error(`Failed to disable user: ${error.message}`);

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
            const { data: schoolUsers } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("school_id", profile.school_id)
              .neq("id", user_id);

            if (schoolUsers && schoolUsers.length > 0) {
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

              await supabaseAdmin
                .from("schools")
                .update({ is_active: false })
                .eq("id", profile.school_id);
            }
          }
        }

        result = { message: `User disabled${cascadeCount > 0 ? `. ${cascadeCount} school users also disabled.` : ""}` };
        break;
      }

      case "enable": {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: "none",
        });
        if (error) throw new Error(`Failed to enable user: ${error.message}`);

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

              await supabaseAdmin
                .from("schools")
                .update({ is_active: true })
                .eq("id", profileEn.school_id);
            }
          }
        }

        result = { message: `User enabled${cascadeEnCount > 0 ? `. ${cascadeEnCount} school users re-enabled.` : ""}` };
        break;
      }

      case "delete": {
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
            const { data: schoolUsers } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("school_id", schoolId)
              .neq("id", user_id);

            if (schoolUsers && schoolUsers.length > 0) {
              const { data: saRoles } = await supabaseAdmin
                .from("user_roles")
                .select("user_id")
                .eq("role", "super_admin")
                .in("user_id", schoolUsers.map(u => u.id));

              const saIds = new Set((saRoles || []).map(r => r.user_id));
              const usersToDelete = schoolUsers.filter(u => !saIds.has(u.id));

              for (const u of usersToDelete) {
                await supabaseAdmin.from("teachers").delete().eq("user_id", u.id);
                await supabaseAdmin.from("students").delete().eq("user_id", u.id);
                await supabaseAdmin.from("user_roles").delete().eq("user_id", u.id);
                await supabaseAdmin.from("profiles").delete().eq("id", u.id);
                const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(u.id);
                if (!delErr || delErr.message.includes("not found")) cascadeDelCount++;
              }
            }

            await supabaseAdmin.from("schools").delete().eq("id", schoolId);
          }
        }

        await supabaseAdmin.from("teachers").delete().eq("user_id", user_id);
        await supabaseAdmin.from("students").delete().eq("user_id", user_id);
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        await supabaseAdmin.from("profiles").delete().eq("id", user_id);

        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        if (error && !error.message.includes("not found")) {
          throw new Error(`Failed to delete user: ${error.message}`);
        }
        result = { message: `User deleted${cascadeDelCount > 0 ? `. ${cascadeDelCount} school users and school also deleted.` : ""}` };
        break;
      }

      case "update_profile": {
        const updates: Record<string, unknown> = {};
        const fullName = sanitize(rawBody.full_name, 200);
        const phone = sanitize(rawBody.phone, 20).replace(/[^\d+\-\s()]/g, '');
        
        if (fullName) updates.full_name = fullName;
        if (rawBody.phone !== undefined) updates.phone = phone || null;
        if (rawBody.school_id !== undefined) {
          const sid = sanitize(rawBody.school_id, 36);
          if (sid && !UUID_RE.test(sid)) throw new Error("Invalid school_id format");
          updates.school_id = sid || null;
        }

        if (Object.keys(updates).length === 0) throw new Error("No fields to update");

        const { error } = await supabaseAdmin
          .from("profiles")
          .update(updates)
          .eq("id", user_id);
        if (error) throw new Error(`Failed to update profile: ${error.message}`);

        if (fullName) {
          await supabaseAdmin.auth.admin.updateUserById(user_id, {
            user_metadata: { full_name: fullName },
          });
        }
        result = { message: "Profile updated" };
        break;
      }

      case "update_role": {
        const newRole = sanitize(rawBody.new_role, 20);
        if (!VALID_ROLES.has(newRole)) throw new Error("Invalid role");
        
        // Prevent creating additional super_admins via this endpoint
        if (newRole === "super_admin") {
          throw new Error("Cannot assign super_admin role via this endpoint");
        }

        const oldRole = sanitize(rawBody.old_role, 20);
        if (oldRole) {
          await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", user_id)
            .eq("role", oldRole);
        }

        const { error } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id, role: newRole }, { onConflict: "user_id,role" });
        if (error) throw new Error(`Failed to update role: ${error.message}`);
        result = { message: "Role updated" };
        break;
      }

      case "reset_password": {
        // Generate a strong temporary password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let tempPassword = '';
        const array = new Uint8Array(12);
        crypto.getRandomValues(array);
        for (const b of array) tempPassword += chars[b % chars.length];
        // Ensure complexity requirements
        tempPassword = 'T' + tempPassword + '1!a';

        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: tempPassword,
        });
        if (error) throw new Error(`Failed to reset password: ${error.message}`);
        result = { message: "Password reset", temp_password: tempPassword };
        break;
      }

      default:
        throw new Error("Invalid action");
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Log internally but don't expose stack traces
    console.error("manage-user error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage.slice(0, 300) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
