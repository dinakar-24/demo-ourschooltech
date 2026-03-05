CREATE POLICY "Super admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));