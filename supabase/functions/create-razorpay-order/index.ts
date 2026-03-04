import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subscriptionId, amount, schoolId, studentCount, paymentType = 'renewal' } = await req.json();

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

    // Find or create subscription
    if (!actualSubscriptionId && schoolId) {
      const count = studentCount || 0;

      // Check if subscription already exists for this school
      const { data: existingSub } = await adminClient
        .from('subscriptions')
        .select('id, price_per_student')
        .eq('school_id', schoolId)
        .single();

      if (existingSub) {
        actualSubscriptionId = existingSub.id;
        const pricePerStudent = existingSub.price_per_student || 250;
        const total = count * pricePerStudent;
        // Update student count and total using school's configured price
        await adminClient
          .from('subscriptions')
          .update({ student_count: count, total_amount: total })
          .eq('id', existingSub.id);
      } else {
        const pricePerStudent = 250; // default for new subscriptions
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
          payment_type: paymentType,
          student_count: studentCount?.toString() || '0',
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
        payment_type: paymentType,
        student_count: studentCount || 0,
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