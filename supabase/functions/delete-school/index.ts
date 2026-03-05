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
    if (!isSuperAdmin) throw new Error("Permission denied: Only super admins can delete schools");

    const { school_id } = await req.json();
    if (!school_id) throw new Error("Missing school_id");

    // Verify school exists
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id, name")
      .eq("id", school_id)
      .single();

    if (!school) throw new Error("School not found");

    console.log(`Deleting school: ${school.name} (${school_id})`);

    // 1. Collect all user IDs belonging to this school
    const { data: schoolProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("school_id", school_id);

    const userIds = (schoolProfiles || []).map(p => p.id);
    console.log(`Found ${userIds.length} users to delete`);

    // 2. Delete school data (order matters for FK constraints)

    // Fee-related (deepest first)
    const { data: invoiceIds } = await supabaseAdmin
      .from("fee_invoices")
      .select("id")
      .eq("school_id", school_id);
    const invoiceIdList = (invoiceIds || []).map(i => i.id);

    if (invoiceIdList.length > 0) {
      await supabaseAdmin.from("fee_discounts").delete().eq("school_id", school_id);
      await supabaseAdmin.from("fee_payments").delete().eq("school_id", school_id);
      await supabaseAdmin.from("payment_submissions").delete().eq("school_id", school_id);
      await supabaseAdmin.from("fee_invoice_components").delete().in("invoice_id", invoiceIdList);
    }
    await supabaseAdmin.from("fee_invoices").delete().eq("school_id", school_id);

    // Student-related
    const { data: studentIds } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("school_id", school_id);
    const studentIdList = (studentIds || []).map(s => s.id);

    if (studentIdList.length > 0) {
      await supabaseAdmin.from("student_fee_overrides").delete().in("student_id", studentIdList);
      await supabaseAdmin.from("student_promotions").delete().in("student_id", studentIdList);
      await supabaseAdmin.from("results").delete().in("student_id", studentIdList);
    }
    await supabaseAdmin.from("student_transport").delete().eq("school_id", school_id);
    await supabaseAdmin.from("attendance").delete().eq("school_id", school_id);
    await supabaseAdmin.from("fees").delete().eq("school_id", school_id);
    await supabaseAdmin.from("students").delete().eq("school_id", school_id);

    // Fee structures
    await supabaseAdmin.from("fee_structures").delete().eq("school_id", school_id);
    await supabaseAdmin.from("fee_terms").delete().eq("school_id", school_id);

    // Teachers
    await supabaseAdmin.from("teachers").delete().eq("school_id", school_id);

    // Academic
    await supabaseAdmin.from("homework").delete().eq("school_id", school_id);
    await supabaseAdmin.from("exams").delete().eq("school_id", school_id);
    await supabaseAdmin.from("timetable_images").delete().eq("school_id", school_id);

    // Sections & classes
    await supabaseAdmin.from("sections").delete().eq("school_id", school_id);
    await supabaseAdmin.from("classes").delete().eq("school_id", school_id);
    await supabaseAdmin.from("academic_years").delete().eq("school_id", school_id);

    // Communication
    await supabaseAdmin.from("announcements").delete().eq("school_id", school_id);
    await supabaseAdmin.from("online_classes").delete().eq("school_id", school_id);
    await supabaseAdmin.from("notifications").delete().eq("school_id", school_id);
    await supabaseAdmin.from("push_subscriptions").delete().eq("school_id", school_id);

    // Support & feedback
    const { data: queryIds } = await supabaseAdmin
      .from("support_queries")
      .select("id")
      .eq("school_id", school_id);
    if (queryIds && queryIds.length > 0) {
      await supabaseAdmin.from("query_responses").delete().in("query_id", queryIds.map(q => q.id));
    }
    await supabaseAdmin.from("support_queries").delete().eq("school_id", school_id);

    const { data: feedbackIds } = await supabaseAdmin
      .from("feedback")
      .select("id")
      .eq("school_id", school_id);
    if (feedbackIds && feedbackIds.length > 0) {
      await supabaseAdmin.from("feedback_responses").delete().in("feedback_id", feedbackIds.map(f => f.id));
    }
    await supabaseAdmin.from("feedback").delete().eq("school_id", school_id);

    // Gallery
    await supabaseAdmin.from("gallery_items").delete().eq("school_id", school_id);
    await supabaseAdmin.from("gallery_albums").delete().eq("school_id", school_id);

    // Transport
    await supabaseAdmin.from("transport_routes").delete().eq("school_id", school_id);

    // School holidays
    await supabaseAdmin.from("school_holidays").delete().eq("school_id", school_id);

    // Receipt counters
    await supabaseAdmin.from("school_receipt_counters").delete().eq("school_id", school_id);

    // Admin permissions
    await supabaseAdmin.from("admin_permissions").delete().eq("school_id", school_id);

    // Subscriptions
    const { data: subIds } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("school_id", school_id);
    if (subIds && subIds.length > 0) {
      await supabaseAdmin.from("subscription_payments").delete().in("subscription_id", subIds.map(s => s.id));
    }
    await supabaseAdmin.from("subscriptions").delete().eq("school_id", school_id);

    // 3. Delete all user accounts (roles, profiles, auth)
    for (const userId of userIds) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (e) {
        console.warn(`Failed to delete auth user ${userId}:`, e);
      }
    }

    // 4. Finally delete the school
    const { error: deleteSchoolError } = await supabaseAdmin
      .from("schools")
      .delete()
      .eq("id", school_id);

    if (deleteSchoolError) throw new Error(`Failed to delete school: ${deleteSchoolError.message}`);

    console.log(`School ${school.name} deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: `School "${school.name}" and all associated data deleted`, usersDeleted: userIds.length }),
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
