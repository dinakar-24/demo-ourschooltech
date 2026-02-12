import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subscriptionId, amount, schoolId, studentCount } = await req.json();

    if (!amount) {
      return new Response(
        JSON.stringify({ error: 'Missing amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: 'Razorpay not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let actualSubscriptionId = subscriptionId;

    // Create subscription via admin client if doesn't exist
    if (!actualSubscriptionId && schoolId) {
      const pricePerStudent = 250;
      const count = studentCount || 0;
      const total = count * pricePerStudent;

      const { data: newSub, error: createError } = await adminClient
        .from('subscriptions')
        .insert({
          school_id: schoolId,
          plan_type: 'yearly',
          student_count: count,
          price_per_student: pricePerStudent,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create subscription:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      actualSubscriptionId = newSub.id;
    }

    if (!actualSubscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Missing subscriptionId or schoolId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscription details
    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select('*, school:schools(name, code)')
      .eq('id', actualSubscriptionId)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Razorpay order
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: 'INR',
        receipt: `sub_${actualSubscriptionId.slice(0, 8)}`,
        notes: {
          subscription_id: actualSubscriptionId,
          school_id: subscription.school_id,
          school_name: subscription.school?.name,
        },
      }),
    });

    const order = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('Razorpay order creation failed:', order);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payment record
    const { error: paymentError } = await adminClient
      .from('subscription_payments')
      .insert({
        subscription_id: actualSubscriptionId,
        school_id: subscription.school_id,
        amount: amount,
        razorpay_order_id: order.id,
        status: 'pending',
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});