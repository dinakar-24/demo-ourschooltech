
-- 1. Add missing indexes for gallery, online_payments, and payment config
CREATE INDEX IF NOT EXISTS idx_gallery_albums_school ON public.gallery_albums(school_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_album ON public.gallery_items(album_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_school ON public.online_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_invoice ON public.online_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_status ON public.online_payments(status);
CREATE INDEX IF NOT EXISTS idx_online_payments_cf_order ON public.online_payments(cf_order_id);
CREATE INDEX IF NOT EXISTS idx_school_payment_config_school ON public.school_payment_config(school_id);

-- 2. Consolidated parent dashboard RPC
CREATE OR REPLACE FUNCTION public.get_parent_dashboard(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _child RECORD;
  _attendance json;
  _fees json;
  _announcements json;
  _start_of_month date;
BEGIN
  _start_of_month := date_trunc('month', CURRENT_DATE)::date;

  -- Get first active child
  SELECT s.id, s.full_name, s.class_name, s.section, s.roll_number,
         s.admission_number, s.parent_name, s.parent_email, s.avatar_url, s.school_id
  INTO _child
  FROM students s
  JOIN profiles p ON s.parent_email = p.email
  WHERE p.id = _user_id AND s.status = 'active'
  LIMIT 1;

  IF _child.id IS NULL THEN
    RETURN json_build_object('child', null, 'attendance', null, 'fees', null, 'announcements', '[]'::json);
  END IF;

  -- Attendance stats for current month
  SELECT json_build_object(
    'present', COUNT(*) FILTER (WHERE status = 'present'),
    'absent', COUNT(*) FILTER (WHERE status = 'absent'),
    'late', COUNT(*) FILTER (WHERE status = 'late'),
    'total', COUNT(*),
    'percentage', CASE WHEN COUNT(*) > 0
      THEN ROUND(((COUNT(*) FILTER (WHERE status IN ('present','late')))::numeric / COUNT(*)) * 100, 1)
      ELSE 0 END
  ) INTO _attendance
  FROM attendance
  WHERE student_id = _child.id AND date >= _start_of_month;

  -- Fee stats from invoices
  SELECT json_build_object(
    'pending', COALESCE(SUM(CASE WHEN status != 'paid' THEN balance ELSE 0 END), 0),
    'paid', COALESCE(SUM(paid_amount), 0),
    'overdue', COALESCE(SUM(CASE WHEN status != 'paid' AND due_date < CURRENT_DATE THEN balance ELSE 0 END), 0)
  ) INTO _fees
  FROM fee_invoices
  WHERE student_id = _child.id;

  -- Recent announcements
  SELECT COALESCE(json_agg(row_to_json(a) ORDER BY a.created_at DESC), '[]'::json) INTO _announcements
  FROM (
    SELECT id, title, content, target_classes, created_at, image_url, is_active, school_id
    FROM announcements
    WHERE school_id = _child.school_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 5
  ) a;

  RETURN json_build_object(
    'child', json_build_object(
      'id', _child.id,
      'full_name', _child.full_name,
      'class_name', _child.class_name,
      'section', _child.section,
      'roll_number', _child.roll_number,
      'admission_number', _child.admission_number,
      'parent_name', _child.parent_name,
      'parent_email', _child.parent_email,
      'avatar_url', _child.avatar_url,
      'school_id', _child.school_id
    ),
    'attendance', _attendance,
    'fees', _fees,
    'announcements', _announcements
  );
END;
$$;
