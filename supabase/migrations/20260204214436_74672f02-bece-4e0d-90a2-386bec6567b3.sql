-- Create table to store Super Admin OTP codes
CREATE TABLE public.super_admin_otp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_super_admin_otp_email ON public.super_admin_otp(email);

-- Enable RLS
ALTER TABLE public.super_admin_otp ENABLE ROW LEVEL SECURITY;

-- No direct access policies - only edge functions can access this table via service role
-- This is intentional for security