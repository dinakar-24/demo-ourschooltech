
-- CRITICAL: Add missing index on students.user_id (used in RLS for student self-access)
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students USING btree (user_id);

-- CRITICAL: Add missing index on students.parent_email (used in RLS for parent access JOINs)
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON public.students USING btree (parent_email);

-- Remove duplicate index (idx_user_roles_user is identical to idx_user_roles_user_id)
DROP INDEX IF EXISTS idx_user_roles_user;

-- Add composite index for has_role() function optimization (user_id + role)
-- The unique constraint already covers this, but ensure planner prefers it
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles USING btree (user_id, role);

-- Add index on profiles.id + school_id for get_user_school_id() covering index
CREATE INDEX IF NOT EXISTS idx_profiles_id_school ON public.profiles USING btree (id, school_id);

-- Add index for fee_payments school+student lookup
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_student ON public.fee_payments USING btree (school_id, student_id);

-- Add index for audit_logs entity_type for filtered queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type, created_at DESC);
