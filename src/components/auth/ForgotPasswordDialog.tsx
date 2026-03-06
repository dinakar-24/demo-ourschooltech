import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/api';
import { validateEmail, friendlyErrorMessage } from '@/lib/error-utils';

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
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setLoading(false);
    setResending(false);
    setCooldown(0);
  };

  const handleClose = () => { reset(); onClose(); };

  const sendOTP = async () => {
    await invokeEdgeFunction('send-password-reset-otp', { email: email.trim() });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    setLoading(true);
    setError('');
    try {
      await sendOTP();
      toast.success('OTP sent to your email');
      setCooldown(60);
      setStep('otp');
    } catch (err: any) {
      setError(friendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await sendOTP();
      toast.success('OTP resent to your email');
      setCooldown(60);
    } catch (err: any) {
      setError(friendlyErrorMessage(err.message));
    } finally {
      setResending(false);
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
      await invokeEdgeFunction('verify-password-reset-otp', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success('Password updated successfully!');
      setStep('success');
    } catch (err: any) {
      setError(friendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = [
    { test: newPassword.length >= 8, label: '8+ characters' },
    { test: /[A-Z]/.test(newPassword), label: 'Uppercase' },
    { test: /[a-z]/.test(newPassword), label: 'Lowercase' },
    { test: /\d/.test(newPassword), label: 'Number' },
    { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword), label: 'Special char' },
    { test: newPassword === confirmPassword && confirmPassword.length > 0, label: 'Passwords match' },
  ];

  if (!open) return null;

  const inputClasses = "pl-10 h-11 rounded-xl bg-white/[0.06] border-white/[0.06] text-white placeholder:text-white/25 text-sm focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/15";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="relative w-full max-w-[380px] rounded-t-2xl sm:rounded-2xl p-5 pb-7 border border-white/[0.06] shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            style={{ background: 'linear-gradient(180deg, hsl(225, 50%, 16%) 0%, hsl(228, 52%, 11%) 100%)' }}
            initial={{ opacity: 0, y: 80, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all border border-white/[0.04]"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Mobile drag handle */}
            <div className="w-8 h-0.5 rounded-full bg-white/10 mx-auto mb-5 sm:hidden" />

            <AnimatePresence mode="wait">
              {/* ── Email Step ── */}
              {step === 'email' && (
                <motion.form
                  key="email"
                  onSubmit={handleSendOTP}
                  className="space-y-4"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ type: 'spring', damping: 24 }}
                >
                  <div className="text-center mb-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
                      <KeyRound className="w-5 h-5 text-white/50" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Forgot Password?</h3>
                    <p className="text-white/30 text-xs mt-1.5 leading-relaxed max-w-[280px] mx-auto">
                      Enter your registered email. We'll send a 6-digit OTP to verify your identity.
                    </p>
                  </div>

                  <ErrorBanner error={error} />

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      type="email" placeholder="Email address" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClasses}
                      autoFocus
                    />
                  </div>

                  <motion.button
                    type="submit" disabled={loading}
                    className="w-full h-11 rounded-xl bg-white text-[hsl(225,50%,15%)] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white/95 transition-colors shadow-lg shadow-white/5"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending OTP...</> : <><Mail className="w-3.5 h-3.5" /> Send OTP</>}
                  </motion.button>

                  <button type="button" onClick={handleClose}
                    className="w-full text-center text-white/20 hover:text-white/45 text-xs transition-colors pt-0.5">
                    ← Back to Login
                  </button>
                </motion.form>
              )}

              {/* ── OTP & Reset Step ── */}
              {step === 'otp' && (
                <motion.form
                  key="otp"
                  onSubmit={handleVerifyAndReset}
                  className="space-y-3.5"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ type: 'spring', damping: 24 }}
                >
                  <div className="text-center mb-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
                      <Lock className="w-5 h-5 text-white/50" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Reset Password</h3>
                    <p className="text-white/30 text-xs mt-1.5">
                      Enter the OTP sent to <span className="text-white/60 font-medium">{email.toUpperCase()}</span>
                    </p>
                  </div>

                  <ErrorBanner error={error} />

                  {/* OTP */}
                  <FieldGroup label="Verification Code">
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        autoFocus
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="w-11 h-12 text-base font-mono text-white bg-white/[0.06] border-white/[0.08] first:rounded-l-xl last:rounded-r-xl"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </FieldGroup>

                  {/* New Password */}
                  <FieldGroup label="New Password">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create new password" value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`${inputClasses} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/45 transition-colors">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </FieldGroup>

                  {/* Confirm Password */}
                  <FieldGroup label="Confirm Password">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </FieldGroup>

                  {/* Password strength */}
                  {newPassword && (
                    <motion.div
                      className="grid grid-cols-2 gap-x-3 gap-y-1 px-0.5"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    >
                      {passwordChecks.map(({ test, label }) => (
                        <div key={label} className={`flex items-center gap-1.5 text-[10px] transition-colors ${test ? 'text-emerald-400' : 'text-white/15'}`}>
                          <div className={`w-1 h-1 rounded-full transition-colors ${test ? 'bg-emerald-400' : 'bg-white/10'}`} />
                          {label}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit" disabled={loading}
                    className="w-full h-11 rounded-xl bg-white text-[hsl(225,50%,15%)] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white/95 transition-colors shadow-lg shadow-white/5"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Resetting...</> : <><Lock className="w-3.5 h-3.5" /> Reset Password</>}
                  </motion.button>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-0.5">
                    <button type="button"
                      onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                      className="text-white/20 hover:text-white/45 text-[11px] transition-colors flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" /> Change email
                    </button>
                    <button type="button" onClick={handleResendOTP}
                      disabled={cooldown > 0 || resending}
                      className="text-[11px] transition-colors disabled:text-white/15 text-white/35 hover:text-white/60 flex items-center gap-1">
                      {resending ? (
                        <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Sending...</>
                      ) : cooldown > 0 ? (
                        <span>Resend in {cooldown}s</span>
                      ) : (
                        <>Resend OTP</>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── Success Step ── */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  className="text-center space-y-4 py-3"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 22 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Password Updated!</h3>
                  <p className="text-white/30 text-xs leading-relaxed max-w-[260px] mx-auto">
                    Your password has been reset successfully. You can now login with your new password.
                  </p>
                  <motion.button
                    onClick={handleClose}
                    className="w-full h-11 rounded-xl bg-white text-[hsl(225,50%,15%)] font-semibold text-sm shadow-lg shadow-white/5 hover:bg-white/95 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    Back to Login
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Helpers ── */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-white/25 font-medium mb-1 block uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ error }: { error: string }) {
  if (!error) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="p-2.5 rounded-xl bg-red-500/8 border border-red-500/10 text-[11px] flex items-center gap-2"
    >
      <div className="w-4 h-4 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 text-red-400 text-[9px] font-bold">!</div>
      <span className="text-red-300/70">{error}</span>
    </motion.div>
  );
}
