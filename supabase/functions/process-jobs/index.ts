import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.94.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Auth check: service role, anon key, the scheduler secret (pg_cron), or a super_admin JWT
    const reqBody = await req.json().catch(() => ({}));
    const cronSecret = Deno.env.get('CRON_SECRET');
    const isCron = !!cronSecret && (reqBody as any)?.cron_secret === cronSecret;

    const authHeader = req.headers.get('Authorization');
    if (!isCron && !authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = (authHeader || '').replace('Bearer ', '');
    const isServiceRole = token === serviceRoleKey;
    const isAnonKey = token === anonKey; // pg_cron uses anon key

    if (!isCron && !isServiceRole && !isAnonKey) {
      // Validate JWT - only super_admin can manually trigger
      const supabaseUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await supabaseUser.auth.getClaims(token);
      if (error || !data?.claims) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = data.claims.sub as string;
      const adminCheck = createClient(supabaseUrl, serviceRoleKey);
      const { data: roles } = await adminCheck
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const isSuperAdmin = roles?.some((r: any) => r.role === 'super_admin');
      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Claim a batch of jobs atomically
    const { data: jobs, error: claimError } = await supabase.rpc('claim_jobs', { _batch_size: 10 });

    if (claimError) {
      console.error('Failed to claim jobs:', claimError);
      return new Response(JSON.stringify({ error: 'Failed to claim jobs' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No jobs to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${jobs.length} jobs`);
    let completed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await processJob(supabase, job);
        await supabase.rpc('complete_job', { _job_id: job.id });
        completed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Job ${job.id} (${job.job_type}) failed:`, errorMessage);
        await supabase.rpc('fail_job', { _job_id: job.id, _error: errorMessage.slice(0, 2000) });
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: jobs.length, completed, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Worker error:', err);
    return new Response(JSON.stringify({ error: 'Internal worker error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// --- Job handlers ---

async function processJob(supabase: any, job: any) {
  const { job_type, payload } = job;

  switch (job_type) {
    case 'send_notification':
      await handleSendNotification(supabase, payload);
      break;

    case 'send_bulk_notifications':
      await handleBulkNotifications(supabase, payload);
      break;

    case 'generate_report':
      console.log('Report generation job:', payload);
      break;

    case 'bulk_import':
      console.log('Bulk import job:', payload);
      break;

    case 'cleanup':
      await handleCleanup(supabase, payload);
      break;

    case 'ai_predict':
      await handleAiPredict(payload);
      break;

    default:
      throw new Error(`Unknown job type: ${job_type}`);
  }
}

async function handleAiPredict(payload: any) {
  const schoolId = payload?.school_id;
  if (!schoolId) throw new Error('ai_predict job missing school_id');

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) throw new Error('CRON_SECRET is not configured');

  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-predict`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ school_id: schoolId, cron_secret: cronSecret }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ai-predict failed [${res.status}]: ${text.slice(0, 500)}`);
  }
}

async function handleSendNotification(supabase: any, payload: any) {
  const { user_ids, title, body, type, reference_id, school_id } = payload;

  if (!user_ids?.length || !title || !body) {
    throw new Error('Missing required notification fields');
  }

  const notifications = user_ids.map((uid: string) => ({
    user_id: uid,
    title,
    body,
    type: type || 'general',
    reference_id: reference_id || null,
    school_id: school_id || null,
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) throw new Error(`Notification insert failed: ${error.message}`);

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', user_ids);

  if (subs?.length) {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (vapidPublicKey && vapidPrivateKey) {
      console.log(`Would send push to ${subs.length} subscriptions`);
    }
  }
}

async function handleBulkNotifications(supabase: any, payload: any) {
  const { notifications } = payload;
  if (!notifications?.length) return;

  for (let i = 0; i < notifications.length; i += 100) {
    const batch = notifications.slice(i, i + 100);
    const { error } = await supabase.from('notifications').insert(batch);
    if (error) throw new Error(`Bulk notification batch failed: ${error.message}`);
  }
}

async function handleCleanup(supabase: any, payload: any) {
  const { target } = payload;

  if (target === 'completed_jobs') {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw new Error(`Cleanup failed: ${error.message}`);
  }

  if (target === 'error_logs') {
    const { error } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw new Error(`Error log cleanup failed: ${error.message}`);
  }
}
