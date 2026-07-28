
CREATE OR REPLACE FUNCTION public.get_student_counts_by_class(p_school_id uuid)
RETURNS TABLE(class_name text, section text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.class_name, s.section, COUNT(*) as count
  FROM public.students s
  WHERE s.school_id = p_school_id AND s.status = 'active'
  GROUP BY s.class_name, s.section;
$$;
