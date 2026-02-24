import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, ArrowRight, Lock, Eye, EyeOff, Shield } from 'lucide-react';
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
    school_admin: 'School Administrator',
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
      <div className="min-h-[100dvh] flex flex-col relative bg-gradient-to-br from-[hsl(230,60%,52%)] via-[hsl(220,65%,45%)] to-[hsl(200,70%,35%)]">
        <LoginShapes />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
          <motion.div
            className="w-full max-w-md bg-white/[0.08] backdrop-blur-xl rounded-3xl p-7 border border-white/15 shadow-2xl"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 22 }}
          >
            <h2 className="text-xl font-display font-bold text-white mb-1">Super Admin</h2>
            <p className="text-white/50 text-sm mb-6">System administrator access</p>
            <SuperAdminOTPLogin onBack={() => setStep('email')} onSuccess={() => {}} />
          </motion.div>
        </div>
      </div>
    );
  }

  const primaryColor = schoolInfo?.primary_color || 'hsl(230,60%,52%)';

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-gradient-to-br from-[hsl(230,60%,52%)] via-[hsl(220,65%,45%)] to-[hsl(200,70%,35%)]">
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
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden">
            <img src={appLogo} alt="Our School Tech" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-base font-display font-bold text-white">Our School Tech</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 py-4 relative z-10 overflow-auto">
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="email"
                className="flex flex-col space-y-5"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                transition={{ type: 'spring', damping: 22 }}
              >
                <div className="text-center pt-2">
                  <h2 className="text-2xl font-display font-bold text-white">Welcome back</h2>
                  <p className="text-white/50 text-sm mt-1">Enter your email to continue</p>
                </div>
                <motion.form
                  onSubmit={handleEmailSubmit}
                  className="bg-white/[0.08] backdrop-blur-xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 22 }}
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-destructive/20 border border-destructive/30 text-sm flex items-center gap-2 overflow-hidden"
                      >
                        <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
                        <span className="text-white/90">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      type="email" placeholder="Email address" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm focus-visible:ring-2 focus-visible:ring-white/30"
                      autoFocus
                    />
                  </div>
                  <motion.button
                    type="submit" disabled={lookupLoading}
                    className="w-full h-13 rounded-full bg-[hsl(230,40%,18%)] text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  >
                    {lookupLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Finding your account...</>
                    ) : (
                      <>Continue <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </motion.form>
              </motion.div>
            )}

            {step === 'password' && schoolInfo && (
              <motion.div
                key="password"
                className="flex flex-col space-y-5"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                transition={{ type: 'spring', damping: 22 }}
              >
                {/* School branding header */}
                <motion.div
                  className="flex flex-col items-center text-center pt-2"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {schoolInfo.school_logo ? (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/25 mb-3 overflow-hidden">
                      <img src={schoolInfo.school_logo} alt={schoolInfo.school_name} className="w-16 h-16 object-contain" />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl border border-white/25 mb-3"
                      style={{ backgroundColor: `${primaryColor}30` }}
                    >
                      <span className="text-3xl font-bold text-white">{schoolInfo.school_name?.charAt(0)}</span>
                    </div>
                  )}
                  <h2 className="text-xl font-display font-bold text-white">
                    {schoolInfo.app_display_name || schoolInfo.school_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white/80 border border-white/20">
                      <Shield className="w-3 h-3 inline mr-1" />
                      {roleLabels[schoolInfo.role] || schoolInfo.role}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-2">Welcome, {schoolInfo.user_name}</p>
                </motion.div>

                {/* Password form */}
                <motion.form
                  onSubmit={handlePasswordSubmit}
                  className="bg-white/[0.08] backdrop-blur-xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: 'spring', damping: 22 }}
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-destructive/20 border border-destructive/30 text-sm flex items-center gap-2 overflow-hidden"
                      >
                        <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
                        <span className="text-white/90">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email display (read-only) */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
                    <Mail className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">{email}</span>
                    <button type="button" onClick={() => { setStep('email'); setPassword(''); setError(''); setSchoolInfo(null); }}
                      className="ml-auto text-xs text-white/40 hover:text-white/70 underline">
                      Change
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm focus-visible:ring-2 focus-visible:ring-white/30"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <motion.button
                    type="submit" disabled={loading}
                    className="w-full h-13 rounded-full bg-[hsl(230,40%,18%)] text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Login</>
                    )}
                  </motion.button>

                  <div className="text-center pt-1">
                    <button type="button" onClick={() => setShowForgotPassword(true)}
                      className="text-white/40 hover:text-white/70 text-sm transition-colors">
                      🔒 Forgot password?
                    </button>
                  </div>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-5 py-4 text-center safe-area-bottom">
        <p className="text-xs text-white/25">
          Need help? <a href="mailto:support@ourschooltech.in" className="hover:text-white/50 underline">support@ourschooltech.in</a>
        </p>
      </footer>

      <ForgotPasswordDialog open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  );
}
