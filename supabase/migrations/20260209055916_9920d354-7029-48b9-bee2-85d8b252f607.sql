
-- Fix audit trigger to handle teachers table (no 'name' column)
CREATE OR REPLACE FUNCTION public.log_audit_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _name := COALESCE(
      CASE WHEN TG_TABLE_NAME IN ('teachers','students','profiles') THEN OLD.full_name ELSE NULL END,
      CASE WHEN TG_TABLE_NAME NOT IN ('teachers','students','profiles') THEN OLD.name ELSE NULL END,
      ''
    );
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, jsonb_build_object('name', _name));
    RETURN OLD;
  ELSE
    _name := COALESCE(
      CASE WHEN TG_TABLE_NAME IN ('teachers','students','profiles') THEN NEW.full_name ELSE NULL END,
      CASE WHEN TG_TABLE_NAME NOT IN ('teachers','students','profiles') THEN NEW.name ELSE NULL END,
      ''
    );
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('name', _name)
    );
    RETURN NEW;
  END IF;
END;
$function$;
