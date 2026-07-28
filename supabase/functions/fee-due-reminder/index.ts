import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check: only allow service role or valid admin JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceRoleKey;
    const isAnonKey = token === anonKey; // pg_cron uses anon key

    if (!isServiceRole && !isAnonKey) {
      // Validate JWT - only super_admin or school_admin can trigger
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

      const hasAdmin = roles?.some((r: any) => ["super_admin", "school_admin"].includes(r.role));
      if (!hasAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all pending fees grouped by student
    const { data: pendingFees, error: feesError } = await supabase
      .from("fees")
      .select("id, student_id, fee_type, amount, due_date, school_id")
      .eq("status", "pending")
      .order("due_date", { ascending: true });

    if (feesError) {
      console.error("Failed to fetch pending fees:", feesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch pending fees" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingFees?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending fees", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group fees by student
    const studentFees = new Map<string, { fees: typeof pendingFees; schoolId: string }>();
    for (const fee of pendingFees) {
      const existing = studentFees.get(fee.student_id);
      if (existing) {
        existing.fees.push(fee);
      } else {
        studentFees.set(fee.student_id, { fees: [fee], schoolId: fee.school_id });
      }
    }

    const studentIds = Array.from(studentFees.keys());

    // Get student details with parent info
    const { data: students } = await supabase
      .from("students")
      .select("id, user_id, parent_email, full_name")
      .in("id", studentIds);

    if (!students?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No students found", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect parent emails to look up their user IDs
    const parentEmails = students
      .map((s) => s.parent_email)
      .filter(Boolean) as string[];

    let parentMap = new Map<string, string>();
    if (parentEmails.length > 0) {
      const { data: parents } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", parentEmails);

      if (parents) {
        for (const p of parents) {
          parentMap.set(p.email, p.id);
        }
      }
    }

    // Send notifications
    let notifiedCount = 0;

    for (const student of students) {
      const info = studentFees.get(student.id);
      if (!info) continue;

      const totalDue = info.fees.reduce((sum, f) => sum + Number(f.amount), 0);
      const feeCount = info.fees.length;

      const userIds: string[] = [];
      if (student.user_id) userIds.push(student.user_id);
      if (student.parent_email && parentMap.has(student.parent_email)) {
        userIds.push(parentMap.get(student.parent_email)!);
      }

      if (userIds.length === 0) continue;

      const notificationRows = userIds.map((uid) => ({
        user_id: uid,
        school_id: info.schoolId,
        title: "Fee Reminder",
        body: `${student.full_name} has ${feeCount} pending fee${feeCount > 1 ? "s" : ""} totalling ₹${totalDue.toLocaleString("en-IN")}`,
        type: "fee",
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notificationRows);

      if (!insertError) {
        notifiedCount += userIds.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, notified: notifiedCount, studentsWithDues: studentIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fee-due-reminder error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
