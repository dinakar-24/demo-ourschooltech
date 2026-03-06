
-- Rate limiting table for login/OTP attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text,
  attempt_type text NOT NULL DEFAULT 'login', -- 'login', 'otp_request', 'otp_verify', 'password_reset'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by IP + type + time
CREATE INDEX idx_login_attempts_ip_type_time 
  ON public.login_attempts USING btree (ip_address, attempt_type, created_at DESC);

-- Auto-cleanup old attempts (older than 24 hours)
CREATE INDEX idx_login_attempts_cleanup 
  ON public.login_attempts USING btree (created_at);

-- RLS: No client access — only edge functions via service role
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to login_attempts"
  ON public.login_attempts
  FOR ALL
  USING (false);

-- Helper function to check rate limit (called from edge functions via service role)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _ip text,
  _type text,
  _max_attempts int DEFAULT 5,
  _window_minutes int DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _count int;
  _oldest timestamptz;
BEGIN
  -- Count recent attempts
  SELECT count(*), min(created_at) INTO _count, _oldest
  FROM public.login_attempts
  WHERE ip_address = _ip 
    AND attempt_type = _type
    AND created_at > now() - (_window_minutes || ' minutes')::interval;

  -- Record this attempt
  INSERT INTO public.login_attempts (ip_address, attempt_type, email)
  VALUES (_ip, _type, null);

  -- Cleanup old entries (older than 24h) opportunistically
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '24 hours';

  IF _count >= _max_attempts THEN
    RETURN json_build_object(
      'allowed', false,
      'attempts', _count,
      'retry_after_seconds', EXTRACT(EPOCH FROM (_oldest + (_window_minutes || ' minutes')::interval - now()))::int
    );
  END IF;

  RETURN json_build_object('allowed', true, 'attempts', _count + 1);
END;
$$;
