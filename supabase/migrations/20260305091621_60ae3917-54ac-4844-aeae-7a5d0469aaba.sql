-- Allow super admins to update students
CREATE POLICY "Super admins can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));