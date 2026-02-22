-- Unique index on profiles.email for fast login lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles (email);

-- Index on user_roles.user_id for fast role lookup during login
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles (user_id);