
CREATE OR REPLACE FUNCTION public.get_pending_fee_student_count(_school_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT student_id)
  FROM public.fees
  WHERE school_id = _school_id AND status = 'pending';
$$;
