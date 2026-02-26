
-- Create timetable_periods table (defines period structure per school)
CREATE TABLE public.timetable_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  period_number integer NOT NULL,
  start_time text NOT NULL DEFAULT '08:00',
  end_time text NOT NULL DEFAULT '08:30',
  is_lunch boolean NOT NULL DEFAULT false,
  label text NOT NULL DEFAULT 'Period 1',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id, period_number)
);

ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage timetable periods"
ON public.timetable_periods FOR ALL
USING (
  (school_id = get_user_school_id(auth.uid()))
  AND (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view timetable periods in their school"
ON public.timetable_periods FOR SELECT
USING (school_id = get_user_school_id(auth.uid()));

-- Create timetable_entries table (individual period slots)
CREATE TABLE public.timetable_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  period_number integer NOT NULL,
  day_of_week text NOT NULL,
  subject text NOT NULL DEFAULT '',
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  start_time text NOT NULL DEFAULT '08:00',
  end_time text NOT NULL DEFAULT '08:30',
  is_lunch boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id, class_name, section, period_number, day_of_week)
);

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage timetable entries"
ON public.timetable_entries FOR ALL
USING (
  (school_id = get_user_school_id(auth.uid()))
  AND (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view timetable entries in their school"
ON public.timetable_entries FOR SELECT
USING (school_id = get_user_school_id(auth.uid()));

-- Add updated_at trigger for timetable_entries
CREATE TRIGGER update_timetable_entries_updated_at
BEFORE UPDATE ON public.timetable_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
