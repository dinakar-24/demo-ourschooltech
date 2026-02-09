
CREATE OR REPLACE FUNCTION public.log_audit_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _name text := '';
  _id uuid;
  _op text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _id := OLD.id;
    _op := 'delete';
  ELSE
    _id := NEW.id;
    IF TG_OP = 'INSERT' THEN _op := 'create'; ELSE _op := 'update'; END IF;
  END IF;

  -- Get name based on table
  IF TG_TABLE_NAME IN ('teachers', 'students', 'profiles') THEN
    IF TG_OP = 'DELETE' THEN _name := OLD.full_name; ELSE _name := NEW.full_name; END IF;
  ELSIF TG_TABLE_NAME IN ('schools', 'classes', 'exams') THEN
    IF TG_OP = 'DELETE' THEN _name := OLD.name; ELSE _name := NEW.name; END IF;
  ELSIF TG_TABLE_NAME IN ('system_announcements', 'announcements', 'homework') THEN
    IF TG_OP = 'DELETE' THEN _name := OLD.title; ELSE _name := NEW.title; END IF;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), _op, TG_TABLE_NAME, _id, jsonb_build_object('name', COALESCE(_name, '')));

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;
