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
    const url = new URL(req.url);
    const receiptNumber = url.searchParams.get("receipt_number");

    if (!receiptNumber) {
      return new Response(
        JSON.stringify({ error: "receipt_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up payment by receipt number
    const { data: payment, error: paymentError } = await supabase
      .from("fee_payments")
      .select("id, receipt_number, amount, payment_date, payment_method, student_id, invoice_id, school_id")
      .eq("receipt_number", receiptNumber)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ verified: false, error: "Receipt not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get student details
    const { data: student } = await supabase
      .from("students")
      .select("full_name, admission_number, class_name, section")
      .eq("id", payment.student_id)
      .single();

    // Get school name
    const { data: school } = await supabase
      .from("schools")
      .select("name, code")
      .eq("id", payment.school_id)
      .single();

    // Get invoice for total/balance
    const { data: invoice } = await supabase
      .from("fee_invoices")
      .select("total_amount, paid_amount, balance, status")
      .eq("id", payment.invoice_id)
      .single();

    return new Response(
      JSON.stringify({
        verified: true,
        receipt_number: payment.receipt_number,
        amount_paid: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        student_name: student?.full_name || "N/A",
        admission_number: student?.admission_number || "N/A",
        class_name: student?.class_name || "",
        section: student?.section || "",
        school_name: school?.name || "N/A",
        invoice_status: invoice?.status || "N/A",
        total_amount: invoice?.total_amount || 0,
        remaining_balance: invoice?.balance || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
