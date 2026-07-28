-- Performance indexes for 200K+ users scale
CREATE INDEX IF NOT EXISTS idx_attendance_school_student ON attendance(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_fees_school_student ON fees(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_homework_class_due ON homework(class_id, due_date);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_school_created ON feedback(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_queries_school ON support_queries(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_classes_school ON online_classes(school_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_school_active ON announcements(school_id, is_active, created_at DESC);