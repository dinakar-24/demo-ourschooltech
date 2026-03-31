
-- Composite indexes for high-frequency queries at scale
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_online_payments_school_status_created ON online_payments(school_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_school_created ON announcements(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_homework_school_class_due ON homework(school_id, class_id, due_date);
CREATE INDEX IF NOT EXISTS idx_homework_assigned_by ON homework(assigned_by);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_school_status ON fee_invoices(school_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_school_created ON feedback(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_school_class_status ON students(school_id, class_name, status);
