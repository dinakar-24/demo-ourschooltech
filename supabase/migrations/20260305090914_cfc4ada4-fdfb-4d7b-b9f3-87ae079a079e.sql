-- Allow Super Admins to view all classes
CREATE POLICY "Super admins can view all classes"
ON public.classes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow Super Admins to view all sections
CREATE POLICY "Super admins can view all sections"
ON public.sections
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow Super Admins to view all teachers
CREATE POLICY "Super admins can view all teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));