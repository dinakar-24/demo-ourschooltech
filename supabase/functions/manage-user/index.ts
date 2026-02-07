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
        result = { message: "User disabled successfully" };
        break;
      }

      case "enable": {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: "none",
        });
        if (error) throw new Error(`Failed to enable user: ${error.message}`);
        result = { message: "User enabled successfully" };
        break;
      }

      case "delete": {
        // Delete role-specific records first
        await supabaseAdmin.from("teachers").delete().eq("user_id", user_id);
        await supabaseAdmin.from("students").delete().eq("user_id", user_id);
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        await supabaseAdmin.from("profiles").delete().eq("id", user_id);

        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        if (error) throw new Error(`Failed to delete user: ${error.message}`);
        result = { message: "User deleted successfully" };
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
