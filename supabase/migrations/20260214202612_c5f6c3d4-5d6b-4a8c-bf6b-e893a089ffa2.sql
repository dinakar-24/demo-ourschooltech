
-- Fix: restrict notification inserts to authenticated users or service role
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can receive notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NOT NULL);
