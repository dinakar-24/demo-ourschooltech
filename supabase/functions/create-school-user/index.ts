import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: "super_admin" | "school_admin" | "teacher" | "parent" | "student";
  school_id: string;
  avatar_url?: string; // profile photo
  employee_id?: string; // for teachers
  subjects?: string[]; // for teachers
  classes?: string[]; // for teachers
  class_name?: string; // for students/parents
  section?: string; // for students
  admission_number?: string; // for students
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client with user's auth to verify permissions
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for creating users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the calling user
    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) {
      throw new Error("Unauthorized");
    }

    // Check if calling user has permission (school_admin or super_admin)
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id);

    const isSchoolAdmin = callerRoles?.some(r => r.role === "school_admin");
    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");

    if (!isSchoolAdmin && !isSuperAdmin) {
      throw new Error("Permission denied: Only admins can create users");
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, phone, role, school_id, employee_id, subjects, classes, class_name, section, admission_number, avatar_url } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role || !school_id) {
      throw new Error("Missing required fields: email, password, full_name, role, school_id");
    }

    // School admins can only create users for their own school
    if (isSchoolAdmin && !isSuperAdmin) {
      const { data: callerProfile } = await supabaseAdmin
        .from("profiles")
        .select("school_id")
        .eq("id", callingUser.id)
        .single();

      if (callerProfile?.school_id !== school_id) {
        throw new Error("Permission denied: Can only create users for your own school");
      }

      // School admins cannot create other school_admins
      if (role === "school_admin") {
        throw new Error("Permission denied: Only super admins can create school admins");
      }
    }

    // Try to create the user
    let userId: string;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      // If email already exists in Auth (orphaned from a previous delete), reuse that account
      if (createError.message.includes("already been registered") || createError.message.includes("email_exists")) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === email);
        if (!existingUser) {
          throw new Error("Email conflict detected but user not found. Please contact support.");
        }
        userId = existingUser.id;
        // Update the existing auth user's password and metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });
        // Clean up any orphaned records
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        await supabaseAdmin.from("teachers").delete().eq("user_id", userId);
        await supabaseAdmin.from("students").delete().eq("user_id", userId);
        console.log(`Reusing existing auth user ${userId} for email ${email}`);
      } else {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
    } else {
      userId = newUser.user.id;
    }

    // Update profile with school_id and additional info
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        school_id,
        full_name,
        phone: phone || null,
        class_name: class_name || null,
        section: section || null,
        employee_id: employee_id || null,
        subjects: subjects || null,
        avatar_url: avatar_url || null,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role,
      });

    if (roleError) {
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // Create role-specific records
    if (role === "teacher") {
      const { error: teacherError } = await supabaseAdmin
        .from("teachers")
        .insert({
          user_id: userId,
          school_id,
          full_name,
          email,
          phone: phone || null,
          employee_id: employee_id || `EMP${Date.now()}`,
          subjects: subjects || [],
          classes: classes || [],
        });

      if (teacherError) {
        console.error("Teacher record error:", teacherError);
      }
    } else if (role === "student") {
      const { error: studentError } = await supabaseAdmin
        .from("students")
        .insert({
          user_id: userId,
          school_id,
          full_name,
          class_name: class_name || "Not Assigned",
          section: section || "A",
          admission_number: admission_number || `STU${Date.now()}`,
        });

      if (studentError) {
        console.error("Student record error:", studentError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          full_name,
          role,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
