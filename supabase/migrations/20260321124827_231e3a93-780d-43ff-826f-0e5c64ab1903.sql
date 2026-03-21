-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_fee_invoices_school_status ON fee_invoices(school_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_school_status ON fees(school_id, status);
CREATE INDEX IF NOT EXISTS idx_homework_class_due ON homework(class_id, due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id, class_name, section) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON students(parent_email);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_online_classes_teacher ON online_classes(school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice ON fee_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school ON fee_payments(school_id);

-- Server-side invoice stats RPC
CREATE OR REPLACE FUNCTION get_invoice_stats(_school_id uuid)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT json_build_object(
    'totalDue', COALESCE(SUM(total_amount), 0),
    'collected', COALESCE(SUM(paid_amount), 0),
    'pending', COALESCE(SUM(CASE WHEN status != 'paid' AND due_date >= CURRENT_DATE THEN balance ELSE 0 END), 0),
    'overdue', COALESCE(SUM(CASE WHEN status != 'paid' AND due_date < CURRENT_DATE THEN balance ELSE 0 END), 0)
  ) FROM fee_invoices WHERE school_id = _school_id;
$$;

-- Combined admin dashboard RPC
CREATE OR REPLACE FUNCTION get_admin_dashboard_full(_school_id uuid)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  result json;
  _today date := CURRENT_DATE;
  _today_text text := _today::text;
BEGIN
  SELECT json_build_object(
    'stats', json_build_object(
      'totalStudents', (SELECT COUNT(*) FROM students WHERE school_id = _school_id AND status = 'active'),
      'totalTeachers', (SELECT COUNT(*) FROM teachers WHERE school_id = _school_id),
      'feeCollected', (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE school_id = _school_id AND status = 'paid'),
      'attendanceRate', (
        SELECT CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE status = 'present')::numeric / COUNT(*)) * 100)
          ELSE 0 END
        FROM attendance WHERE school_id = _school_id AND date = _today
      )
    ),
    'pendingFees', (SELECT COUNT(DISTINCT student_id) FROM fees WHERE school_id = _school_id AND status = 'pending'),
    'todayFeesCollected', (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE school_id = _school_id AND status = 'paid' AND paid_date = _today_text),
    'todayAdmissions', (SELECT COUNT(*) FROM students WHERE school_id = _school_id AND created_at >= _today::timestamp),
    'todayNotices', (SELECT COUNT(*) FROM announcements WHERE school_id = _school_id AND created_at >= _today::timestamp)
  ) INTO result;
  RETURN result;
END;
$$;

-- Parent child lookup RPC (eliminates 2 sequential queries)
CREATE OR REPLACE FUNCTION get_parent_children(_user_id uuid)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
  FROM (
    SELECT s.id, s.full_name, s.class_name, s.section, s.roll_number, 
           s.admission_number, s.parent_name, s.parent_email, s.avatar_url
    FROM students s
    JOIN profiles p ON s.parent_email = p.email
    WHERE p.id = _user_id AND s.status = 'active'
  ) s;
$$;