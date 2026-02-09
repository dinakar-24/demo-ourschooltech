
-- Create a reusable function to insert audit logs
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      'create',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('name', COALESCE(NEW.full_name, NEW.name, NEW.title, ''))
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('name', COALESCE(NEW.full_name, NEW.name, NEW.title, ''))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      jsonb_build_object('name', COALESCE(OLD.full_name, OLD.name, OLD.title, ''))
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to key tables
CREATE TRIGGER audit_schools
  AFTER INSERT OR UPDATE OR DELETE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_system_announcements
  AFTER INSERT OR UPDATE OR DELETE ON public.system_announcements
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_students
  AFTER INSERT OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_teachers
  AFTER INSERT OR DELETE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
