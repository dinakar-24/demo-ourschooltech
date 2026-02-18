import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const roleConfig: Record<string, { label: string; gradient: string; expectedRole: UserRole }> = {
  admin: {
    label: 'Admin',
    gradient: 'from-red-600 via-orange-500 to-amber-500',
    expectedRole: 'school_admin',
  },
  teacher: {
    label: 'Teacher',
    gradient: 'from-blue-700 via-blue-500 to-cyan-400',
    expectedRole: 'teacher',
  },
  parent: {
    label: 'Parent',
    gradient: 'from-emerald-700 via-green-500 to-teal-400',
    expectedRole: 'parent',
  },
  student: {
    label: 'Student',
    gradient: 'from-amber-600 via-yellow-500 to-orange-400',
    expectedRole: 'student',
  },
};

interface RoleLoginPageProps {
  role: string;
}

export default function RoleLoginPage({ role }: RoleLoginPageProps) {
  const { tenant } = useTenant();
  const { login, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = roleConfig[role];

  if (!config || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email, password);

      // Post-login validation is handled in AuthContext via TenantContext
      // But we add a small delay to let state settle, then the ProtectedRoute handles redirect
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${config.gradient} p-4`}>
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
          {/* School branding */}
          <div className="text-center mb-6">
            {tenant.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="w-16 h-16 mx-auto rounded-xl object-contain mb-3"
              />
            ) : (
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-primary">
                  {tenant.name.charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{config.label} Login</p>
          </div>

          {/* Form */}
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
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign in as ${config.label}`
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
