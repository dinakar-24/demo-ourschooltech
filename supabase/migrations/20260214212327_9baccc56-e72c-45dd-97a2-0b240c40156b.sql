
-- Auto-create classes and sections from existing student data
INSERT INTO public.classes (school_id, name, display_order)
SELECT DISTINCT s.school_id, s.class_name, 
  CASE 
    WHEN s.class_name ~ '^\d+$' THEN CAST(s.class_name AS integer)
    ELSE 0
  END
FROM public.students s
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.school_id = s.school_id AND c.name = s.class_name
  );

-- Auto-create sections from existing student data
INSERT INTO public.sections (class_id, school_id, name)
SELECT DISTINCT c.id, c.school_id, s.section
FROM public.students s
JOIN public.classes c ON c.school_id = s.school_id AND c.name = s.class_name
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.sections sec 
    WHERE sec.class_id = c.id AND sec.name = s.section
  );

-- Create function to auto-create class/section on student insert/update
CREATE OR REPLACE FUNCTION public.auto_create_class_section()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _class_id uuid;
BEGIN
  -- Ensure class exists
  SELECT id INTO _class_id FROM public.classes
  WHERE school_id = NEW.school_id AND name = NEW.class_name;

  IF _class_id IS NULL THEN
    INSERT INTO public.classes (school_id, name, display_order)
    VALUES (
      NEW.school_id, 
      NEW.class_name,
      CASE WHEN NEW.class_name ~ '^\d+$' THEN CAST(NEW.class_name AS integer) ELSE 0 END
    )
    RETURNING id INTO _class_id;
  END IF;

  -- Ensure section exists
  IF NOT EXISTS (
    SELECT 1 FROM public.sections
    WHERE class_id = _class_id AND name = NEW.section
  ) THEN
    INSERT INTO public.sections (class_id, school_id, name)
    VALUES (_class_id, NEW.school_id, NEW.section);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER auto_class_section_on_student
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_class_section();
