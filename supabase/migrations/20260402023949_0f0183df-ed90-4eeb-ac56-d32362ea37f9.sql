-- Allow school admins to INSERT their own payment config row
CREATE POLICY "School admins can insert own payment config"
ON public.school_payment_config
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = get_user_school_id(auth.uid())
  AND has_role(auth.uid(), 'school_admin'::app_role)
);