
-- System settings key-value store for super admin configuration
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Super admins can read and write all settings
CREATE POLICY "Super admins can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- All authenticated users can read settings (needed for defaults to apply)
CREATE POLICY "Authenticated users can read system settings"
  ON public.system_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings
INSERT INTO public.system_settings (key, value) VALUES
  ('school_defaults', '{"student_limit": 500, "subscription_plan": "trial", "trial_duration": 30, "price_per_student": 100}'::jsonb),
  ('academic_defaults', '{"session_start_month": "april", "timezone": "asia-kolkata"}'::jsonb),
  ('account_defaults', '{"auto_create_parents": true, "require_email_verification": true, "allow_self_registration": false}'::jsonb),
  ('notifications', '{"subscription_expiry_alerts": true, "new_school_registration": true, "payment_failure_alerts": true, "maintenance_notices": false}'::jsonb),
  ('email_config', '{"smtp_server": "", "port": "587", "sender_email": "noreply@ourschooltech.in", "sender_name": "Our School Tech"}'::jsonb),
  ('sms_config', '{"enabled": false, "provider": "", "api_key": ""}'::jsonb),
  ('branding', '{"platform_name": "Our School Tech", "domain": "ourschooltech.in", "support_email": "support@ourschooltech.in", "support_phone": ""}'::jsonb),
  ('theme', '{"primary_color": "#0F766E", "accent_color": "#E69500"}'::jsonb),
  ('password_policy', '{"min_length": 8, "require_uppercase": true, "require_special": true, "expiry_days": "never"}'::jsonb),
  ('session_security', '{"timeout_minutes": "60", "require_2fa": false, "ip_allowlisting": false, "max_failed_attempts": 5}'::jsonb);
