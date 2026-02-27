-- Fix overly permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Only allow inserts from authenticated users (triggers run as SECURITY DEFINER so this is fine)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: The trigger function log_audit_event() runs as SECURITY DEFINER,
-- so the actual inserts come from triggers. This policy ensures only
-- authenticated sessions can trigger audit log creation.