
-- 1. Safe client-side event logging RPC
CREATE OR REPLACE FUNCTION public.safe_log_client_event(
  _event_type text,
  _source text,
  _duration_ms integer DEFAULT 0,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input lengths
  IF length(_event_type) > 50 THEN
    RAISE EXCEPTION 'event_type too long';
  END IF;
  IF length(_source) > 200 THEN
    RAISE EXCEPTION 'source too long';
  END IF;
  IF _duration_ms < 0 OR _duration_ms > 600000 THEN
    RAISE EXCEPTION 'invalid duration';
  END IF;
  -- Limit details size (prevent log flooding)
  IF length(_details::text) > 2000 THEN
    _details := '{"truncated": true}'::jsonb;
  END IF;

  INSERT INTO public.performance_logs (log_type, source, duration_ms, details, school_id)
  VALUES (
    _event_type,
    _source,
    _duration_ms,
    _details,
    (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );
END;
$$;

-- 2. Safe error logging RPC
CREATE OR REPLACE FUNCTION public.safe_log_client_error(
  _error_type text,
  _error_message text,
  _severity text DEFAULT 'error',
  _context jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate
  IF length(_error_type) > 100 THEN _error_type := left(_error_type, 100); END IF;
  IF length(_error_message) > 1000 THEN _error_message := left(_error_message, 1000); END IF;
  IF _severity NOT IN ('info', 'warning', 'error') THEN _severity := 'error'; END IF;
  IF length(_context::text) > 2000 THEN _context := '{"truncated": true}'::jsonb; END IF;

  INSERT INTO public.error_logs (error_type, error_message, severity, error_context, user_id, school_id)
  VALUES (
    _error_type,
    _error_message,
    _severity,
    _context,
    auth.uid(),
    (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );
END;
$$;

-- 3. Drop overly-restrictive direct INSERT policies (use RPCs instead)
DROP POLICY IF EXISTS "Admins can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can insert performance logs" ON public.performance_logs;
