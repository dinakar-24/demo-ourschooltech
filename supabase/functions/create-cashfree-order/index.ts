import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CASHFREE_API_VERSION = "2023-08-01";
const PAYMENT_IN_PROGRESS_MESSAGE = "A payment attempt is already in progress for this invoice. Please complete it or wait a few minutes before retrying.";
const PAYMENT_CONFIRMATION_MESSAGE = "Your previous payment is still being confirmed. Please refresh in a moment before trying again.";

type OnlinePaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

type PendingOrderResolution =
  | { canProceed: true }
  | { canProceed: false; error: string };

function isTestMode(appId: string) {
  return appId.toUpperCase().startsWith("TEST");
}

// Cashfree requires a valid Indian mobile (10 digits starting 6-9).
// Strip +91, spaces, dashes, brackets; return null if not recoverable.
function sanitizeIndianPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  // Drop a leading 91 country code if present and length is 12
  const trimmed = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (trimmed.length === 10 && /^[6-9]/.test(trimmed)) return trimmed;
  return null;
}

function getCashfreeBaseUrl(appId: string) {
  return isTestMode(appId)
    ? "https://sandbox.cashfree.com/pg/orders"
    : "https://api.cashfree.com/pg/orders";
}

function getCashfreeHeaders(appId: string, secretKey: string, includeJson = false) {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": CASHFREE_API_VERSION,
  };
}

function normalizeOrderStatus(status: string): OnlinePaymentStatus | "ACTIVE" | "UNKNOWN" {
  switch (status.toUpperCase()) {
    case "PAID":
      return "SUCCESS";
    case "FAILED":
    case "CANCELLED":
      return "FAILED";
    case "EXPIRED":
    case "TERMINATED":
      return "EXPIRED";
    case "ACTIVE":
    case "PENDING":
    case "INITIALIZED":
    case "OPEN":
    case "TERMINATION_REQUESTED":
      return "ACTIVE";
    default:
      return "UNKNOWN";
  }
}

async function updateOnlinePaymentStatus(
  adminClient: any,
  paymentId: string,
  status: OnlinePaymentStatus,
  transactionRef: string,
) {
  const { error } = await adminClient
    .from("online_payments")
    .update({
      status,
      transaction_ref: transactionRef,
    })
    .eq("id", paymentId);

  if (error) {
    console.error("Failed to update online payment status:", error);
  }
}

async function reconcileExistingPendingOrder({
  adminClient,
  existingOrder,
  cashfreeBaseUrl,
  appId,
  secretKey,
}: {
  adminClient: any;
  existingOrder: { id: string; cf_order_id: string | null };
  cashfreeBaseUrl: string;
  appId: string;
  secretKey: string;
}): Promise<PendingOrderResolution> {
  if (!existingOrder.cf_order_id) {
    await updateOnlinePaymentStatus(
      adminClient,
      existingOrder.id,
      "EXPIRED",
      "Released stale local payment without Cashfree order id",
    );
    return { canProceed: true };
  }

  const orderLookupResponse = await fetch(`${cashfreeBaseUrl}/${existingOrder.cf_order_id}`, {
    method: "GET",
    headers: getCashfreeHeaders(appId, secretKey),
  });

  if (orderLookupResponse.status === 404) {
    await updateOnlinePaymentStatus(
      adminClient,
      existingOrder.id,
      "EXPIRED",
      "Released retry lock after Cashfree order was not found",
    );
    return { canProceed: true };
  }

  if (!orderLookupResponse.ok) {
    const lookupError = await orderLookupResponse.text();
    console.error("Failed to fetch existing Cashfree order:", existingOrder.cf_order_id, lookupError);
    return { canProceed: false, error: PAYMENT_IN_PROGRESS_MESSAGE };
  }

  const orderData = await orderLookupResponse.json();
  const rawOrderStatus = String(orderData?.order_status || "").toUpperCase();
  const normalizedStatus = normalizeOrderStatus(rawOrderStatus);

  if (normalizedStatus === "SUCCESS") {
    await updateOnlinePaymentStatus(
      adminClient,
      existingOrder.id,
      "PENDING",
      `Cashfree order is ${rawOrderStatus}; awaiting webhook confirmation`,
    );
    return { canProceed: false, error: PAYMENT_CONFIRMATION_MESSAGE };
  }

  if (normalizedStatus === "FAILED" || normalizedStatus === "EXPIRED") {
    await updateOnlinePaymentStatus(
      adminClient,
      existingOrder.id,
      normalizedStatus,
      `Released retry lock after Cashfree order became ${rawOrderStatus}`,
    );
    return { canProceed: true };
  }

  const terminateResponse = await fetch(`${cashfreeBaseUrl}/${existingOrder.cf_order_id}`, {
    method: "PATCH",
    headers: getCashfreeHeaders(appId, secretKey, true),
    body: JSON.stringify({ order_status: "TERMINATED" }),
  });

  if (!terminateResponse.ok) {
    const terminateError = await terminateResponse.text();
    console.error("Failed to terminate existing Cashfree order:", existingOrder.cf_order_id, terminateError);
    return { canProceed: false, error: PAYMENT_IN_PROGRESS_MESSAGE };
  }

  await updateOnlinePaymentStatus(
    adminClient,
    existingOrder.id,
    "EXPIRED",
    `Released previous Cashfree session (${rawOrderStatus || "UNKNOWN"}) before retry`,
  );

  return { canProceed: true };
}

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

    const sanitizedPhone = sanitizeIndianPhone(customer_phone);

    if (!invoice_id || !student_id || !school_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

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

    const cashfreeBaseUrl = getCashfreeBaseUrl(appId);
    const staleBefore = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { error: expireErr } = await adminClient
      .from("online_payments")
      .update({
        status: "EXPIRED",
        transaction_ref: "Expired pending payment session",
      })
      .eq("invoice_id", invoice_id)
      .eq("status", "PENDING")
      .lt("created_at", staleBefore);

    if (expireErr) {
      console.error("Failed to expire stale pending orders:", expireErr);
    }

    const { data: existingOrder } = await adminClient
      .from("online_payments")
      .select("id, created_at, cf_order_id")
      .eq("invoice_id", invoice_id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOrder) {
      const resolution = await reconcileExistingPendingOrder({
        adminClient,
        existingOrder,
        cashfreeBaseUrl,
        appId,
        secretKey,
      });

      if (!resolution.canProceed) {
        return new Response(JSON.stringify({ error: resolution.error }), { status: 409, headers: corsHeaders });
      }
    }

    const { data: sysSettings } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "payment_config")
      .single();

    const globalConfig = (sysSettings?.value as Record<string, unknown>) ?? {};
    const extraChargePct = Number(globalConfig.extra_charge_pct ?? 0);
    const extraCharge = Math.round((amount * extraChargePct / 100) * 100) / 100;
    const totalCharged = amount + extraCharge;

    const cashfreeMode = isTestMode(appId) ? "sandbox" : "production";
    const orderId = `ORD_${school_id.substring(0, 8)}_${Date.now()}`;

    console.log(`Creating Cashfree order: ${orderId}, mode: ${cashfreeMode.toUpperCase()}, amount: ${totalCharged}`);

    const cfResponse = await fetch(cashfreeBaseUrl, {
      method: "POST",
      headers: getCashfreeHeaders(appId, secretKey, true),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: totalCharged,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_name: customer_name || "Parent",
          customer_email: customer_email || "parent@school.com",
          // Cashfree validates as Indian mobile; fall back to a valid-format placeholder
          customer_phone: sanitizedPhone || "9999999999",
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

      let userMessage = "Failed to create payment order";
      if (cfError.includes("authentication")) {
        userMessage = "Payment gateway authentication failed. The school's Cashfree credentials may be invalid.";
      }

      return new Response(JSON.stringify({ error: userMessage }), { status: 500, headers: corsHeaders });
    }

    const cfData = await cfResponse.json();

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
      cashfree_mode: cashfreeMode,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("create-cashfree-order error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});