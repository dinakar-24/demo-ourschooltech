
-- Create a public RPC to look up user's school info by email (no auth required for login flow)
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'found', true,
    'school_id', s.id,
    'school_name', s.name,
    'school_logo', s.logo,
    'school_code', s.code,
    'primary_color', s.primary_color,
    'secondary_color', s.secondary_color,
    'background_color', s.background_color,
    'splash_screen_image_url', s.splash_screen_image_url,
    'app_display_name', s.app_display_name,
    'role', ur.role,
    'user_name', p.full_name
  ) INTO result
  FROM profiles p
  LEFT JOIN schools s ON s.id = p.school_id
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.email = _email
  LIMIT 1;

  IF result IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;

  RETURN result;
END;
$$;
