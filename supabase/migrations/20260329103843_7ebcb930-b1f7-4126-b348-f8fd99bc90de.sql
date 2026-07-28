
-- Add approval workflow columns to school_payment_config
ALTER TABLE public.school_payment_config
  ADD COLUMN IF NOT EXISTS connection_status text NOT NULL DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by_super_admin boolean NOT NULL DEFAULT false;

-- Update existing connected rows to have 'connected' status
UPDATE public.school_payment_config
SET connection_status = 'connected'
WHERE is_connected = true AND connection_status = 'not_connected';
