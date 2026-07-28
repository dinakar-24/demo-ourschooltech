import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["school_admin", "teacher", "parent", "student"]);

function sanitize(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function validateUUID(val: unknown, fieldName: string): string {
  const s = sanitize(val, 36);
  if (!UUID_RE.test(s)) throw new Error(`Invalid ${fieldName} format`);
  return s;
}

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: string;
  school_id: string;
  avatar_url?: string;
  employee_id?: string;
  subjects?: string[];
  classes?: string[];
  class_name?: string;
  section?: string;
  admission_number?: string;
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

    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id);

    const isSchoolAdmin = callerRoles?.some(r => r.role === "school_admin");
    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");

    if (!isSchoolAdmin && !isSuperAdmin) {
      throw new Error("Permission denied: Only admins can create users");
    }

    const rawBody: CreateUserRequest = await req.json();

    // ── Input validation ──────────────────────────────────────────
    const email = sanitize(rawBody.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email format");

    const password = rawBody.password;
    if (!password || password.length < 8) throw new Error("Password must be at least 8 characters");
    if (password.length > 128) throw new Error("Password too long");

    const full_name = sanitize(rawBody.full_name, 200);
    if (!full_name) throw new Error("Full name is required");

    const role = sanitize(rawBody.role, 20);
    if (!VALID_ROLES.has(role)) throw new Error("Invalid role");

    const school_id = validateUUID(rawBody.school_id, "school_id");

    const phone = rawBody.phone ? sanitize(rawBody.phone, 20).replace(/[^\d+\-\s()]/g, '') : null;
    const employee_id = rawBody.employee_id ? sanitize(rawBody.employee_id, 50) : null;
    const class_name = rawBody.class_name ? sanitize(rawBody.class_name, 50) : null;
    const section = rawBody.section ? sanitize(rawBody.section, 10) : null;
    const admission_number = rawBody.admission_number ? sanitize(rawBody.admission_number, 50) : null;
    const avatar_url = rawBody.avatar_url ? sanitize(rawBody.avatar_url, 1000) : null;
    const subjects = Array.isArray(rawBody.subjects) ? rawBody.subjects.map(s => sanitize(s, 100)).filter(Boolean).slice(0, 50) : null;
    const classes = Array.isArray(rawBody.classes) ? rawBody.classes.map(s => sanitize(s, 100)).filter(Boolean).slice(0, 50) : null;

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

      if (role === "school_admin") {
        throw new Error("Permission denied: Only super admins can create school admins");
      }
    }

    // ── Create or reuse auth user ─────────────────────────────────
    let userId: string;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      if (createError.message.includes("already been registered") || createError.message.includes("email_exists")) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === email);
        if (!existingUser) {
          throw new Error("Email conflict detected. Please contact support.");
        }
        userId = existingUser.id;
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        await supabaseAdmin.from("teachers").delete().eq("user_id", userId);
        await supabaseAdmin.from("students").delete().eq("user_id", userId);
      } else {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
    } else {
      userId = newUser.user.id;
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        school_id,
        full_name,
        phone,
        class_name,
        section,
        employee_id,
        subjects,
        avatar_url,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });

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
          phone,
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
        user: { id: userId, email, full_name, role },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("create-school-user error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage.slice(0, 300) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
