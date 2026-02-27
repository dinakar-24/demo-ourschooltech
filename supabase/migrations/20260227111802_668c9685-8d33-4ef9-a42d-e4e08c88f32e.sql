
-- ========== GALLERY ==========
CREATE TABLE public.gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  event_date DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gallery albums" ON public.gallery_albums
FOR ALL USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Users can view published gallery albums" ON public.gallery_albums
FOR SELECT USING (school_id = get_user_school_id(auth.uid()) AND is_published = true);

CREATE TABLE public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  display_order INT DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gallery items" ON public.gallery_items
FOR ALL USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Users can view gallery items" ON public.gallery_items
FOR SELECT USING (school_id = get_user_school_id(auth.uid()));

-- Storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload gallery files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Anyone can view gallery files" ON storage.objects
FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Admins can delete gallery files" ON storage.objects
FOR DELETE USING (bucket_id = 'gallery' AND auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin')));

-- ========== FEEDBACK ==========
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  submitted_by UUID,
  submitter_name TEXT,
  submitter_role TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents and teachers can submit feedback" ON public.feedback
FOR INSERT WITH CHECK (
  school_id = get_user_school_id(auth.uid()) AND
  submitted_by = auth.uid() AND
  (has_role(auth.uid(), 'parent') OR has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Users can view own feedback" ON public.feedback
FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Admins can manage all feedback" ON public.feedback
FOR ALL USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin')));

CREATE TABLE public.feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  responded_by UUID,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feedback responses" ON public.feedback_responses
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.feedback f WHERE f.id = feedback_responses.feedback_id AND f.school_id = get_user_school_id(auth.uid()))
  AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Users can view responses to own feedback" ON public.feedback_responses
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.feedback f WHERE f.id = feedback_responses.feedback_id AND f.submitted_by = auth.uid())
);

-- ========== SUPPORT QUERIES / HELPDESK ==========
CREATE TABLE public.support_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  submitter_name TEXT,
  submitter_role TEXT,
  ticket_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- fees, transport, academics, general
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents and teachers can submit queries" ON public.support_queries
FOR INSERT WITH CHECK (
  school_id = get_user_school_id(auth.uid()) AND
  submitted_by = auth.uid() AND
  (has_role(auth.uid(), 'parent') OR has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Users can view own queries" ON public.support_queries
FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Admins can manage all queries" ON public.support_queries
FOR ALL USING (school_id = get_user_school_id(auth.uid()) AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin')));

CREATE TABLE public.query_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES public.support_queries(id) ON DELETE CASCADE,
  responded_by UUID NOT NULL,
  responder_name TEXT,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.query_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage query responses" ON public.query_responses
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.support_queries q WHERE q.id = query_responses.query_id AND q.school_id = get_user_school_id(auth.uid()))
  AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Users can view responses to own queries" ON public.query_responses
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_queries q WHERE q.id = query_responses.query_id AND q.submitted_by = auth.uid())
);

CREATE POLICY "Participants can insert responses" ON public.query_responses
FOR INSERT WITH CHECK (
  responded_by = auth.uid() AND
  EXISTS (SELECT 1 FROM public.support_queries q WHERE q.id = query_responses.query_id AND q.school_id = get_user_school_id(auth.uid()))
);

-- Ticket number generation function
CREATE OR REPLACE FUNCTION public.generate_ticket_number(_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT;
  _code TEXT;
BEGIN
  SELECT code INTO _code FROM public.schools WHERE id = _school_id;
  SELECT COUNT(*) + 1 INTO _count FROM public.support_queries WHERE school_id = _school_id;
  RETURN 'TKT-' || COALESCE(_code, 'XXX') || '-' || LPAD(_count::TEXT, 5, '0');
END;
$$;

-- Updated_at triggers
CREATE TRIGGER update_gallery_albums_updated_at BEFORE UPDATE ON public.gallery_albums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_queries_updated_at BEFORE UPDATE ON public.support_queries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
