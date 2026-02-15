
-- Fee Terms (Term 1, Term 2, Quarterly, etc.)
CREATE TABLE public.fee_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee terms" ON public.fee_terms FOR ALL
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));

CREATE POLICY "Users can view fee terms in their school" ON public.fee_terms FOR SELECT
  USING (school_id = get_user_school_id(auth.uid()));

-- Fee Invoices (one per student per term)
CREATE TABLE public.fee_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.fee_terms(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, term_id)
);

ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee invoices" ON public.fee_invoices FOR ALL
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));

CREATE POLICY "Students can view own invoices" ON public.fee_invoices FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view child invoices" ON public.fee_invoices FOR SELECT
  USING (has_role(auth.uid(), 'parent'::app_role) AND student_id IN (
    SELECT s.id FROM students s JOIN profiles p ON s.parent_email = p.email WHERE p.id = auth.uid()
  ));

-- Fee Invoice Components (breakdown: Tuition, Transport, etc.)
CREATE TABLE public.fee_invoice_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_invoice_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice components" ON public.fee_invoice_components FOR ALL
  USING (EXISTS (
    SELECT 1 FROM fee_invoices fi WHERE fi.id = invoice_id AND fi.school_id = get_user_school_id(auth.uid())
  ) AND has_role(auth.uid(), 'school_admin'::app_role));

CREATE POLICY "Users can view invoice components" ON public.fee_invoice_components FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM fee_invoices fi WHERE fi.id = invoice_id AND fi.school_id = get_user_school_id(auth.uid())
  ));

-- Fee Payments table
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  cheque_number TEXT,
  cheque_date DATE,
  bank_name TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by TEXT,
  receipt_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee payments" ON public.fee_payments FOR ALL
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));

CREATE POLICY "Students can view own payments" ON public.fee_payments FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view child payments" ON public.fee_payments FOR SELECT
  USING (has_role(auth.uid(), 'parent'::app_role) AND student_id IN (
    SELECT s.id FROM students s JOIN profiles p ON s.parent_email = p.email WHERE p.id = auth.uid()
  ));

-- Function to record a payment and update invoice
CREATE OR REPLACE FUNCTION public.record_fee_payment(
  _school_id UUID,
  _invoice_id UUID,
  _student_id UUID,
  _amount NUMERIC,
  _payment_method TEXT,
  _transaction_id TEXT DEFAULT NULL,
  _cheque_number TEXT DEFAULT NULL,
  _cheque_date DATE DEFAULT NULL,
  _bank_name TEXT DEFAULT NULL,
  _payment_date DATE DEFAULT CURRENT_DATE,
  _received_by TEXT DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invoice fee_invoices%ROWTYPE;
  _receipt TEXT;
  _new_paid NUMERIC;
  _new_balance NUMERIC;
  _new_status TEXT;
  _payment_id UUID;
  _school_code TEXT;
  _next_num INTEGER;
BEGIN
  -- Lock and get invoice
  SELECT * INTO _invoice FROM fee_invoices WHERE id = _invoice_id AND school_id = _school_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- Validate amount
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;
  IF _amount > _invoice.balance THEN
    RAISE EXCEPTION 'Amount (%) exceeds balance (%)', _amount, _invoice.balance;
  END IF;

  -- Generate receipt number: RCPT-YYYY-0001
  SELECT code INTO _school_code FROM schools WHERE id = _school_id;
  
  SELECT COALESCE(MAX(
    CASE WHEN receipt_number ~ 'RCPT-\d{4}-\d+$' 
    THEN CAST(split_part(receipt_number, '-', 3) AS INTEGER)
    ELSE 0 END
  ), 0) + 1 INTO _next_num
  FROM fee_payments WHERE school_id = _school_id;

  _receipt := 'RCPT-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || LPAD(_next_num::TEXT, 4, '0');

  -- Insert payment
  INSERT INTO fee_payments (
    school_id, invoice_id, student_id, amount, payment_method,
    transaction_id, cheque_number, cheque_date, bank_name,
    payment_date, received_by, receipt_number, notes
  ) VALUES (
    _school_id, _invoice_id, _student_id, _amount, _payment_method,
    _transaction_id, _cheque_number, _cheque_date, _bank_name,
    _payment_date, _received_by, _receipt, _notes
  ) RETURNING id INTO _payment_id;

  -- Update invoice
  _new_paid := _invoice.paid_amount + _amount;
  _new_balance := _invoice.total_amount - _new_paid;
  
  IF _new_balance <= 0 THEN
    _new_status := 'paid';
    _new_balance := 0;
  ELSIF _new_paid > 0 THEN
    _new_status := 'partial';
  ELSE
    _new_status := 'pending';
  END IF;

  UPDATE fee_invoices 
  SET paid_amount = _new_paid, balance = _new_balance, status = _new_status, updated_at = now()
  WHERE id = _invoice_id;

  RETURN json_build_object(
    'payment_id', _payment_id,
    'receipt_number', _receipt,
    'new_paid', _new_paid,
    'new_balance', _new_balance,
    'new_status', _new_status
  );
END;
$$;

-- Indexes for performance
CREATE INDEX idx_fee_terms_school ON public.fee_terms(school_id);
CREATE INDEX idx_fee_invoices_school_student ON public.fee_invoices(school_id, student_id);
CREATE INDEX idx_fee_invoices_term ON public.fee_invoices(term_id);
CREATE INDEX idx_fee_invoices_status ON public.fee_invoices(school_id, status);
CREATE INDEX idx_fee_payments_invoice ON public.fee_payments(invoice_id);
CREATE INDEX idx_fee_payments_school ON public.fee_payments(school_id);
CREATE INDEX idx_fee_invoice_components_invoice ON public.fee_invoice_components(invoice_id);

-- Triggers for updated_at
CREATE TRIGGER update_fee_terms_updated_at BEFORE UPDATE ON public.fee_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_invoices_updated_at BEFORE UPDATE ON public.fee_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
