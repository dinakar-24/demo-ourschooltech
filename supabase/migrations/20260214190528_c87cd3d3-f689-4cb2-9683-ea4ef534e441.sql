
-- Create password reset OTP table
CREATE TABLE public.password_reset_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_otp ENABLE ROW LEVEL SECURITY;

-- No public access - only edge functions with service role can access
-- Block all direct access
CREATE POLICY "No direct access to password reset OTPs"
ON public.password_reset_otp
FOR ALL
USING (false);
