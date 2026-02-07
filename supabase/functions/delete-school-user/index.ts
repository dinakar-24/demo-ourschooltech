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

    // Verify caller
    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) throw new Error("Unauthorized");

    // Check permissions
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id);

    const isSchoolAdmin = callerRoles?.some(r => r.role === "school_admin");
    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");

    if (!isSchoolAdmin && !isSuperAdmin) {
      throw new Error("Permission denied: Only admins can delete users");
    }

    const { user_id, teacher_id, student_id } = await req.json();
    if (!user_id && !teacher_id && !student_id) throw new Error("Missing user_id, teacher_id, or student_id");

    let targetUserId = user_id;

    // If only teacher_id provided, look up user_id from teachers table
    if (!targetUserId && teacher_id) {
      const { data: teacher } = await supabaseAdmin
        .from("teachers")
        .select("user_id")
        .eq("id", teacher_id)
        .single();

      targetUserId = teacher?.user_id;

      if (!targetUserId) {
        await supabaseAdmin.from("teachers").delete().eq("id", teacher_id);
        return new Response(
          JSON.stringify({ success: true, message: "Teacher record deleted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // If only student_id provided, look up user_id from students table
    if (!targetUserId && student_id) {
      const { data: student } = await supabaseAdmin
        .from("students")
        .select("user_id")
        .eq("id", student_id)
        .single();

      targetUserId = student?.user_id;

      if (!targetUserId) {
        // Delete related records
        await supabaseAdmin.from("attendance").delete().eq("student_id", student_id);
        await supabaseAdmin.from("fees").delete().eq("student_id", student_id);
        await supabaseAdmin.from("results").delete().eq("student_id", student_id);
        await supabaseAdmin.from("students").delete().eq("id", student_id);
        return new Response(
          JSON.stringify({ success: true, message: "Student record deleted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // School admins can only delete users in their own school
    if (isSchoolAdmin && !isSuperAdmin) {
      const { data: callerProfile } = await supabaseAdmin
        .from("profiles")
        .select("school_id")
        .eq("id", callingUser.id)
        .single();

      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("school_id")
        .eq("id", targetUserId)
        .single();

      if (!callerProfile?.school_id || callerProfile.school_id !== targetProfile?.school_id) {
        throw new Error("Permission denied: Can only delete users in your own school");
      }

      // School admins cannot delete other admins or super admins
      const { data: targetRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId);

      const isTargetAdmin = targetRoles?.some(r => r.role === "school_admin" || r.role === "super_admin");
      if (isTargetAdmin) {
        throw new Error("Permission denied: Cannot delete admin accounts");
      }
    }

    // Delete related records
    await supabaseAdmin.from("attendance").delete().eq("student_id", targetUserId).then(() => {});
    await supabaseAdmin.from("fees").delete().eq("student_id", targetUserId).then(() => {});
    await supabaseAdmin.from("results").delete().eq("student_id", targetUserId).then(() => {});
    await supabaseAdmin.from("teachers").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("students").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteError && !deleteError.message.includes("not found")) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "User completely deleted" }),
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
