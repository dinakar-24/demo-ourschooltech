
-- Revoke EXECUTE from anon on internal-only SECURITY DEFINER functions.
-- Keep public: lookup_user_by_email, search_schools_public, get_school_by_code, get_school_logo_by_id (needed pre-login).

REVOKE EXECUTE ON FUNCTION public.apply_fee_discount(uuid, uuid, uuid, numeric, text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_fee_payment(uuid, uuid, uuid, numeric, text, text, text, date, text, date, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_jobs(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_job(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fail_job(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_full(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_attendance_by_class(uuid, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_attendance_summary(uuid, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_fee_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_fee_stats(uuid, date, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_invoice_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pending_fee_student_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_parent_dashboard(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_parent_children(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_teacher_dashboard_stats(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_teacher_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_super_admin_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_role_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_distinct_cities() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_student_counts_by_class(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_job_queue_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_performance_summary() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_receipt_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_school_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_auth_data(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.safe_log_client_event(text, text, integer, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.safe_log_client_error(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_performance_logs() FROM anon;
