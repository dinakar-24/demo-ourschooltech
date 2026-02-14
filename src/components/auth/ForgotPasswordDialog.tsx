import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp' | 'success';

export function ForgotPasswordDialog({ open, onClose }: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-password-reset-otp', {
        body: { email: email.trim() },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to send OTP');
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError('Please enter the OTP'); return; }
    if (otp.length !== 6) { setError('OTP must be 6 digits'); return; }
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password needs uppercase, lowercase, number & special character');
      return;
    }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-password-reset-otp', {
        body: { email: email.trim(), otp: otp.trim(), newPassword },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to reset password');
      toast.success('Password updated successfully!');
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />
      <motion.div
        className="relative w-full max-w-sm bg-white/[0.1] backdrop-blur-2xl rounded-3xl p-6 border border-white/15 shadow-2xl z-10"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22 }}
      >
        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.form
              key="email"
              onSubmit={handleSendOTP}
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Forgot Password?</h3>
                <p className="text-white/50 text-sm mt-1">Enter your registered email to receive an OTP</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/20 border border-destructive/30 text-sm flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
                  <span className="text-white/90">{error}</span>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm"
                  autoFocus
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-[hsl(230,40%,18%)] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : 'Send OTP'}
              </motion.button>

              <button type="button" onClick={handleClose} className="w-full text-center text-white/40 hover:text-white/70 text-sm transition-colors">
                Back to Login
              </button>
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.form
              key="otp"
              onSubmit={handleVerifyAndReset}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Reset Password</h3>
                <p className="text-white/50 text-sm mt-1">
                  Enter the OTP sent to <span className="text-white/70">{email}</span>
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/20 border border-destructive/30 text-sm flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
                  <span className="text-white/90">{error}</span>
                </div>
              )}

              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="pl-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm text-center text-lg tracking-[0.3em] font-mono"
                  autoFocus
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-11 pr-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm"
                />
              </div>

              {/* Password strength hints */}
              <div className="space-y-1 px-1">
                {[
                  { test: newPassword.length >= 8, label: 'At least 8 characters' },
                  { test: /[A-Z]/.test(newPassword), label: 'Uppercase letter' },
                  { test: /[a-z]/.test(newPassword), label: 'Lowercase letter' },
                  { test: /\d/.test(newPassword), label: 'Number' },
                  { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword), label: 'Special character' },
                ].map(({ test, label }) => (
                  <div key={label} className={`flex items-center gap-2 text-xs ${test ? 'text-green-400' : 'text-white/30'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${test ? 'bg-green-400' : 'bg-white/20'}`} />
                    {label}
                  </div>
                ))}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-[hsl(230,40%,18%)] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : 'Reset Password'}
              </motion.button>

              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                className="w-full text-center text-white/40 hover:text-white/70 text-sm transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Change email
              </button>
            </motion.form>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              className="text-center space-y-4 py-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Password Updated!</h3>
              <p className="text-white/50 text-sm">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <motion.button
                onClick={handleClose}
                className="w-full h-12 rounded-full bg-[hsl(230,40%,18%)] text-white font-bold text-sm shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Back to Login
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
