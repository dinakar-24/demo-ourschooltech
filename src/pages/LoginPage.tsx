import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, ArrowRight, Lock, Eye, EyeOff, Shield, ChevronRight } from 'lucide-react';
import appLogo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { SuperAdminOTPLogin } from '@/components/auth/SuperAdminOTPLogin';
import { LoginSplash } from '@/components/login/LoginSplash';
import { LoginShapes } from '@/components/login/LoginShapes';
import { Input } from '@/components/ui/input';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { supabase } from '@/integrations/supabase/client';

type LoginStep = 'splash' | 'email' | 'password' | 'superadmin';

interface SchoolInfo {
  school_name: string;
  school_logo: string | null;
  primary_color: string | null;
  role: string;
  user_name: string;
  app_display_name: string | null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<LoginStep>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const paths: Record<string, string> = {
        super_admin: '/super-admin/dashboard',
        school_admin: '/admin/dashboard',
        teacher: '/teacher/dashboard',
        parent: '/parent/dashboard',
        student: '/student/dashboard',
      };
      navigate(paths[user.role] || '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSplashComplete = useCallback(() => setStep('email'), []);

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    school_admin: 'Administrator',
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student',
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email'); return; }
    setLookupLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('lookup_user_by_email', { _email: email.trim() });
      if (rpcError) throw rpcError;
      const result = data as any;
      if (!result?.found) {
        setError('No account found with this email address');
        return;
      }
      setSchoolInfo(result);
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Failed to look up account');
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError('Please enter your password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Splash
  if (step === 'splash') {
    return <LoginSplash onComplete={handleSplashComplete} onSuperAdmin={() => setStep('superadmin')} />;
  }

  // Super admin
  if (step === 'superadmin') {
    return (
      <div className="min-h-[100dvh] flex flex-col relative"
        style={{ background: 'linear-gradient(160deg, hsl(230, 65%, 28%) 0%, hsl(220, 60%, 22%) 40%, hsl(210, 55%, 18%) 100%)' }}
      >
        <LoginShapes />
        <header className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-2 safe-area-top">
          <motion.button
            onClick={() => setStep('email')}
            className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/50 hover:bg-white/[0.1] transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
          <motion.div
            className="w-full max-w-sm bg-white/[0.04] backdrop-blur-xl rounded-2xl p-7 border border-white/[0.08]"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 22 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">System Admin</h2>
                <p className="text-white/30 text-xs">Restricted access</p>
              </div>
            </div>
            <SuperAdminOTPLogin onBack={() => setStep('email')} onSuccess={() => {}} />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col relative"
      style={{ background: 'linear-gradient(160deg, hsl(230, 65%, 28%) 0%, hsl(220, 60%, 22%) 40%, hsl(210, 55%, 18%) 100%)' }}
    >
      <LoginShapes />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-2 safe-area-top">
        <motion.button
          onClick={() => {
            if (step === 'password') {
              setStep('email');
              setPassword('');
              setError('');
              setSchoolInfo(null);
            } else {
              setStep('splash');
            }
          }}
          className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/50 hover:bg-white/[0.1] transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center overflow-hidden">
            <img src={appLogo} alt="Our School Tech" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-sm font-semibold text-white/70">Our School Tech</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 py-4 relative z-10 overflow-auto">
        <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="email"
                className="flex flex-col"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                transition={{ type: 'spring', damping: 22 }}
              >
                {/* Heading */}
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h2>
                  <p className="text-white/35 text-sm mt-2">Sign in to your school account</p>
                </div>

                {/* Form card */}
                <motion.form
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 22 }}
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm flex items-center gap-2 overflow-hidden"
                      >
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-400 text-xs font-bold">!</div>
                        <span className="text-red-300/90">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="email"
                        placeholder="you@school.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={lookupLoading}
                    className="w-full h-12 rounded-xl bg-white text-[hsl(230,60%,25%)] font-semibold text-sm shadow-lg shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white/95 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    {lookupLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Finding account...</>
                    ) : (
                      <>Continue <ChevronRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </motion.form>
              </motion.div>
            )}

            {step === 'password' && schoolInfo && (
              <motion.div
                key="password"
                className="flex flex-col"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                transition={{ type: 'spring', damping: 22 }}
              >
                {/* School card */}
                <motion.div
                  className="mb-8 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-4"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {schoolInfo.school_logo ? (
                    <div className="w-14 h-14 rounded-xl bg-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                      <img src={schoolInfo.school_logo} alt={schoolInfo.school_name} className="w-11 h-11 object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/[0.08] flex items-center justify-center shrink-0">
                      <span className="text-2xl font-bold text-white/50">{schoolInfo.school_name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">
                      {schoolInfo.app_display_name || schoolInfo.school_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.08] text-white/50">
                        {roleLabels[schoolInfo.role] || schoolInfo.role}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Welcome text */}
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    Hi, {schoolInfo.user_name?.split(' ')[0]} 👋
                  </h2>
                  <p className="text-white/35 text-sm mt-1">Enter your password to continue</p>
                </div>

                {/* Password form */}
                <motion.form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: 'spring', damping: 22 }}
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm flex items-center gap-2 overflow-hidden"
                      >
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-400 text-xs font-bold">!</div>
                        <span className="text-red-300/90">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email chip */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <Mail className="w-3.5 h-3.5 text-white/25" />
                    <span className="text-xs text-white/40 flex-1 truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setPassword(''); setError(''); setSchoolInfo(null); }}
                      className="text-[11px] text-white/30 hover:text-white/60 font-medium transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-10 pr-12 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white text-[hsl(230,60%,25%)] font-semibold text-sm shadow-lg shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white/95 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    ) : (
                      <>Sign in <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-5 py-4 text-center safe-area-bottom">
        <p className="text-[11px] text-white/15">
          Need help?{' '}
          <a href="mailto:support@ourschooltech.in" className="hover:text-white/30 underline transition-colors">
            support@ourschooltech.in
          </a>
        </p>
      </footer>

      <ForgotPasswordDialog open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  );
}
