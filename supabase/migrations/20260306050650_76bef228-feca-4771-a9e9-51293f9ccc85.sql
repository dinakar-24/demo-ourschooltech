
-- Auto-cleanup expired OTPs (runs on every insert to keep table small)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete expired OTPs older than 1 hour
  DELETE FROM public.super_admin_otp WHERE expires_at < now() - interval '1 hour';
  DELETE FROM public.password_reset_otp WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

-- Trigger on super_admin_otp inserts
DROP TRIGGER IF EXISTS trg_cleanup_super_admin_otp ON public.super_admin_otp;
CREATE TRIGGER trg_cleanup_super_admin_otp
  AFTER INSERT ON public.super_admin_otp
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_otps();

-- Trigger on password_reset_otp inserts  
DROP TRIGGER IF EXISTS trg_cleanup_password_reset_otp ON public.password_reset_otp;
CREATE TRIGGER trg_cleanup_password_reset_otp
  AFTER INSERT ON public.password_reset_otp
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_otps();

-- Add index on audit_logs for retention cleanup (by created_at)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_asc ON public.audit_logs USING btree (created_at ASC);
