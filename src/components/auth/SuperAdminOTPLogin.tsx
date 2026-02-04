import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Mail, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type OTPStep = 'email' | 'otp' | 'password' | 'login';

interface SuperAdminOTPLoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function SuperAdminOTPLogin({ onBack, onSuccess }: SuperAdminOTPLoginProps) {
  const [step, setStep] = useState<OTPStep>('email');
  const [email, setEmail] = useState('admin@ourschooltech.com');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-super-admin-otp', {
        body: { email },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess('OTP sent to your email');
      setRequiresPassword(data.needsPasswordSetup);
      
      // For development - show OTP in console
      if (data.debugOtp) {
        console.log('Debug OTP:', data.debugOtp);
        setDebugOtp(data.debugOtp);
      }
      
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-super-admin-otp', {
        body: { email, otp },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.requiresPassword) {
        setSuccess('OTP verified! Please create your password.');
        setStep('password');
      } else {
        setSuccess('OTP verified! Please login with your password.');
        setStep('login');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
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

  const handleCreatePassword = async () => {
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-super-admin-otp', {
        body: { email, otp, newPassword },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess('Password created successfully! You can now login.');
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Failed to create password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginPassword.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        {['email', 'otp', step === 'password' ? 'password' : 'login'].map((s, i) => {
          const stepOrder = ['email', 'otp', step === 'password' ? 'password' : 'login'];
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
              {i < 2 && (
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
          {step === 'email' && 'Enter your email to receive an OTP'}
          {step === 'otp' && 'Enter the 6-digit code sent to your email'}
          {step === 'password' && 'Create a secure password for your account'}
          {step === 'login' && 'Login with your password'}
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
      {debugOtp && step === 'otp' && (
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
              Email Address
            </label>
            <Input
              type="email"
              placeholder="admin@ourschooltech.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-xl"
              autoFocus
              disabled
            />
            <p className="text-xs text-muted-foreground mt-2">
              Only admin@ourschooltech.com can access Super Admin
            </p>
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

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
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

          <Button 
            onClick={handleVerifyOTP} 
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
                Verify OTP
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

      {/* Step 3: Create Password */}
      {step === 'password' && (
        <div className="space-y-4">
          <div>
            <label className="input-label flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Create Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-14 rounded-xl pr-12"
                autoFocus
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
              <li className={newPassword.length >= 8 ? 'text-success' : ''}>At least 8 characters</li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-success' : ''}>One uppercase letter</li>
              <li className={/[a-z]/.test(newPassword) ? 'text-success' : ''}>One lowercase letter</li>
              <li className={/[0-9]/.test(newPassword) ? 'text-success' : ''}>One number</li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-success' : ''}>One special character</li>
            </ul>
          </div>

          <Button 
            onClick={handleCreatePassword} 
            size="xl" 
            className="w-full h-14 text-base rounded-xl" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Password...
              </>
            ) : (
              <>
                Create Password
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 4: Login with Password */}
      {step === 'login' && (
        <div className="space-y-4">
          <div>
            <label className="input-label">Email</label>
            <Input
              type="email"
              value={email}
              className="h-14 rounded-xl bg-muted/50"
              disabled
            />
          </div>

          <div>
            <label className="input-label flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="h-14 rounded-xl pr-12"
                autoFocus
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

          <Button 
            onClick={handleLogin} 
            size="xl" 
            className="w-full h-14 text-base rounded-xl" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
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
