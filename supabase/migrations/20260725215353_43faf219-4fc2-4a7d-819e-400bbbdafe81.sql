
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS ai_settings jsonb NOT NULL DEFAULT
  '{"enabled": true, "model": "auto", "tone": "friendly", "custom_instructions": "", "allowed_roles": ["parent","student","teacher","school_admin"]}'::jsonb;

-- Seed global AI defaults if not present
INSERT INTO public.system_settings (key, value)
VALUES (
  'ai_defaults',
  '{"enabled": true, "model": "auto", "tone": "friendly", "custom_instructions": "", "allowed_roles": ["parent","student","teacher","school_admin","super_admin"]}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Public RPC so the client can fetch just AI-enable state cheaply (no service key needed)
CREATE OR REPLACE FUNCTION public.get_school_ai_settings(_school_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(s.ai_settings, '{}'::jsonb)
  FROM public.schools s
  WHERE s.id = _school_id
$$;

REVOKE EXECUTE ON FUNCTION public.get_school_ai_settings(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_school_ai_settings(uuid) TO authenticated;
