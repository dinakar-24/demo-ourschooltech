CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_context jsonb DEFAULT '{}',
  user_id uuid,
  school_id uuid,
  severity text NOT NULL DEFAULT 'error'
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view error logs"
ON public.error_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_type ON public.error_logs (error_type);
CREATE INDEX idx_error_logs_severity ON public.error_logs (severity);