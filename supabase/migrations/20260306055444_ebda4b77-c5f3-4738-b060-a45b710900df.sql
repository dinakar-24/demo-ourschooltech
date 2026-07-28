-- Drop the overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- No client-side INSERT policy needed.
-- All notification inserts go through edge functions using the service role key,
-- which bypasses RLS entirely. This prevents any authenticated user from
-- inserting notifications for arbitrary user_ids.