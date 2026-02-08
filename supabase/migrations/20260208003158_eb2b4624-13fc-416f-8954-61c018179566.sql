
-- 1. Create a secure RPC for public school search (only non-sensitive fields)
CREATE OR REPLACE FUNCTION public.search_schools_public(_query text)
RETURNS TABLE(id uuid, name text, code text, city text, logo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, s.code, s.city, s.logo
  FROM public.schools s
  WHERE s.is_active = true
    AND (
      s.name ILIKE '%' || _query || '%'
      OR s.code ILIKE '%' || _query || '%'
      OR s.city ILIKE '%' || _query || '%'
    )
  LIMIT 10;
$$;

-- 2. Drop the overly permissive public SELECT policy on schools
DROP POLICY IF EXISTS "Schools are publicly viewable for login" ON public.schools;

-- 3. Add authenticated-only SELECT policy for school members
CREATE POLICY "Users can view their own school"
  ON public.schools
  FOR SELECT
  TO authenticated
  USING (id = get_user_school_id(auth.uid()));

-- 4. Keep existing super_admin ALL policy (already exists)

-- 5. Add RLS policies to super_admin_otp table (deny all client access)
CREATE POLICY "Deny all client reads on OTPs"
  ON public.super_admin_otp
  FOR SELECT
  TO authenticated, anon
  USING (false);

CREATE POLICY "Deny all client inserts on OTPs"
  ON public.super_admin_otp
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Deny all client updates on OTPs"
  ON public.super_admin_otp
  FOR UPDATE
  TO authenticated, anon
  USING (false);

CREATE POLICY "Deny all client deletes on OTPs"
  ON public.super_admin_otp
  FOR DELETE
  TO authenticated, anon
  USING (false);
