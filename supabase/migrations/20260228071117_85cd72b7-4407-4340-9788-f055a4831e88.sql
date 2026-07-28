
CREATE OR REPLACE FUNCTION public.notify_admins_on_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _admin RECORD;
  _submitter_label TEXT;
BEGIN
  _submitter_label := COALESCE(NEW.submitter_name, 'Someone');
  IF NEW.is_anonymous THEN
    _submitter_label := 'Anonymous';
  END IF;

  FOR _admin IN
    SELECT ur.user_id
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role = 'school_admin' AND p.school_id = NEW.school_id
  LOOP
    INSERT INTO notifications (user_id, school_id, title, body, type, reference_id)
    VALUES (
      _admin.user_id,
      NEW.school_id,
      'New Feedback Received',
      _submitter_label || ' submitted feedback with ' || NEW.rating || ' star rating.',
      'feedback',
      NEW.id::text::uuid
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admins_on_query()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _admin RECORD;
  _submitter_label TEXT;
BEGIN
  _submitter_label := COALESCE(NEW.submitter_name, 'A user');

  FOR _admin IN
    SELECT ur.user_id
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role = 'school_admin' AND p.school_id = NEW.school_id
  LOOP
    INSERT INTO notifications (user_id, school_id, title, body, type, reference_id)
    VALUES (
      _admin.user_id,
      NEW.school_id,
      'New Support Query: ' || NEW.ticket_number,
      _submitter_label || ' raised a ' || NEW.priority || ' priority query in ' || NEW.category || ': ' || LEFT(NEW.subject, 80),
      'query',
      NEW.id::text::uuid
    );
  END LOOP;

  RETURN NEW;
END;
$function$;
