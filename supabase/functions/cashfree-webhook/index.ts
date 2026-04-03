import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(body: string, signature: string, secretKey: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return computed === signature;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const signature = req.headers.get("x-webhook-signature") || "";

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cfOrderId = payload?.data?.order?.order_id;
    const cfPaymentId = payload?.data?.payment?.cf_payment_id;
    const paymentStatus = payload?.data?.payment?.payment_status;

    if (!cfOrderId) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get the payment record
    const { data: onlinePayment, error: opErr } = await adminClient
      .from("online_payments")
      .select("*, school_id")
      .eq("cf_order_id", cfOrderId)
      .single();

    if (opErr || !onlinePayment) {
      console.error("Payment record not found for order:", cfOrderId);
      return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Already processed or explicitly expired
    if (onlinePayment.status === "SUCCESS") {
      return new Response(JSON.stringify({ status: "already_processed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (onlinePayment.status === "EXPIRED") {
      console.log("Ignoring webhook for expired order:", cfOrderId);
      return new Response(JSON.stringify({ status: "expired_ignored" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify signature with school's secret
    const { data: payConfig } = await adminClient
      .from("school_payment_config")
      .select("cashfree_secret_key")
      .eq("school_id", onlinePayment.school_id)
      .single();

    if (payConfig?.cashfree_secret_key) {
      const isValid = await verifySignature(rawBody, signature, payConfig.cashfree_secret_key);
      if (!isValid) {
        console.error("Invalid webhook signature for order:", cfOrderId);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 403, headers: corsHeaders });
      }
    }

    if (paymentStatus === "SUCCESS") {
      // Record the fee payment using existing RPC
      const { error: rpcErr } = await adminClient.rpc("record_fee_payment", {
        _school_id: onlinePayment.school_id,
        _invoice_id: onlinePayment.invoice_id,
        _student_id: onlinePayment.student_id,
        _amount: onlinePayment.amount,
        _payment_method: "online_cashfree",
        _transaction_id: String(cfPaymentId || cfOrderId),
        _payment_date: new Date().toISOString().split("T")[0],
        _notes: `Online payment via Cashfree. Extra charge: ₹${onlinePayment.extra_charge}`,
      });

      if (rpcErr) {
        console.error("record_fee_payment error:", rpcErr);
        return new Response(JSON.stringify({ error: "Failed to record payment" }), { status: 500, headers: corsHeaders });
      }

      // Update online_payments
      await adminClient
        .from("online_payments")
        .update({
          status: "SUCCESS",
          cf_payment_id: String(cfPaymentId || ""),
          transaction_ref: payload?.data?.payment?.payment_group || "",
          verified_at: new Date().toISOString(),
        })
        .eq("id", onlinePayment.id);

    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      await adminClient
        .from("online_payments")
        .update({
          status: "FAILED",
          cf_payment_id: String(cfPaymentId || ""),
          transaction_ref: payload?.data?.payment?.payment_message || "Payment failed",
        })
        .eq("id", onlinePayment.id);
    }

    return new Response(JSON.stringify({ status: "ok" }), { headers: corsHeaders });

  } catch (err) {
    console.error("cashfree-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
