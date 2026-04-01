
-- 1. NOTIFICATIONS: Only admins can insert (notifications come from edge functions via service role)
DROP POLICY IF EXISTS "Authenticated can receive notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'school_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 2. AUDIT LOGS: Only triggers/service role should insert (remove admin direct insert)
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

-- 3. Create a safe view for school admins to see payment config without secrets
CREATE OR REPLACE VIEW public.school_payment_config_safe AS
SELECT
  id, school_id, is_connected, online_enabled, manual_enabled,
  connection_status, locked_by_super_admin,
  super_admin_override_online, super_admin_override_manual,
  extra_charge_override, submitted_at, approved_at, approved_by,
  rejection_reason, created_at, updated_at,
  CASE WHEN cashfree_app_id IS NOT NULL AND cashfree_app_id != '' THEN '••••' || RIGHT(cashfree_app_id, 4) ELSE NULL END AS cashfree_app_id_masked,
  CASE WHEN cashfree_secret_key IS NOT NULL AND cashfree_secret_key != '' THEN '••••••••' ELSE NULL END AS cashfree_secret_masked
FROM public.school_payment_config;
