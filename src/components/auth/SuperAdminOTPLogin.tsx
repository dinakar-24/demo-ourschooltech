import { useState } from 'react';
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
}

export function SuperAdminOTPLogin({ onBack, onSuccess }: SuperAdminOTPLoginProps) {
  const [step, setStep] = useState<OTPStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const { data, error: fnError } = await supabase.functions.invoke('send-super-admin-otp', {
        body: { email: email.trim().toLowerCase() },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess('OTP sent to your email');
      setNeedsPasswordSetup(data.needsPasswordSetup);
      
      // For development - show OTP in console
      if (data.debugOtp) {
        console.log('Debug OTP:', data.debugOtp);
        setDebugOtp(data.debugOtp);
      }
      
      setStep('otp_password');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
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
      // Verify OTP and create/update password if needed
      const { data, error: fnError } = await supabase.functions.invoke('verify-super-admin-otp', {
        body: { 
          email: email.trim().toLowerCase(), 
          otp,
          newPassword: needsPasswordSetup ? password : undefined
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Now login with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
                isCurrent && "bg-primary text-primary-foreground shadow-lg",
                isCompleted && "bg-success text-success-foreground",
                !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {i < 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  currentIndex > i ? "bg-success" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <p className="text-sm text-primary font-medium">Super Admin Access</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {step === 'email' && 'Enter your Super Admin email to receive an OTP'}
          {step === 'otp_password' && (needsPasswordSetup ? 'Enter OTP and create your password' : 'Enter OTP and your password to login')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/10 text-success text-sm border border-success/20">
          {success}
        </div>
      )}

      {/* Development OTP display */}
      {debugOtp && step === 'otp_password' && (
        <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning-foreground text-sm">
          <p className="font-medium">Development Mode</p>
          <p className="font-mono text-lg">{debugOtp}</p>
        </div>
      )}

      {/* Step 1: Email */}
      {step === 'email' && (
        <div className="space-y-4">
          <div>
            <label className="input-label flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Super Admin Email
            </label>
            <Input
              type="email"
              placeholder="Enter your super admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-xl"
              autoFocus
            />
          </div>

          <Button 
            onClick={handleSendOTP} 
            size="xl" 
            className="w-full h-14 text-base rounded-xl" 
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
            <label className="input-label flex items-center gap-2 mb-4">
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
            <p className="text-xs text-muted-foreground mt-3">
              OTP expires in 5 minutes
            </p>
          </div>

          <div>
            <label className="input-label flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {needsPasswordSetup ? 'Create Password' : 'Password'}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={needsPasswordSetup ? 'Create a strong password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-xl pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {needsPasswordSetup && (
            <>
              <div>
                <label className="input-label">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-foreground">Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li className={password.length >= 8 ? 'text-success' : ''}>At least 8 characters</li>
                  <li className={/[A-Z]/.test(password) ? 'text-success' : ''}>One uppercase letter</li>
                  <li className={/[a-z]/.test(password) ? 'text-success' : ''}>One lowercase letter</li>
                  <li className={/[0-9]/.test(password) ? 'text-success' : ''}>One number</li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-success' : ''}>One special character</li>
                </ul>
              </div>
            </>
          )}

          <Button 
            onClick={handleVerifyAndLogin} 
            size="xl" 
            className="w-full h-14 text-base rounded-xl" 
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
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors py-2"
            disabled={loading}
          >
            Resend OTP
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors py-2"
      >
        ← Back to school selection
      </button>
    </div>
  );
}
