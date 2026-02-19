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

export default function SubdomainLanding() {
  const { tenant } = useTenant();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: tenant?.backgroundColor || '#ffffff' }}>
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
      // AuthContext handles role detection and validation
      // ProtectedRoute will redirect to the correct dashboard
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${tenant.primaryColor}15 0%, ${tenant.backgroundColor || '#ffffff'} 50%, ${tenant.accentColor}10 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
          {/* School branding */}
          <div className="text-center mb-8">
            {tenant.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="w-20 h-20 mx-auto rounded-2xl object-contain mb-4 shadow-lg"
              />
            ) : (
              <div
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ backgroundColor: `${tenant.primaryColor}15` }}
              >
                <span className="text-3xl font-bold" style={{ color: tenant.primaryColor }}>
                  {tenant.name.charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {tenant.appDisplayName || tenant.name}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
          </div>

          {/* Single Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-50 border-gray-200"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-200 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
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

          <p className="text-center text-xs text-gray-400 mt-6">
            {tenant.name} School Portal
          </p>
        </div>
      </div>
    </div>
  );
}
