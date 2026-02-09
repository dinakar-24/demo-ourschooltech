-- Add per-school theme color columns
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#0F766E',
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#E69500';
