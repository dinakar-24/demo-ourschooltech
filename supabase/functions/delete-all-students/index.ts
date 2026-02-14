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

    // Verify caller is admin
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "school_admin" || r.role === "super_admin");
    if (!isAdmin) throw new Error("Permission denied");

    const { school_id } = await req.json();
    if (!school_id) throw new Error("Missing school_id");

    // Verify admin belongs to this school
    const isSuperAdmin = roles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();
      if (profile?.school_id !== school_id) throw new Error("Permission denied: wrong school");
    }

    // Get all students for this school
    const { data: students, error: fetchErr } = await supabaseAdmin
      .from("students")
      .select("id, user_id")
      .eq("school_id", school_id);

    if (fetchErr) throw new Error(`Failed to fetch students: ${fetchErr.message}`);
    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ success: true, deleted_count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const studentIds = students.map(s => s.id);
    const userIds = [...new Set(students.map(s => s.user_id).filter(Boolean))] as string[];

    // Delete related data first (fees, attendance, results)
    await supabaseAdmin.from("fees").delete().in("student_id", studentIds);
    await supabaseAdmin.from("attendance").delete().in("student_id", studentIds);
    
    // Delete results via exam linkage
    await supabaseAdmin.from("results").delete().in("student_id", studentIds);
    
    // Delete student fee overrides
    await supabaseAdmin.from("student_fee_overrides").delete().in("student_id", studentIds);
    
    // Delete student promotions
    await supabaseAdmin.from("student_promotions").delete().in("student_id", studentIds);

    // Delete students
    const { error: deleteErr } = await supabaseAdmin
      .from("students")
      .delete()
      .eq("school_id", school_id);

    if (deleteErr) throw new Error(`Failed to delete students: ${deleteErr.message}`);

    // Delete auth accounts for student/parent users
    for (const uid of userIds) {
      // Remove roles
      await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
      // Remove profile
      await supabaseAdmin.from("profiles").delete().eq("id", uid);
      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(uid);
    }

    return new Response(
      JSON.stringify({ success: true, deleted_count: students.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
