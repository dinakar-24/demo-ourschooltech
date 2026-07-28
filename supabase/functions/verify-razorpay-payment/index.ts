import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function processPaymentSuccess(adminClient: any, paymentRecord: any, paymentId: string, signature?: string) {
  // Update payment status
  const updateData: any = {
    razorpay_payment_id: paymentId,
    status: 'success',
    paid_at: new Date().toISOString(),
  };
  if (signature) updateData.razorpay_signature = signature;

  await adminClient
    .from('subscription_payments')
    .update(updateData)
    .eq('id', paymentRecord.id);

  const subscription = paymentRecord.subscription;
  const isTopUp = paymentRecord.payment_type === 'topup';
  const paymentAmount = paymentRecord.amount;

  // Calculate new total_paid_amount
  const currentPaid = subscription?.total_paid_amount || 0;
  const newTotalPaid = currentPaid + paymentAmount;

  if (isTopUp) {
    // Top-up: update student_count, total_amount, and total_paid_amount
    const newStudentCount = paymentRecord.student_count || subscription?.student_count;
    const pricePerStudent = subscription?.price_per_student || 250;
    const newTotalAmount = newStudentCount * pricePerStudent;
    const remaining = newTotalAmount - newTotalPaid;

    const subUpdate: any = {
      student_count: newStudentCount,
      total_amount: newTotalAmount,
      total_paid_amount: newTotalPaid,
    };

    // Only fully activate if remaining is 0
    // If already active, keep active
    if (subscription?.status === 'active') {
      // Keep active, no date changes
    }

    await adminClient
      .from('subscriptions')
      .update(subUpdate)
      .eq('id', paymentRecord.subscription_id);
  } else {
    // Renewal/activation: update total_paid_amount, check if fully paid
    const totalAmount = subscription?.total_amount || 0;
    const remaining = totalAmount - newTotalPaid;

    const subUpdate: any = {
      total_paid_amount: newTotalPaid,
      student_count: paymentRecord.student_count || subscription?.student_count,
    };

    if (remaining <= 0) {
      // Fully paid — activate subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      subUpdate.status = 'active';
      subUpdate.start_date = startDate.toISOString();
      subUpdate.end_date = endDate.toISOString();

      await adminClient
        .from('subscriptions')
        .update(subUpdate)
        .eq('id', paymentRecord.subscription_id);

      // Update school subscription status
      await adminClient
        .from('schools')
        .update({ subscription_status: 'active' })
        .eq('id', paymentRecord.school_id);
    } else {
      // Partial payment — keep status as pending/trial, update amounts
      await adminClient
        .from('subscriptions')
        .update(subUpdate)
        .eq('id', paymentRecord.subscription_id);
    }
  }

  console.log(`Payment verified (${paymentRecord.payment_type}), amount: ${paymentAmount}, new total paid: ${newTotalPaid}:`, paymentId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const isWebhook = !!signature;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (isWebhook) {
      const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
      if (!webhookSecret) {
        console.error('Webhook secret not configured');
        return new Response(
          JSON.stringify({ error: 'Webhook not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payload = JSON.parse(body);
      const event = payload.event;

      if (event === 'payment.captured') {
        const payment = payload.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;

        const { data: paymentRecord, error: fetchError } = await adminClient
          .from('subscription_payments')
          .select('*, subscription:subscriptions(*)')
          .eq('razorpay_order_id', orderId)
          .single();

        if (fetchError || !paymentRecord) {
          console.error('Payment record not found:', orderId);
          return new Response(
            JSON.stringify({ error: 'Payment record not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await processPaymentSuccess(adminClient, paymentRecord, paymentId);
      }

      return new Response(
        JSON.stringify({ status: 'ok' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Direct verification call from frontend
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(body);

      const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
      if (!razorpayKeySecret) {
        return new Response(
          JSON.stringify({ error: 'Razorpay not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const generatedSignature = createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return new Response(
          JSON.stringify({ error: 'Invalid payment signature', verified: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: paymentRecord, error: fetchError } = await adminClient
        .from('subscription_payments')
        .select('*, subscription:subscriptions(*)')
        .eq('razorpay_order_id', razorpay_order_id)
        .single();

      if (fetchError || !paymentRecord) {
        return new Response(
          JSON.stringify({ error: 'Payment record not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await processPaymentSuccess(adminClient, paymentRecord, razorpay_payment_id, razorpay_signature);

      return new Response(
        JSON.stringify({ verified: true, message: 'Payment verified successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
