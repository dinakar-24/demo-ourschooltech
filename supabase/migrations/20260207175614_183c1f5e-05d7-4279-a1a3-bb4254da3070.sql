-- Add alternate phone and blood group columns to students table
ALTER TABLE public.students 
ADD COLUMN alternate_phone text,
ADD COLUMN blood_group text;