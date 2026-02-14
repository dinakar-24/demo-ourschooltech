import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Sheet-style modal */}
          <motion.div
            className="relative w-full max-w-md bg-gradient-to-b from-[hsl(230,50%,25%)] to-[hsl(230,45%,18%)] rounded-t-3xl sm:rounded-3xl p-6 pb-8 border border-white/10 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Drag handle for mobile */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5 sm:hidden" />

            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.form
                  key="email"
                  onSubmit={handleSendOTP}
                  className="space-y-5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="text-center mb-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <KeyRound className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Forgot Password?</h3>
                    <p className="text-white/50 text-sm mt-2 leading-relaxed">
                      Enter your registered email address. We'll send a 6-digit OTP to verify your identity.
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-sm flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
                      <span className="text-red-200">{error}</span>
                    </motion.div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-13 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/30 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:border-blue-400/50"
                      autoFocus
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-60 hover:from-blue-600 hover:to-blue-700 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : <><Mail className="w-4 h-4" /> Send OTP</>}
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full text-center text-white/40 hover:text-white/70 text-sm transition-colors pt-1"
                  >
                    ← Back to Login
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
                  <div className="text-center mb-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Reset Password</h3>
                    <p className="text-white/50 text-sm mt-2 leading-relaxed">
                      Enter the OTP sent to <span className="text-blue-300 font-medium">{email}</span>
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-sm flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
                      <span className="text-red-200">{error}</span>
                    </motion.div>
                  )}

                  {/* OTP Input */}
                  <div>
                    <label className="text-xs text-white/40 font-medium mb-1.5 block">Verification Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="pl-11 h-13 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/30 text-center text-lg tracking-[0.4em] font-mono focus-visible:ring-2 focus-visible:ring-green-400/50"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-xs text-white/40 font-medium mb-1.5 block">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-11 pr-11 h-13 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-green-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs text-white/40 font-medium mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-11 h-13 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-green-400/50"
                      />
                    </div>
                  </div>

                  {/* Password strength */}
                  {newPassword && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1">
                      {[
                        { test: newPassword.length >= 8, label: '8+ characters' },
                        { test: /[A-Z]/.test(newPassword), label: 'Uppercase' },
                        { test: /[a-z]/.test(newPassword), label: 'Lowercase' },
                        { test: /\d/.test(newPassword), label: 'Number' },
                        { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword), label: 'Special char' },
                        { test: newPassword === confirmPassword && confirmPassword.length > 0, label: 'Passwords match' },
                      ].map(({ test, label }) => (
                        <div key={label} className={`flex items-center gap-1.5 text-[11px] ${test ? 'text-green-400' : 'text-white/25'} transition-colors`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${test ? 'bg-green-400' : 'bg-white/15'} transition-colors`} />
                          {label}
                        </div>
                      ))}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 disabled:opacity-60 hover:from-green-600 hover:to-emerald-700 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : <><Lock className="w-4 h-4" /> Reset Password</>}
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
                  className="text-center space-y-5 py-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Password Updated!</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Your password has been reset successfully.<br />You can now login with your new password.
                  </p>
                  <motion.button
                    onClick={handleClose}
                    className="w-full h-13 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25"
                    whileHover={{ scale: 1.01 }}
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
