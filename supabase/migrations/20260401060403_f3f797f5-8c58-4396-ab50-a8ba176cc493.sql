
-- 1. PAYMENT CONFIG
DROP POLICY IF EXISTS "School admins can view own payment config" ON public.school_payment_config;
CREATE POLICY "School admins can view own payment config"
  ON public.school_payment_config FOR SELECT
  USING (
    (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role))
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 2. STUDENT PII
DROP POLICY IF EXISTS "Users can view students in their school" ON public.students;
CREATE POLICY "Staff can view students in their school"
  ON public.students FOR SELECT
  USING (
    (school_id = get_user_school_id(auth.uid()) AND (
      has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
    ))
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
CREATE POLICY "Students can view own record"
  ON public.students FOR SELECT
  USING (has_role(auth.uid(), 'student'::app_role) AND user_id = auth.uid());
CREATE POLICY "Parents can view own children"
  ON public.students FOR SELECT
  USING (
    has_role(auth.uid(), 'parent'::app_role) AND parent_email = (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 3. TEACHER DATA
DROP POLICY IF EXISTS "Users can view teachers in their school" ON public.teachers;
CREATE POLICY "Staff can view teachers in their school"
  ON public.teachers FOR SELECT
  USING (
    (school_id = get_user_school_id(auth.uid()) AND (
      has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
    ))
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
CREATE POLICY "Students parents can view teachers"
  ON public.teachers FOR SELECT
  USING (
    school_id = get_user_school_id(auth.uid()) AND (
      has_role(auth.uid(), 'student'::app_role) OR has_role(auth.uid(), 'parent'::app_role)
    )
  );

-- 4. STORAGE: Announcements - admin only
DROP POLICY IF EXISTS "Admins can upload announcement images" ON storage.objects;
CREATE POLICY "Admins can upload announcement images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'announcements' AND (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Admins can update announcement images" ON storage.objects;
CREATE POLICY "Admins can update announcement images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'announcements' AND (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Admins can delete announcement images" ON storage.objects;
CREATE POLICY "Admins can delete announcement images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'announcements' AND (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

-- 5. STORAGE: Avatar ownership
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6. STORAGE: Payment proofs - owner + admin
DROP POLICY IF EXISTS "Parents can view own payment proofs" ON storage.objects;
CREATE POLICY "Users can view own payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'school_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  ));

-- 7. ROLE ESCALATION: Prevent school_admin from assigning super_admin
DROP POLICY IF EXISTS "Admins can manage roles in their school" ON public.user_roles;
CREATE POLICY "Admins can manage roles in their school"
  ON public.user_roles FOR ALL
  USING (
    (has_role(auth.uid(), 'school_admin'::app_role) AND user_id IN (
      SELECT id FROM public.profiles WHERE school_id = get_user_school_id(auth.uid())
    ))
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    (has_role(auth.uid(), 'school_admin'::app_role) AND role != 'super_admin'::app_role AND user_id IN (
      SELECT id FROM public.profiles WHERE school_id = get_user_school_id(auth.uid())
    ))
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 8. JOBS: Admin only inserts
DROP POLICY IF EXISTS "Authenticated users can enqueue jobs" ON public.jobs;
CREATE POLICY "Admins can enqueue jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 9. "Service can manage all jobs" - this is for service role, keep but scope it
DROP POLICY IF EXISTS "Service can manage all jobs" ON public.jobs;

-- 10. PERFORMANCE LOGS: Admin only
DROP POLICY IF EXISTS "Authenticated users can insert performance logs" ON public.performance_logs;
CREATE POLICY "Admins can insert performance logs"
  ON public.performance_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 11. AUDIT LOGS: Admin only insert
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 12. ERROR LOGS: Admin only insert
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.error_logs;
CREATE POLICY "Admins can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
