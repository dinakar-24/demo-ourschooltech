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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { invoice_id, student_id, school_id, amount, customer_name, customer_email, customer_phone } = await req.json();

    if (!invoice_id || !student_id || !school_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify invoice exists and amount is valid
    const { data: invoice, error: invErr } = await adminClient
      .from("fee_invoices")
      .select("id, balance, school_id, status")
      .eq("id", invoice_id)
      .eq("school_id", school_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: corsHeaders });
    }
    if (invoice.status === "paid") {
      return new Response(JSON.stringify({ error: "Invoice already paid" }), { status: 400, headers: corsHeaders });
    }
    if (amount > Number(invoice.balance)) {
      return new Response(JSON.stringify({ error: "Amount exceeds balance" }), { status: 400, headers: corsHeaders });
    }

    // Check for duplicate pending orders
    const { data: existingOrder } = await adminClient
      .from("online_payments")
      .select("id")
      .eq("invoice_id", invoice_id)
      .eq("status", "PENDING")
      .maybeSingle();

    if (existingOrder) {
      return new Response(JSON.stringify({ error: "A pending payment already exists for this invoice" }), { status: 409, headers: corsHeaders });
    }

    // Get school's Cashfree credentials
    const { data: payConfig, error: pcErr } = await adminClient
      .from("school_payment_config")
      .select("cashfree_app_id, cashfree_secret_key, is_connected")
      .eq("school_id", school_id)
      .single();

    if (pcErr || !payConfig || !payConfig.is_connected || !payConfig.cashfree_app_id || !payConfig.cashfree_secret_key) {
      return new Response(JSON.stringify({ error: "Online payments not configured for this school" }), { status: 400, headers: corsHeaders });
    }

    // Get extra charge from system settings
    const { data: sysSettings } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "payment_config")
      .single();

    const extraChargePct = sysSettings?.value?.extra_charge_pct ?? 0;
    const extraCharge = Math.round((amount * extraChargePct / 100) * 100) / 100;
    const totalCharged = amount + extraCharge;

    // Create Cashfree order
    const orderId = `ORD_${school_id.substring(0, 8)}_${Date.now()}`;
    const cfResponse = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": payConfig.cashfree_app_id,
        "x-client-secret": payConfig.cashfree_secret_key,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: totalCharged,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_name: customer_name || "Parent",
          customer_email: customer_email || "parent@school.com",
          customer_phone: customer_phone || "9999999999",
        },
        order_meta: {
          return_url: `${req.headers.get("origin") || ""}/parent/fees?payment_status={order_status}&order_id={order_id}`,
          notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cashfree-webhook`,
        },
      }),
    });

    if (!cfResponse.ok) {
      const cfError = await cfResponse.text();
      console.error("Cashfree API error:", cfError);
      return new Response(JSON.stringify({ error: "Failed to create payment order" }), { status: 500, headers: corsHeaders });
    }

    const cfData = await cfResponse.json();

    // Insert online_payments record
    await adminClient.from("online_payments").insert({
      school_id,
      student_id,
      invoice_id,
      amount,
      extra_charge: extraCharge,
      total_charged: totalCharged,
      cf_order_id: orderId,
      status: "PENDING",
      method: "ONLINE",
    });

    return new Response(JSON.stringify({
      payment_session_id: cfData.payment_session_id,
      cf_order_id: orderId,
      order_amount: totalCharged,
      extra_charge: extraCharge,
      base_amount: amount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("create-cashfree-order error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
