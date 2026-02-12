
-- Create storage bucket for timetable images
INSERT INTO storage.buckets (id, name, public) VALUES ('timetables', 'timetables', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for timetable bucket
CREATE POLICY "Admins can upload timetable images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'timetables'
  AND (
    has_role(auth.uid(), 'school_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Admins can update timetable images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'timetables'
  AND (
    has_role(auth.uid(), 'school_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Admins can delete timetable images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'timetables'
  AND (
    has_role(auth.uid(), 'school_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Anyone can view timetable images"
ON storage.objects FOR SELECT
USING (bucket_id = 'timetables');

-- Table to track timetable image per class/section
CREATE TABLE public.timetable_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  class_name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  image_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, class_name, section)
);

ALTER TABLE public.timetable_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage timetable images"
ON public.timetable_images FOR ALL
USING (
  school_id = get_user_school_id(auth.uid())
  AND (
    has_role(auth.uid(), 'school_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Users can view timetable images in their school"
ON public.timetable_images FOR SELECT
USING (school_id = get_user_school_id(auth.uid()));

CREATE TRIGGER update_timetable_images_updated_at
BEFORE UPDATE ON public.timetable_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
