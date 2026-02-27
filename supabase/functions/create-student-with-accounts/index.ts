import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateStudentRequest {
  full_name: string;
  admission_number: string;
  class_name: string;
  section: string;
  roll_number?: number;
  gender?: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  alternate_phone?: string;
  student_email?: string;
  parent_email?: string;
  blood_group?: string;
  avatar_url?: string;
  school_id: string;
}

interface CreatedAccount {
  role: string;
  email: string;
  password: string;
  name: string;
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

    const isAdmin = callerRoles?.some(r => r.role === "school_admin" || r.role === "super_admin");
    if (!isAdmin) throw new Error("Permission denied");

    const body: CreateStudentRequest = await req.json();
    const {
      full_name, admission_number, class_name, section, roll_number,
      gender, date_of_birth, parent_name, parent_phone, alternate_phone,
      student_email, parent_email, blood_group, avatar_url, school_id,
    } = body;

    if (!full_name || !admission_number || !class_name || !section || !school_id) {
      throw new Error("Missing required fields");
    }

    // Verify admin belongs to this school
    const isSuperAdmin = callerRoles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin) {
      const { data: callerProfile } = await supabaseAdmin
        .from("profiles")
        .select("school_id")
        .eq("id", callingUser.id)
        .single();
      if (callerProfile?.school_id !== school_id) {
        throw new Error("Permission denied: wrong school");
      }
    }

    const createdAccounts: CreatedAccount[] = [];

    // ── Helper: create or reuse auth user ──
    async function ensureAuthUser(email: string, password: string, name: string) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (createError) {
        if (createError.message.includes("already been registered") || createError.message.includes("email_exists")) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existing = users?.find(u => u.email === email);
          if (!existing) throw new Error(`Email conflict for ${email}`);
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password, email_confirm: true, user_metadata: { full_name: name },
          });
          await supabaseAdmin.from("user_roles").delete().eq("user_id", existing.id);
          return existing.id;
        }
        throw createError;
      }
      return newUser.user.id;
    }

    const studentEmailTrimmed = student_email?.trim() || null;
    const parentEmailTrimmed = parent_email?.trim() || null;
    const sameEmail = studentEmailTrimmed && parentEmailTrimmed && studentEmailTrimmed === parentEmailTrimmed;

    let studentUserId: string | null = null;
    let parentUserId: string | null = null;

    if (sameEmail) {
      // Same email for both → single account with both roles (backward-compatible)
      const password = `Student@${admission_number}`;
      const userId = await ensureAuthUser(studentEmailTrimmed!, password, full_name);

      await supabaseAdmin.from("profiles").update({
        school_id, full_name, class_name, section,
        phone: parent_phone || null,
      }).eq("id", userId);

      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "student" });
      const { data: existingParentRole } = await supabaseAdmin
        .from("user_roles").select("id").eq("user_id", userId).eq("role", "parent").single();
      if (!existingParentRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "parent" });
      }

      studentUserId = userId;
      parentUserId = userId;

      createdAccounts.push({ role: "Student", email: studentEmailTrimmed!, password, name: full_name });
      createdAccounts.push({ role: "Parent", email: parentEmailTrimmed!, password: "Parent@123", name: parent_name || `Parent of ${full_name}` });
    } else {
      // Separate accounts
      if (studentEmailTrimmed) {
        const studentPassword = `Student@${admission_number}`;
        studentUserId = await ensureAuthUser(studentEmailTrimmed, studentPassword, full_name);

        await supabaseAdmin.from("profiles").update({
          school_id, full_name, class_name, section,
        }).eq("id", studentUserId);

        await supabaseAdmin.from("user_roles").insert({ user_id: studentUserId, role: "student" });

        createdAccounts.push({ role: "Student", email: studentEmailTrimmed, password: studentPassword, name: full_name });
      }

      if (parentEmailTrimmed) {
        const parentPassword = "Parent@123";
        const parentName = parent_name || `Parent of ${full_name}`;
        parentUserId = await ensureAuthUser(parentEmailTrimmed, parentPassword, parentName);

        await supabaseAdmin.from("profiles").update({
          school_id, full_name: parentName,
          phone: parent_phone || null,
        }).eq("id", parentUserId);

        await supabaseAdmin.from("user_roles").insert({ user_id: parentUserId, role: "parent" });

        createdAccounts.push({ role: "Parent", email: parentEmailTrimmed, password: parentPassword, name: parentName });
      }
    }

    // ── Create student record ──
    const { data: studentRecord, error: studentError } = await supabaseAdmin
      .from("students")
      .insert({
        user_id: studentUserId, 
        parent_user_id: parentUserId,
        school_id, full_name, admission_number, class_name, section,
        roll_number: roll_number || null, gender: gender || null,
        date_of_birth: date_of_birth || null, parent_name: parent_name || null,
        parent_phone: parent_phone || null, alternate_phone: alternate_phone || null,
        student_email: studentEmailTrimmed,
        parent_email: parentEmailTrimmed,
        blood_group: blood_group || null, avatar_url: avatar_url || null, status: "active",
      })
      .select().single();

    if (studentError) {
      console.error("Student insert error:", studentError);
      throw new Error(`Failed to create student record: ${studentError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        student: studentRecord,
        created_accounts: createdAccounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
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
