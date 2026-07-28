
-- School holidays/events table
CREATE TABLE public.school_holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  event_type text NOT NULL DEFAULT 'holiday',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id, date, title)
);

ALTER TABLE public.school_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage school holidays"
ON public.school_holidays FOR ALL
USING (
  (school_id = get_user_school_id(auth.uid()))
  AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Users can view school holidays"
ON public.school_holidays FOR SELECT
USING (school_id = get_user_school_id(auth.uid()));

-- Teacher/Employee attendance table
CREATE TABLE public.teacher_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  notes text,
  marked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id, teacher_id, date)
);

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage teacher attendance"
ON public.teacher_attendance FOR ALL
USING (
  (school_id = get_user_school_id(auth.uid()))
  AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Teachers can view own attendance"
ON public.teacher_attendance FOR SELECT
USING (
  teacher_id IN (SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid())
);
