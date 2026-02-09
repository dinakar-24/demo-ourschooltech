
CREATE OR REPLACE FUNCTION public.get_teacher_stats(_school_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total integer;
  _unique_subjects integer;
  _avg_classes numeric;
  _all_subjects text[];
BEGIN
  SELECT count(*) INTO _total
  FROM teachers WHERE school_id = _school_id;

  SELECT array_agg(DISTINCT sub)
  INTO _all_subjects
  FROM teachers, unnest(subjects) AS sub
  WHERE school_id = _school_id;

  _unique_subjects := coalesce(array_length(_all_subjects, 1), 0);

  SELECT coalesce(round(avg(coalesce(array_length(classes, 1), 0))), 0)
  INTO _avg_classes
  FROM teachers WHERE school_id = _school_id;

  RETURN json_build_object(
    'total', _total,
    'unique_subjects', _unique_subjects,
    'avg_classes', _avg_classes
  );
END;
$$;
