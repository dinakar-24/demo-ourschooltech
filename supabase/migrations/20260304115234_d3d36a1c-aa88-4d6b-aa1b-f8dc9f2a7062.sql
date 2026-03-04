
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS total_paid_amount integer NOT NULL DEFAULT 0;

-- Backfill: set total_paid_amount = sum of successful payments for each subscription
UPDATE public.subscriptions s
SET total_paid_amount = COALESCE((
  SELECT SUM(sp.amount)
  FROM public.subscription_payments sp
  WHERE sp.subscription_id = s.id AND sp.status = 'success'
), 0);
