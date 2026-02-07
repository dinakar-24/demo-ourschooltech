-- Allow super_admin to view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to view all user roles (the existing ALL policy covers this but 
-- the specific SELECT policy restricts it, so we need an explicit SELECT policy)
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::app_role));