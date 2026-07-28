
-- Add receipt_number column to fees table
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS receipt_number text;

-- Create a school receipt counter table for sequential numbering per school
CREATE TABLE IF NOT EXISTS public.school_receipt_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  last_receipt_number integer NOT NULL DEFAULT 0,
  prefix text NOT NULL DEFAULT 'RCT',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.school_receipt_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage receipt counters"
ON public.school_receipt_counters
FOR ALL
USING (
  (school_id = get_user_school_id(auth.uid()))
  AND (has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view receipt counters in their school"
ON public.school_receipt_counters
FOR SELECT
USING (school_id = get_user_school_id(auth.uid()));

-- Function to generate next receipt number for a school (atomic)
CREATE OR REPLACE FUNCTION public.generate_receipt_number(_school_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_number integer;
  _prefix text;
  _school_code text;
BEGIN
  -- Get school code
  SELECT code INTO _school_code FROM public.schools WHERE id = _school_id;
  
  -- Upsert the counter and get next number
  INSERT INTO public.school_receipt_counters (school_id, last_receipt_number, prefix)
  VALUES (_school_id, 1, 'RCT')
  ON CONFLICT (school_id) DO UPDATE
  SET last_receipt_number = school_receipt_counters.last_receipt_number + 1,
      updated_at = now()
  RETURNING last_receipt_number, prefix INTO _next_number, _prefix;

  -- Return formatted receipt number: RCT/SCHOOLCODE/000001
  RETURN _prefix || '/' || COALESCE(_school_code, 'XXX') || '/' || LPAD(_next_number::text, 6, '0');
END;
$$;

-- Insert default subscription pricing into system_settings if not exists
INSERT INTO public.system_settings (key, value)
VALUES ('subscription_pricing', '{"price_per_student": 250, "currency": "INR", "billing_cycle": "yearly"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create index on receipt_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_fees_receipt_number ON public.fees(receipt_number) WHERE receipt_number IS NOT NULL;
