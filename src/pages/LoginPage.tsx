import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import appLogo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { SuperAdminOTPLogin } from '@/components/auth/SuperAdminOTPLogin';
import { LoginSplash } from '@/components/login/LoginSplash';
import { LoginShapes } from '@/components/login/LoginShapes';
import { LoginForm } from '@/components/login/LoginForm';

type LoginStep = 'splash' | 'login' | 'superadmin';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<LoginStep>('splash');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try { await login(email, password); }
    catch (err: any) { setError(err.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  // Splash
  if (step === 'splash') {
    return <LoginSplash onGetStarted={() => setStep('login')} onSuperAdmin={() => setStep('superadmin')} />;
  }

  // Super admin
  if (step === 'superadmin') {
    return (
      <div className="min-h-[100dvh] flex flex-col relative bg-gradient-to-br from-[hsl(230,60%,52%)] via-[hsl(220,65%,45%)] to-[hsl(200,70%,35%)]">
        <LoginShapes />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
          <motion.div
            className="w-full max-w-md bg-white/[0.08] backdrop-blur-xl rounded-3xl p-7 border border-white/15 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22 }}
          >
            <h2 className="text-xl font-display font-bold text-white mb-1">Super Admin</h2>
            <p className="text-white/50 text-sm mb-6">System administrator access</p>
            <SuperAdminOTPLogin onBack={() => setStep('splash')} onSuccess={() => {}} />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-gradient-to-br from-[hsl(230,60%,52%)] via-[hsl(220,65%,45%)] to-[hsl(200,70%,35%)]">
      <LoginShapes />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-2 safe-area-top">
        <motion.button
          onClick={() => setStep('splash')}
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
            {step === 'login' && (
              <motion.div
                key="login"
                className="flex flex-col space-y-5"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ type: 'spring', damping: 22 }}
              >
                <div className="text-center pt-2">
                  <h2 className="text-2xl font-display font-bold text-white">Welcome back</h2>
                  <p className="text-white/50 text-sm mt-1">Sign in to your account</p>
                </div>

                <motion.div
                  className="bg-white/[0.08] backdrop-blur-xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 22 }}
                >
                  <p className="text-center text-white/40 text-xs">Your role will be detected automatically</p>
                  <LoginForm onSubmit={handleLogin} loading={loading} error={error} resetKey="single" />
                </motion.div>
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
    </div>
  );
}
