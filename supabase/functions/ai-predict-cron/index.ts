// Nightly scheduler: queues one risk-scoring run per AI-enabled active school.
// Called by pg_cron with the anon key; work is done asynchronously by process-jobs.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = serviceKey;

    // Auth: service role, anon key (pg_cron) or the shared cron secret.
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const body = await req.json().catch(() => ({}));
    const cronSecret = Deno.env.get('CRON_SECRET');
    const allowed =
      token === serviceRoleKey || token === anonKey || (!!cronSecret && body?.cron_secret === cronSecret);
    if (!allowed) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: schools, error } = await admin
      .from('schools')
      .select('id, name, ai_settings')
      .eq('is_active', true)
      .limit(2000);
    if (error) return json({ error: error.message }, 500);

    const targets = (schools || []).filter((s: any) => (s.ai_settings?.enabled ?? true) !== false);
    if (!targets.length) return json({ queued: 0, message: 'No AI-enabled schools' });

    // Spread runs so a large tenant count never hits the gateway at once.
    const now = Date.now();
    const rows = targets.map((s: any, i: number) => ({
      job_type: 'ai_predict',
      payload: { school_id: s.id },
      school_id: s.id,
      priority: 0,
      scheduled_for: new Date(now + i * 20_000).toISOString(),
    }));

    for (let i = 0; i < rows.length; i += 200) {
      const { error: insErr } = await admin.from('jobs').insert(rows.slice(i, i + 200));
      if (insErr) return json({ error: insErr.message }, 500);
    }

    return json({ queued: rows.length });
  } catch (err) {
    console.error('ai-predict-cron error', err);
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
});