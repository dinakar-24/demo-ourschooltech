
-- school_payment_config table
CREATE TABLE public.school_payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  cashfree_app_id text,
  cashfree_secret_key text,
  online_enabled boolean NOT NULL DEFAULT false,
  manual_enabled boolean NOT NULL DEFAULT true,
  is_connected boolean NOT NULL DEFAULT false,
  extra_charge_override numeric,
  super_admin_override_online boolean,
  super_admin_override_manual boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

ALTER TABLE public.school_payment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can view own payment config"
  ON public.school_payment_config FOR SELECT
  TO authenticated
  USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "School admins can update own payment config"
  ON public.school_payment_config FOR UPDATE
  TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));

CREATE POLICY "Super admins can manage all payment configs"
  ON public.school_payment_config FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- online_payments table
CREATE TABLE public.online_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.fee_invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  extra_charge numeric NOT NULL DEFAULT 0,
  total_charged numeric NOT NULL DEFAULT 0,
  cf_order_id text,
  cf_payment_id text,
  method text NOT NULL DEFAULT 'ONLINE',
  status text NOT NULL DEFAULT 'PENDING',
  transaction_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

ALTER TABLE public.online_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage online payments"
  ON public.online_payments FOR ALL
  TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));

CREATE POLICY "Parents can view child online payments"
  ON public.online_payments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'parent'::app_role) AND student_id IN (
    SELECT s.id FROM students s JOIN profiles p ON s.parent_email = p.email WHERE p.id = auth.uid()
  ));

CREATE POLICY "Students can view own online payments"
  ON public.online_payments FOR SELECT
  TO authenticated
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can view all online payments"
  ON public.online_payments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));
