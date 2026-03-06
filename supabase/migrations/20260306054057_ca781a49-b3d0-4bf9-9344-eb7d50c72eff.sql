-- Job queue table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  error_message text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  school_id uuid,
  user_id uuid,
  priority integer NOT NULL DEFAULT 0
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all jobs
CREATE POLICY "Super admins can view all jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- School admins can view jobs in their school
CREATE POLICY "School admins can view school jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));

-- Authenticated users can insert jobs
CREATE POLICY "Authenticated users can enqueue jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Indexes for efficient job processing
CREATE INDEX idx_jobs_status_scheduled ON public.jobs (status, scheduled_for) WHERE status = 'queued';
CREATE INDEX idx_jobs_created_at ON public.jobs (created_at DESC);
CREATE INDEX idx_jobs_school_id ON public.jobs (school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_jobs_type ON public.jobs (job_type);

-- DB function to claim a batch of jobs atomically
CREATE OR REPLACE FUNCTION public.claim_jobs(_batch_size integer DEFAULT 10)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.jobs
  SET status = 'processing',
      started_at = now(),
      attempts = attempts + 1,
      updated_at = now()
  WHERE id IN (
    SELECT id FROM public.jobs
    WHERE status = 'queued'
      AND scheduled_for <= now()
    ORDER BY priority DESC, created_at ASC
    LIMIT _batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- DB function to mark a job as completed
CREATE OR REPLACE FUNCTION public.complete_job(_job_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.jobs
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = _job_id;
$$;

-- DB function to fail a job (requeue or mark dead)
CREATE OR REPLACE FUNCTION public.fail_job(_job_id uuid, _error text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job public.jobs;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = _job_id;
  IF _job.attempts >= _job.max_attempts THEN
    UPDATE public.jobs
    SET status = 'dead', error_message = _error, updated_at = now()
    WHERE id = _job_id;
  ELSE
    -- Exponential backoff: 30s * 2^(attempts-1)
    UPDATE public.jobs
    SET status = 'queued',
        error_message = _error,
        scheduled_for = now() + (30 * power(2, _job.attempts - 1))::integer * interval '1 second',
        updated_at = now()
    WHERE id = _job_id;
  END IF;
END;
$$;

-- DB function for job queue stats (used by system health dashboard)
CREATE OR REPLACE FUNCTION public.get_job_queue_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'queued', (SELECT COUNT(*) FROM public.jobs WHERE status = 'queued'),
    'processing', (SELECT COUNT(*) FROM public.jobs WHERE status = 'processing'),
    'completed_24h', (SELECT COUNT(*) FROM public.jobs WHERE status = 'completed' AND completed_at > now() - interval '24 hours'),
    'failed_24h', (SELECT COUNT(*) FROM public.jobs WHERE status = 'dead' AND updated_at > now() - interval '24 hours'),
    'retrying', (SELECT COUNT(*) FROM public.jobs WHERE status = 'queued' AND attempts > 0)
  );
$$;