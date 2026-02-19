
-- Add new branding columns to schools table
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS splash_screen_image_url text,
  ADD COLUMN IF NOT EXISTS app_display_name text,
  ADD COLUMN IF NOT EXISTS app_short_name text;

-- Create index on subdomain (code) for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_code_unique ON public.schools (code);

-- Create composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.attendance (school_id, date);
CREATE INDEX IF NOT EXISTS idx_fees_school_status ON public.fees (school_id, status);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON public.students (school_id, class_name);
CREATE INDEX IF NOT EXISTS idx_students_school_status ON public.students (school_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_school_student ON public.fee_invoices (school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_homework_school_class ON public.homework (school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_exams_school_class ON public.exams (school_id, class_name);

-- Update the get_school_by_code RPC to include new fields
CREATE OR REPLACE FUNCTION public.get_school_by_code(_code text)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'id', s.id,
    'name', s.name,
    'code', s.code,
    'logo', s.logo,
    'primary_color', s.primary_color,
    'accent_color', s.accent_color,
    'secondary_color', s.secondary_color,
    'background_color', s.background_color,
    'splash_screen_image_url', s.splash_screen_image_url,
    'app_display_name', s.app_display_name,
    'app_short_name', s.app_short_name,
    'is_active', s.is_active
  )
  FROM public.schools s
  WHERE s.code = _code AND s.is_active = true
  LIMIT 1;
$function$;
