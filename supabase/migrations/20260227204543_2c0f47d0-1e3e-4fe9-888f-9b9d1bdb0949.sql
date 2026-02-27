ALTER TABLE subscription_payments ADD COLUMN payment_type text NOT NULL DEFAULT 'renewal';
ALTER TABLE subscription_payments ADD COLUMN student_count integer;