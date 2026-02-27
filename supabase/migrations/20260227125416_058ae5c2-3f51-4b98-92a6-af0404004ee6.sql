
-- Create fee_discounts table
CREATE TABLE public.fee_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  invoice_id UUID NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id),
  discount_amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  applied_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fee_discounts_school_id ON public.fee_discounts(school_id);
CREATE INDEX idx_fee_discounts_invoice_id ON public.fee_discounts(invoice_id);
CREATE INDEX idx_fee_discounts_student_id ON public.fee_discounts(student_id);

-- Enable RLS
ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage fee discounts"
ON public.fee_discounts FOR ALL
USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));

-- Parents can view child discounts
CREATE POLICY "Parents can view child discounts"
ON public.fee_discounts FOR SELECT
USING (has_role(auth.uid(), 'parent'::app_role) AND student_id IN (
  SELECT s.id FROM students s JOIN profiles p ON s.parent_email = p.email WHERE p.id = auth.uid()
));

-- Students can view own discounts
CREATE POLICY "Students can view own discounts"
ON public.fee_discounts FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- RPC: Apply fee discount atomically
CREATE OR REPLACE FUNCTION public.apply_fee_discount(
  _school_id UUID,
  _invoice_id UUID,
  _student_id UUID,
  _discount_amount NUMERIC,
  _reason TEXT,
  _notes TEXT DEFAULT NULL,
  _applied_by UUID DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _invoice fee_invoices%ROWTYPE;
  _new_total NUMERIC;
  _new_balance NUMERIC;
  _new_status TEXT;
  _discount_id UUID;
BEGIN
  -- Lock invoice
  SELECT * INTO _invoice FROM fee_invoices WHERE id = _invoice_id AND school_id = _school_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;

  IF _discount_amount <= 0 THEN RAISE EXCEPTION 'Discount must be greater than 0'; END IF;
  IF _discount_amount > _invoice.balance THEN RAISE EXCEPTION 'Discount (%) exceeds balance (%)', _discount_amount, _invoice.balance; END IF;

  -- Insert discount record
  INSERT INTO fee_discounts (school_id, invoice_id, student_id, discount_amount, reason, notes, applied_by)
  VALUES (_school_id, _invoice_id, _student_id, _discount_amount, _reason, _notes, _applied_by)
  RETURNING id INTO _discount_id;

  -- Update invoice
  _new_total := _invoice.total_amount - _discount_amount;
  _new_balance := _invoice.balance - _discount_amount;

  IF _new_balance <= 0 THEN
    _new_status := 'paid';
    _new_balance := 0;
  ELSIF _invoice.paid_amount > 0 THEN
    _new_status := 'partial';
  ELSE
    _new_status := 'pending';
  END IF;

  UPDATE fee_invoices
  SET total_amount = _new_total, balance = _new_balance, status = _new_status, updated_at = now()
  WHERE id = _invoice_id;

  RETURN json_build_object(
    'discount_id', _discount_id,
    'new_total', _new_total,
    'new_balance', _new_balance,
    'new_status', _new_status
  );
END;
$$;
