
-- Optimize get_fee_stats: add optional date range to prevent full-table scans at scale
CREATE OR REPLACE FUNCTION public.get_fee_stats(_school_id uuid, _start_date date DEFAULT NULL, _end_date date DEFAULT NULL)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'totalDue', COALESCE(SUM(amount), 0),
    'collected', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
    'pending', COALESCE(SUM(CASE WHEN status = 'pending' AND due_date >= CURRENT_DATE THEN amount ELSE 0 END), 0),
    'overdue', COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0)
  )
  FROM public.fees
  WHERE school_id = _school_id
    AND (_start_date IS NULL OR due_date >= _start_date)
    AND (_end_date IS NULL OR due_date <= _end_date);
$$;
