-- Allow parents and students to read their school's payment config (needed to show Pay Online button)
CREATE POLICY "Parents and students can view own school payment config"
ON public.school_payment_config
FOR SELECT
TO authenticated
USING (
  school_id = get_user_school_id(auth.uid())
  AND (
    has_role(auth.uid(), 'parent'::app_role)
    OR has_role(auth.uid(), 'student'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
  )
);