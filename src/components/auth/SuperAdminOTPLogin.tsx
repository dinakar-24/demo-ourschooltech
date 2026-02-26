import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Mail, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type OTPStep = 'email' | 'otp_password';

interface SuperAdminOTPLoginProps {
  onBack: () => void;
  onSuccess: () => void;
  initialEmail?: string;
}

export function SuperAdminOTPLogin({ onBack, onSuccess, initialEmail }: SuperAdminOTPLoginProps) {
  const [step, setStep] = useState<OTPStep>(initialEmail ? 'otp_password' : 'email');
  const [email, setEmail] = useState(initialEmail || '');
  const autoSentRef = useRef(false);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-send OTP when initialEmail is provided
  useEffect(() => {
    if (initialEmail && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSendOTP();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await supabase.functions.invoke('send-super-admin-otp', {
        body: { email: email.trim().toLowerCase() },
      });

      const result = response.data;
      const fnError = response.error;

      // Extract the actual error message
      let errorMsg = '';
      if (fnError) {
        // For non-2xx responses, try to read body from error context
        try {
          if ((fnError as any).context) {
            const body = await (fnError as any).context.json();
            errorMsg = body?.error || '';
          }
        } catch {
          // ignore parse errors
        }
        if (!errorMsg) errorMsg = fnError.message || 'Unknown error';
      } else if (result?.error) {
        errorMsg = result.error;
      }

      if (errorMsg) {
        if (errorMsg.includes('not registered as a Super Admin')) {
          throw new Error('This email is not authorized for Super Admin access. Please check your email or contact support@ourschooltech.in');
        }
        if (errorMsg.includes('Email service not configured')) {
          throw new Error('Unable to send OTP at the moment. Please try again later or contact support@ourschooltech.in');
        }
        throw new Error('Something went wrong. Please try again or contact support@ourschooltech.in');
      }

      setSuccess('OTP sent to your email');
      setNeedsPasswordSetup(result?.needsPasswordSetup);
      setStep('otp_password');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or contact support@ourschooltech.in');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain an uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain a lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain a number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain a special character';
    }
    return null;
  };

  const handleVerifyAndLogin = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    // If creating new password, validate it
    if (needsPasswordSetup) {
      const validationError = validatePassword(password);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await supabase.functions.invoke('verify-super-admin-otp', {
        body: { 
          email: email.trim().toLowerCase(), 
          otp,
          newPassword: needsPasswordSetup ? password : undefined
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
        if (errorMsg.includes('Password is required')) {
          throw new Error('Please create a password for your account.');
        }
        throw new Error('Verification failed. Please try again or contact support@ourschooltech.in');
      }

      // Now login with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Incorrect password. Please try again.');
        }
        throw new Error('Login failed. Please try again or contact support@ourschooltech.in');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        {['email', 'otp_password'].map((s, i) => {
          const stepOrder = ['email', 'otp_password'];
          const currentIndex = stepOrder.indexOf(step);
          const isCompleted = currentIndex > i;
          const isCurrent = stepOrder[i] === step;
          
          return (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                isCurrent && "bg-success text-success-foreground shadow-lg",
                isCompleted && "bg-success text-success-foreground",
                !isCurrent && !isCompleted && "bg-white/20 text-white/60"
              )}>
                {i + 1}
              </div>
              {i < 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  currentIndex > i ? "bg-success" : "bg-white/20"
                )} />
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-white/10 border border-white/15">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-300" />
          <p className="text-sm text-green-300 font-medium">Super Admin Access</p>
        </div>
        <p className="text-xs text-white/50 mt-1">
          {step === 'email' && 'Enter your Super Admin email to receive an OTP'}
          {step === 'otp_password' && (needsPasswordSetup ? 'Enter OTP and create your password' : 'Enter OTP and your password to login')}
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

      {/* Step 1: Email */}
      {step === 'email' && (
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

          <Button 
            onClick={handleSendOTP} 
            size="xl" 
            className="w-full h-13 text-base rounded-xl bg-primary hover:bg-primary-hover" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: OTP + Password */}
      {step === 'otp_password' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-4">
              <KeyRound className="w-4 h-4" />
              Enter 6-Digit OTP
            </label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
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

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-1.5">
              <Lock className="w-4 h-4" />
              {needsPasswordSetup ? 'Create Password' : 'Password'}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={needsPasswordSetup ? 'Create a strong password' : 'Enter your password'}
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

          {needsPasswordSetup && (
            <>
              <div>
                <label className="text-sm font-medium text-white mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-13 rounded-xl pr-12 bg-white border-0 text-foreground placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-1 p-3 bg-white/10 rounded-lg border border-white/10">
                <p className="font-medium text-white">Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5 text-white/50">
                  <li className={password.length >= 8 ? 'text-green-300' : ''}>At least 8 characters</li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-300' : ''}>One uppercase letter</li>
                  <li className={/[a-z]/.test(password) ? 'text-green-300' : ''}>One lowercase letter</li>
                  <li className={/[0-9]/.test(password) ? 'text-green-300' : ''}>One number</li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-300' : ''}>One special character</li>
                </ul>
              </div>
            </>
          )}

          <Button 
            onClick={handleVerifyAndLogin} 
            size="xl" 
            className="w-full h-13 text-base rounded-xl bg-primary hover:bg-primary-hover" 
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                {needsPasswordSetup ? 'Create Password & Sign In' : 'Verify & Sign In'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => handleSendOTP()}
            className="w-full text-sm text-white/50 hover:text-white transition-colors py-2"
            disabled={loading}
          >
            Resend OTP
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
