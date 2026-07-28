
-- Add performance_logs table for tracking slow queries and API metrics
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL DEFAULT 'slow_query',
  source text NOT NULL,
  duration_ms integer NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can read performance logs
CREATE POLICY "Super admins can read performance logs"
ON public.performance_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow authenticated users to insert (for client-side logging)
CREATE POLICY "Authenticated users can insert performance logs"
ON public.performance_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for querying by type and time
CREATE INDEX idx_performance_logs_type_created ON public.performance_logs (log_type, created_at DESC);

-- Auto-cleanup: add to weekly cron cleanup (performance logs older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_performance_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.performance_logs WHERE created_at < now() - interval '30 days';
$$;

-- RPC to get performance summary for system health dashboard
CREATE OR REPLACE FUNCTION public.get_performance_summary()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'slow_queries_24h', (SELECT COUNT(*) FROM performance_logs WHERE log_type = 'slow_query' AND created_at > now() - interval '24 hours'),
    'avg_duration_ms', (SELECT COALESCE(ROUND(AVG(duration_ms)), 0) FROM performance_logs WHERE created_at > now() - interval '24 hours'),
    'max_duration_ms', (SELECT COALESCE(MAX(duration_ms), 0) FROM performance_logs WHERE created_at > now() - interval '24 hours'),
    'by_source', COALESCE((
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT source, COUNT(*) as count, ROUND(AVG(duration_ms)) as avg_ms
        FROM performance_logs
        WHERE created_at > now() - interval '24 hours'
        GROUP BY source
        ORDER BY count DESC
        LIMIT 10
      ) s
    ), '[]'::json)
  );
$$;
