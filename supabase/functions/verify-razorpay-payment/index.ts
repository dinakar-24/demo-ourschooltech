import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const body = await req.text();
     const signature = req.headers.get('x-razorpay-signature');
     
     // Check if this is a webhook call or a direct verification call
     const isWebhook = !!signature;
     
     const adminClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     );
 
     if (isWebhook) {
       // Webhook verification
       const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
       
       if (!webhookSecret) {
         console.error('Webhook secret not configured');
         return new Response(
           JSON.stringify({ error: 'Webhook not configured' }),
           { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
       }
 
       // Verify webhook signature
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

          // Update payment record
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

          // Update payment status
          await adminClient
            .from('subscription_payments')
            .update({
              razorpay_payment_id: paymentId,
              status: 'success',
              paid_at: new Date().toISOString(),
            })
            .eq('id', paymentRecord.id);

          const isTopUp = paymentRecord.payment_type === 'topup';

          if (isTopUp) {
            // Top-up: only update student_count, don't touch dates
            await adminClient
              .from('subscriptions')
              .update({
                student_count: paymentRecord.student_count || paymentRecord.subscription?.student_count,
              })
              .eq('id', paymentRecord.subscription_id);
          } else {
            // Renewal: set dates to now + 1 year, activate
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            await adminClient
              .from('subscriptions')
              .update({
                status: 'active',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                student_count: paymentRecord.student_count || paymentRecord.subscription?.student_count,
              })
              .eq('id', paymentRecord.subscription_id);

            // Update school subscription status
            await adminClient
              .from('schools')
              .update({ subscription_status: 'active' })
              .eq('id', paymentRecord.school_id);
          }

          console.log(`Payment verified (${paymentRecord.payment_type}):`, paymentId);
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
 
       // Verify payment signature
       const generatedSignature = createHmac('sha256', razorpayKeySecret)
         .update(`${razorpay_order_id}|${razorpay_payment_id}`)
         .digest('hex');
 
       if (generatedSignature !== razorpay_signature) {
         return new Response(
           JSON.stringify({ error: 'Invalid payment signature', verified: false }),
           { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
       }
 
        // Update payment record
        const { data: paymentRecord, error: fetchError } = await adminClient
          .from('subscription_payments')
          .select('*')
          .eq('razorpay_order_id', razorpay_order_id)
          .single();

        if (fetchError || !paymentRecord) {
          return new Response(
            JSON.stringify({ error: 'Payment record not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update payment status
        await adminClient
          .from('subscription_payments')
          .update({
            razorpay_payment_id,
            razorpay_signature,
            status: 'success',
            paid_at: new Date().toISOString(),
          })
          .eq('id', paymentRecord.id);

        const isTopUp = paymentRecord.payment_type === 'topup';

        if (isTopUp) {
          // Top-up: only update student_count, keep existing dates
          await adminClient
            .from('subscriptions')
            .update({
              student_count: paymentRecord.student_count,
            })
            .eq('id', paymentRecord.subscription_id);
        } else {
          // Renewal: set dates, activate
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);

          await adminClient
            .from('subscriptions')
            .update({
              status: 'active',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              student_count: paymentRecord.student_count,
            })
            .eq('id', paymentRecord.subscription_id);

          // Update school
          await adminClient
            .from('schools')
            .update({ subscription_status: 'active' })
            .eq('id', paymentRecord.school_id);
        }
 
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