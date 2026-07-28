
-- Re-create RPCs and indexes that were in the failed migration

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.attendance (school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date_status ON public.attendance (school_id, date, status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance (student_id, date);
CREATE INDEX IF NOT EXISTS idx_students_school_status ON public.students (school_id, status);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON public.students (school_id, class_name);
CREATE INDEX IF NOT EXISTS idx_students_school_class_section ON public.students (school_id, class_name, section);
CREATE INDEX IF NOT EXISTS idx_fees_school_status ON public.fees (school_id, status);
CREATE INDEX IF NOT EXISTS idx_fees_school_student ON public.fees (school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fees_school_due_date ON public.fees (school_id, due_date);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON public.teachers (school_id);
CREATE INDEX IF NOT EXISTS idx_exams_school_date ON public.exams (school_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_homework_school_class ON public.homework (school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_homework_assigned_by ON public.homework (assigned_by);
CREATE INDEX IF NOT EXISTS idx_announcements_school_active ON public.announcements (school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_results_exam ON public.results (exam_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results (student_id);
CREATE INDEX IF NOT EXISTS idx_schools_active ON public.schools (is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles (school_id);

-- RPCs
CREATE OR REPLACE FUNCTION public.get_fee_stats(_school_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'totalDue', COALESCE(SUM(amount), 0),
    'collected', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
    'pending', COALESCE(SUM(CASE WHEN status = 'pending' AND due_date >= CURRENT_DATE THEN amount ELSE 0 END), 0),
    'overdue', COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0)
  )
  FROM public.fees
  WHERE school_id = _school_id;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_summary(_school_id uuid, _date date)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'present', COUNT(*) FILTER (WHERE status = 'present'),
    'absent', COUNT(*) FILTER (WHERE status = 'absent'),
    'late', COUNT(*) FILTER (WHERE status = 'late'),
    'total', COUNT(*)
  )
  FROM public.attendance
  WHERE school_id = _school_id AND date = _date;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_attendance_by_class(_school_id uuid, _date date)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'classWise', COALESCE((
      SELECT json_agg(row_data ORDER BY class_name)
      FROM (
        SELECT
          s.class_name,
          COUNT(*) AS total,
          COUNT(a.id) FILTER (WHERE a.status = 'present') AS present,
          COUNT(a.id) FILTER (WHERE a.status = 'absent') AS absent,
          COUNT(a.id) FILTER (WHERE a.status = 'late') AS late,
          CASE WHEN COUNT(*) > 0
            THEN ROUND((COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric / COUNT(*)) * 100, 1)
            ELSE 0
          END AS percentage
        FROM public.students s
        LEFT JOIN public.attendance a ON a.student_id = s.id AND a.date = _date AND a.school_id = _school_id
        WHERE s.school_id = _school_id AND s.status = 'active'
        GROUP BY s.class_name
      ) row_data
    ), '[]'::json),
    'totals', (
      SELECT json_build_object(
        'present', COALESCE(COUNT(a.id) FILTER (WHERE a.status = 'present'), 0),
        'absent', COALESCE(COUNT(a.id) FILTER (WHERE a.status = 'absent'), 0),
        'late', COALESCE(COUNT(a.id) FILTER (WHERE a.status = 'late'), 0),
        'total', COUNT(*)
      )
      FROM public.students s
      LEFT JOIN public.attendance a ON a.student_id = s.id AND a.date = _date AND a.school_id = _school_id
      WHERE s.school_id = _school_id AND s.status = 'active'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(_school_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'totalStudents', (SELECT COUNT(*) FROM public.students WHERE school_id = _school_id AND status = 'active'),
    'totalTeachers', (SELECT COUNT(*) FROM public.teachers WHERE school_id = _school_id),
    'feeCollected', (SELECT COALESCE(SUM(amount), 0) FROM public.fees WHERE school_id = _school_id AND status = 'paid'),
    'attendanceRate', (
      SELECT CASE WHEN COUNT(*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE status = 'present')::numeric / COUNT(*)) * 100)
        ELSE 0
      END
      FROM public.attendance
      WHERE school_id = _school_id AND date = CURRENT_DATE
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_super_admin_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'totalSchools', (SELECT COUNT(*) FROM public.schools),
    'totalStudents', (SELECT COUNT(*) FROM public.students),
    'totalTeachers', (SELECT COUNT(*) FROM public.teachers),
    'activeSubscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_role_counts()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'all', (SELECT COUNT(*) FROM public.profiles),
    'super_admin', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'super_admin'),
    'school_admin', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'school_admin'),
    'teacher', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'teacher'),
    'parent', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'parent'),
    'student', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'student'),
    'no_role', (
      SELECT COUNT(*) FROM public.profiles p
      WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_cities()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(SELECT DISTINCT city FROM public.schools WHERE city IS NOT NULL ORDER BY city);
$$;
