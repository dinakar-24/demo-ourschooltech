CREATE OR REPLACE FUNCTION public.get_school_by_code(_code text)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'id', s.id,
    'name', s.name,
    'code', s.code,
    'subdomain', s.subdomain,
    'logo', s.logo,
    'primary_color', s.primary_color,
    'accent_color', s.accent_color,
    'secondary_color', s.secondary_color,
    'background_color', s.background_color,
    'splash_screen_image_url', s.splash_screen_image_url,
    'app_display_name', s.app_display_name,
    'app_short_name', s.app_short_name,
    'is_active', s.is_active
  )
  FROM public.schools s
  WHERE (s.code = _code OR s.subdomain = _code)
  LIMIT 1;
$function$;