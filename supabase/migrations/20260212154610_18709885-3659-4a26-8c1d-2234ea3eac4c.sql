-- Add image_url column to announcements
ALTER TABLE public.announcements ADD COLUMN image_url text;

-- Create storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public) VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for announcement images
CREATE POLICY "Anyone can view announcement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

CREATE POLICY "Admins can upload announcement images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'announcements' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update announcement images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'announcements' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete announcement images"
ON storage.objects FOR DELETE
USING (bucket_id = 'announcements' AND auth.uid() IS NOT NULL);