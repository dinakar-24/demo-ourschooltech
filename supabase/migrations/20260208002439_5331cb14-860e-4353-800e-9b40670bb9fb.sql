
CREATE OR REPLACE FUNCTION public.get_user_auth_data(_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'profile', row_to_json(p),
    'role', (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    'school', CASE WHEN p.school_id IS NOT NULL THEN (
      SELECT row_to_json(s) FROM public.schools s WHERE s.id = p.school_id
    ) ELSE NULL END
  )
  FROM public.profiles p
  WHERE p.id = _user_id;
$$;
