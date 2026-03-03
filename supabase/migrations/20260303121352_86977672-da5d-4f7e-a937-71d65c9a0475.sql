
-- Allow students to submit feedback
CREATE POLICY "Students can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (
  school_id = get_user_school_id(auth.uid())
  AND submitted_by = auth.uid()
  AND has_role(auth.uid(), 'student'::app_role)
);

-- Allow students to submit support queries
CREATE POLICY "Students can submit queries"
ON public.support_queries
FOR INSERT
WITH CHECK (
  school_id = get_user_school_id(auth.uid())
  AND submitted_by = auth.uid()
  AND has_role(auth.uid(), 'student'::app_role)
);
