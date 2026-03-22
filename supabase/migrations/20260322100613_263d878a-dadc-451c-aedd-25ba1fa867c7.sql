
-- Add verification_attempts column to track per-OTP verify attempts
ALTER TABLE public.password_reset_otp ADD COLUMN IF NOT EXISTS verification_attempts integer NOT NULL DEFAULT 0;

-- Add device_id column for device-based rate limiting
ALTER TABLE public.password_reset_otp ADD COLUMN IF NOT EXISTS device_id text;

-- Add device_id column to login_attempts for device-based throttling
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS device_id text;

-- Index for faster device-based lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_device_type ON public.login_attempts(device_id, attempt_type, created_at) WHERE device_id IS NOT NULL;

-- Index for email-based lookups (already partially exists, adding specific one)
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_type ON public.login_attempts(email, attempt_type, created_at) WHERE email IS NOT NULL;

-- Function: check rate limit by email (no IP blocking)
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
  _email text,
  _type text,
  _max_attempts integer DEFAULT 3,
  _window_minutes integer DEFAULT 5
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count int;
  _oldest timestamptz;
BEGIN
  SELECT count(*), min(created_at) INTO _count, _oldest
  FROM public.login_attempts
  WHERE email = _email
    AND attempt_type = _type
    AND created_at > now() - (_window_minutes || ' minutes')::interval;

  -- Record this attempt
  INSERT INTO public.login_attempts (ip_address, attempt_type, email)
  VALUES ('n/a', _type, _email);

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

-- Function: check rate limit by device_id
CREATE OR REPLACE FUNCTION public.check_device_rate_limit(
  _device_id text,
  _type text,
  _max_attempts integer DEFAULT 5,
  _window_minutes integer DEFAULT 5
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count int;
  _oldest timestamptz;
BEGIN
  IF _device_id IS NULL OR _device_id = '' THEN
    RETURN json_build_object('allowed', true, 'attempts', 0);
  END IF;

  SELECT count(*), min(created_at) INTO _count, _oldest
  FROM public.login_attempts
  WHERE device_id = _device_id
    AND attempt_type = _type
    AND created_at > now() - (_window_minutes || ' minutes')::interval;

  -- Record this attempt
  INSERT INTO public.login_attempts (ip_address, attempt_type, device_id)
  VALUES ('n/a', _type, _device_id);

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
