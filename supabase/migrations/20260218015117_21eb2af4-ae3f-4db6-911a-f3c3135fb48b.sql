
-- Create get_school_by_code function for subdomain tenant resolution
-- Called before authentication, returns only non-sensitive fields
CREATE OR REPLACE FUNCTION public.get_school_by_code(_code text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'id', s.id,
    'name', s.name,
    'code', s.code,
    'logo', s.logo,
    'primary_color', s.primary_color,
    'accent_color', s.accent_color,
    'is_active', s.is_active
  )
  FROM public.schools s
  WHERE s.code = _code AND s.is_active = true
  LIMIT 1;
$$;
