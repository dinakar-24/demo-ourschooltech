
-- Fix teacher dashboard stats RPC using plpgsql to handle type casting
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_stats(_school_id uuid, _teacher_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  hw_count bigint;
  att_rate numeric;
  teacher_id_text text;
BEGIN
  teacher_id_text := _teacher_user_id::text;
  
  SELECT COUNT(*) INTO hw_count FROM public.homework WHERE assigned_by = teacher_id_text;
  
  SELECT CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE status = 'present')::numeric / COUNT(*)) * 100)
    ELSE 0
  END INTO att_rate
  FROM public.attendance
  WHERE school_id = _school_id AND date = CURRENT_DATE;
  
  result := json_build_object(
    'totalHomework', hw_count,
    'attendanceRate', att_rate
  );
  
  RETURN result;
END;
$$;
