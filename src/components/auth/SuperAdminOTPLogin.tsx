import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Mail, KeyRound, ShieldCheck, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type OTPStep = 'credentials' | 'otp';

interface SuperAdminOTPLoginProps {
  onBack: () => void;
  onSuccess: () => void;
  initialEmail?: string;
}

export function SuperAdminOTPLogin({ onBack, onSuccess, initialEmail }: SuperAdminOTPLoginProps) {
  const [step, setStep] = useState<OTPStep>('credentials');
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return 'Password must contain a special character';
    return null;
  };

  // Step 1: Verify credentials, then send OTP
  const handleCredentialsSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Please enter a valid email address'); return; }
    if (!password.trim()) { setError('Please enter your password'); return; }

    setLoading(true);
    setError('');

    try {
      const response = await supabase.functions.invoke('send-super-admin-otp', {
        body: { email: email.trim().toLowerCase(), password },
      });

      const result = response.data;
      const fnError = response.error;

      let errorMsg = '';
      if (fnError) {
        try {
          if ((fnError as any).context) {
            const body = await (fnError as any).context.json();
            errorMsg = body?.error || '';
          }
        } catch { /* ignore */ }
        if (!errorMsg) errorMsg = fnError.message || 'Unknown error';
      } else if (result?.error) {
        errorMsg = result.error;
      }

      if (errorMsg) {
        if (errorMsg.includes('not registered as a Super Admin')) {
          throw new Error('This email is not authorized for Super Admin access.');
        }
        if (errorMsg.includes('Invalid credentials') || errorMsg.includes('Invalid login credentials')) {
          throw new Error('Incorrect email or password. Please try again.');
        }
        if (errorMsg.includes('Email service not configured')) {
          throw new Error('Unable to send OTP. Please try again later or contact support@ourschooltech.in');
        }
        throw new Error(errorMsg);
      }

      setSuccess('OTP sent to your email after credential verification');
      setNeedsPasswordSetup(result?.needsPasswordSetup || false);
      setResendCooldown(30);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP (credentials already verified)
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await supabase.functions.invoke('send-super-admin-otp', {
        body: { email: email.trim().toLowerCase(), password, resend: true },
      });

      const result = response.data;
      const fnError = response.error;

      let errorMsg = '';
      if (fnError) {
        try {
          if ((fnError as any).context) {
            const body = await (fnError as any).context.json();
            errorMsg = body?.error || '';
          }
        } catch { /* ignore */ }
        if (!errorMsg) errorMsg = fnError.message || 'Unknown error';
      } else if (result?.error) {
        errorMsg = result.error;
      }

      if (errorMsg) throw new Error(errorMsg);

      setSuccess('New OTP sent to your email');
      setResendCooldown(30);
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and sign in
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }

    setLoading(true);
    setError('');

    try {
      const response = await supabase.functions.invoke('verify-super-admin-otp', {
        body: {
          email: email.trim().toLowerCase(),
          otp,
          newPassword: needsPasswordSetup ? password : undefined,
        },
      });

      const result = response.data;
      const fnError = response.error;

      let errorMsg = '';
      if (fnError) {
        try {
          if ((fnError as any).context) {
            const body = await (fnError as any).context.json();
            errorMsg = body?.error || '';
          }
        } catch { /* ignore */ }
        if (!errorMsg) errorMsg = fnError.message || 'Unknown error';
      } else if (result?.error) {
        errorMsg = result.error;
      }

      if (errorMsg) {
        if (errorMsg.includes('Invalid or expired OTP')) {
          throw new Error('The OTP you entered is incorrect or has expired. Please request a new one.');
        }
        throw new Error('Verification failed. Please try again.');
      }

      // Sign in with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        throw new Error('Login failed. Please try again.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['credentials', 'otp'] as const;
  const currentIndex = steps.indexOf(step);

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              currentIndex === i && "bg-success text-success-foreground shadow-lg",
              currentIndex > i && "bg-success text-success-foreground",
              currentIndex < i && "bg-white/20 text-white/60"
            )}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-1",
                currentIndex > i ? "bg-success" : "bg-white/20"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-white/10 border border-white/15">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-300" />
          <p className="text-sm text-green-300 font-medium">Super Admin Access</p>
        </div>
        <p className="text-xs text-white/50 mt-1">
          {step === 'credentials' && 'Enter your email and password to verify identity'}
          {step === 'otp' && 'Enter the OTP sent to your email after credential verification'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/20 text-white text-sm border border-destructive/30 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/20 text-green-200 text-sm border border-success/30">
          {success}
        </div>
      )}

      {/* Step 1: Email + Password */}
      {step === 'credentials' && (
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-1.5">
              <Mail className="w-4 h-4" />
              Super Admin Email
            </label>
            <Input
              type="email"
              placeholder="Enter your super admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-1.5">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-13 rounded-xl pr-12 bg-white border-0 text-foreground placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleCredentialsSubmit}
            size="xl"
            className="w-full h-13 text-base rounded-xl bg-primary hover:bg-primary-hover"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Send OTP
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-4">
              <KeyRound className="w-4 h-4" />
              Enter 6-Digit OTP
            </label>
            <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-white/50 mt-3">
              OTP expires in 5 minutes
            </p>
          </div>

          <Button
            onClick={handleVerifyOTP}
            size="xl"
            className="w-full h-13 text-base rounded-xl bg-primary hover:bg-primary-hover"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying OTP...
              </>
            ) : (
              <>
                Verify & Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={handleResendOTP}
            className={cn(
              "w-full text-sm transition-colors py-2 flex items-center justify-center gap-2",
              resendCooldown > 0 ? "text-white/30 cursor-not-allowed" : "text-white/50 hover:text-white"
            )}
            disabled={loading || resendCooldown > 0}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
          </button>

          <button
            type="button"
            onClick={() => { setStep('credentials'); setOtp(''); setError(''); setSuccess(''); }}
            className="w-full text-sm text-white/50 hover:text-white transition-colors py-1"
          >
            ← Back to credentials
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-white/50 hover:text-white transition-colors py-2"
      >
        ← Back to school selection
      </button>
    </div>
  );
}
