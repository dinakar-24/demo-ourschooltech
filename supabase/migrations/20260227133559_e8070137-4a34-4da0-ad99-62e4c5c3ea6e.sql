-- Make term_id nullable on fee_invoices
ALTER TABLE public.fee_invoices ALTER COLUMN term_id DROP NOT NULL;