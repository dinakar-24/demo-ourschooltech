
-- Drop overly permissive SELECT policies that allow anyone to list files
DROP POLICY IF EXISTS "Anyone can view announcement images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view timetable images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Replace with authenticated-only SELECT (direct public URLs via CDN still work for everyone)
CREATE POLICY "Authenticated can view announcement images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'announcements');

CREATE POLICY "Authenticated can view gallery files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated can view timetable images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'timetables');

CREATE POLICY "Authenticated can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
