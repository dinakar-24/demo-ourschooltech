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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Missing required environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { invoice_id, student_id, school_id, amount, customer_name, customer_email, customer_phone } = await req.json();

    if (!invoice_id || !student_id || !school_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

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
      .select("cashfree_app_id, cashfree_secret_key, is_connected, connection_status, locked_by_super_admin")
      .eq("school_id", school_id)
      .single();

    if (pcErr || !payConfig) {
      console.error("Payment config error:", pcErr?.message);
      return new Response(JSON.stringify({ error: "Online payments not configured for this school" }), { status: 400, headers: corsHeaders });
    }

    if (!payConfig.is_connected || payConfig.connection_status !== "connected") {
      return new Response(JSON.stringify({ error: "Online payments not approved for this school" }), { status: 400, headers: corsHeaders });
    }

    const appId = payConfig.cashfree_app_id;
    const secretKey = payConfig.cashfree_secret_key;

    if (!appId || !secretKey || appId === "••••••••" || secretKey === "••••••••") {
      console.error("Invalid Cashfree credentials - masked or empty");
      return new Response(JSON.stringify({ error: "Payment gateway credentials are invalid. Please contact your school admin." }), { status: 400, headers: corsHeaders });
    }

    // Get extra charge from system settings
    const { data: sysSettings } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "payment_config")
      .single();

    const globalConfig = (sysSettings?.value as Record<string, unknown>) ?? {};
    const extraChargePct = Number(globalConfig.extra_charge_pct ?? 0);
    const extraCharge = Math.round((amount * extraChargePct / 100) * 100) / 100;
    const totalCharged = amount + extraCharge;

    // Determine Cashfree environment based on app ID prefix
    // Test app IDs typically start with "TEST" prefix
    const isTestMode = appId.toUpperCase().startsWith("TEST");
    const cfBaseUrl = isTestMode
      ? "https://sandbox.cashfree.com/pg/orders"
      : "https://api.cashfree.com/pg/orders";

    // Create Cashfree order
    const orderId = `ORD_${school_id.substring(0, 8)}_${Date.now()}`;
    
    console.log(`Creating Cashfree order: ${orderId}, mode: ${isTestMode ? "SANDBOX" : "PRODUCTION"}, amount: ${totalCharged}`);

    const cfResponse = await fetch(cfBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
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
          notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
        },
      }),
    });

    if (!cfResponse.ok) {
      const cfError = await cfResponse.text();
      console.error("Cashfree API error:", cfError);
      
      // Provide a more helpful error message
      let userMessage = "Failed to create payment order";
      if (cfError.includes("authentication")) {
        userMessage = "Payment gateway authentication failed. The school's Cashfree credentials may be invalid.";
      }
      
      return new Response(JSON.stringify({ error: userMessage }), { status: 500, headers: corsHeaders });
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
      cashfree_mode: isTestMode ? "sandbox" : "production",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("create-cashfree-order error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
