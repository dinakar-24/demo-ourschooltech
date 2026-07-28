CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);