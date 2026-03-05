import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRoleDashboard } from '@/components/auth/ProtectedRoute';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';

export default function SubdomainLanding() {
  const { tenant } = useTenant();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: tenant?.backgroundColor || '#ffffff' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    navigate(getRoleDashboard(user.role), { replace: true });
    return null;
  }

  if (!tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col sm:items-center sm:justify-center"
      style={{
        background: `linear-gradient(160deg, ${tenant.primaryColor}20 0%, ${tenant.primaryColor}08 40%, ${tenant.backgroundColor || '#ffffff'} 60%)`,
      }}
    >
      {/* Top gradient spacer on mobile — pushes card to bottom */}
      <div className="flex-1 sm:hidden" />

      {/* Card */}
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_-4px_32px_rgba(0,0,0,0.08)] sm:shadow-2xl border-t sm:border border-black/5 px-6 py-8 sm:p-10"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* School branding */}
        <div className="text-center mb-8">
          {tenant.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl object-contain mb-4 shadow-lg ring-1 ring-black/5"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
          ) : (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-black/5"
              style={{ backgroundColor: `${tenant.primaryColor}15` }}
            >
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: tenant.primaryColor }}>
                {tenant.name.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {tenant.appDisplayName || tenant.name}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl bg-gray-50/80 border-gray-200 text-base"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl bg-gray-50/80 border-gray-200 pr-12 text-base"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold shadow-sm"
            disabled={isSubmitting}
            style={{ backgroundColor: tenant.primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {tenant.name} School Portal
        </p>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
