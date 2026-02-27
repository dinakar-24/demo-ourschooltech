
-- Create payment_submissions table
CREATE TABLE public.payment_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id),
  invoice_id uuid NOT NULL REFERENCES public.fee_invoices(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  submitted_by uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text,
  transaction_id text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

-- Parents can INSERT for own child's invoices
CREATE POLICY "Parents can submit payment proof"
ON public.payment_submissions
FOR INSERT
WITH CHECK (
  submitted_by = auth.uid()
  AND has_role(auth.uid(), 'parent'::app_role)
  AND student_id IN (
    SELECT s.id FROM students s
    JOIN profiles p ON s.parent_email = p.email
    WHERE p.id = auth.uid()
  )
);

-- Parents can SELECT own submissions
CREATE POLICY "Parents can view own submissions"
ON public.payment_submissions
FOR SELECT
USING (
  submitted_by = auth.uid()
  AND has_role(auth.uid(), 'parent'::app_role)
);

-- Students can SELECT own submissions
CREATE POLICY "Students can view own submissions"
ON public.payment_submissions
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND student_id IN (
    SELECT students.id FROM students WHERE students.user_id = auth.uid()
  )
);

-- Admin can manage all for their school
CREATE POLICY "Admins can manage payment submissions"
ON public.payment_submissions
FOR ALL
USING (
  school_id = get_user_school_id(auth.uid())
  AND has_role(auth.uid(), 'school_admin'::app_role)
);

-- Create private storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false);

-- Parents can upload to payment-proofs bucket
CREATE POLICY "Parents can upload payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'parent'::app_role)
);

-- Parents can view own uploaded proofs
CREATE POLICY "Parents can view own payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
);

-- Admins can view payment proofs in their school
CREATE POLICY "Admins can manage payment proofs"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'school_admin'::app_role)
);
