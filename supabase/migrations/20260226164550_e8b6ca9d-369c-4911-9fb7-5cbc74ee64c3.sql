
-- Create online_classes table
CREATE TABLE public.online_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  platform text NOT NULL DEFAULT 'zoom',
  meeting_url text,
  meeting_id text,
  password text,
  class_name text,
  section text,
  subject text,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_online_classes_school_id ON public.online_classes(school_id);
CREATE INDEX idx_online_classes_scheduled_at ON public.online_classes(scheduled_at);
CREATE INDEX idx_online_classes_teacher_id ON public.online_classes(teacher_id);

-- Enable RLS
ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can do everything in their school
CREATE POLICY "Admins can manage online classes"
ON public.online_classes
FOR ALL
USING (
  school_id = get_user_school_id(auth.uid())
  AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
);

-- RLS: Teachers can manage their own classes
CREATE POLICY "Teachers can manage own online classes"
ON public.online_classes
FOR ALL
USING (
  school_id = get_user_school_id(auth.uid())
  AND has_role(auth.uid(), 'teacher')
  AND teacher_id IN (SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid())
);

-- RLS: All school users can view online classes
CREATE POLICY "Users can view online classes in their school"
ON public.online_classes
FOR SELECT
USING (school_id = get_user_school_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_online_classes_updated_at
BEFORE UPDATE ON public.online_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
