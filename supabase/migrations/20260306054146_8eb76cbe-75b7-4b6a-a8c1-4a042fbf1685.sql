-- Enable pg_cron and pg_net for scheduled job processing
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Also add RLS policies for service role to manage jobs (UPDATE/DELETE)
CREATE POLICY "Service can manage all jobs"
ON public.jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Super admins can also manage (retry/cancel) jobs
CREATE POLICY "Super admins can manage jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));