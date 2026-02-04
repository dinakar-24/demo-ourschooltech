-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Schools are viewable by authenticated users" ON public.schools;

-- Create a policy that allows anyone to view schools (for login page)
CREATE POLICY "Schools are publicly viewable for login"
ON public.schools
FOR SELECT
USING (true);