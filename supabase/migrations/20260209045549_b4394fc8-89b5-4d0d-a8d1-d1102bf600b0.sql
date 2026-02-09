
-- Create a storage bucket for platform branding assets
INSERT INTO storage.buckets (id, name, public) VALUES ('platform-assets', 'platform-assets', true);

-- Allow super admins to upload platform assets
CREATE POLICY "Super admins can upload platform assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'platform-assets' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super admins to update platform assets
CREATE POLICY "Super admins can update platform assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'platform-assets' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super admins to delete platform assets
CREATE POLICY "Super admins can delete platform assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'platform-assets' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Anyone can view platform assets (public branding)
CREATE POLICY "Anyone can view platform assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'platform-assets');
