import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'school' | 'credentials'>('school');
  const [schoolCode, setSchoolCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolCode.trim()) {
      setStep('credentials');
      setError('');
    } else {
      setError('Please enter your school code');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }
    
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <School className="w-7 h-7" />
            </div>
            <span className="text-2xl font-display font-bold">SchoolERP</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight">
              Complete School<br />Management Solution
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Streamline admissions, attendance, fees, exams, and communication. 
              Trusted by 500+ schools across India.
            </p>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm text-primary-foreground/70">Schools</p>
              </div>
              <div>
                <p className="text-3xl font-bold">2L+</p>
                <p className="text-sm text-primary-foreground/70">Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold">98%</p>
                <p className="text-sm text-primary-foreground/70">Satisfaction</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © 2024 SchoolERP. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <School className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">SchoolERP</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {step === 'school' ? 'Welcome back!' : 'Sign in to continue'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {step === 'school' 
                ? 'Enter your school code to get started' 
                : `Signing in to school: ${schoolCode.toUpperCase()}`}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === 'school' ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"
            )}>
              {step === 'credentials' ? '✓' : '1'}
            </div>
            <div className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              step === 'credentials' ? "bg-primary" : "bg-muted"
            )} />
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === 'credentials' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive-muted text-destructive text-sm">
              {error}
            </div>
          )}

          {step === 'school' ? (
            <form onSubmit={handleSchoolSubmit} className="space-y-6">
              <div>
                <label className="input-label">School Code</label>
                <Input
                  type="text"
                  placeholder="e.g., DPS2024"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  className="input-field text-lg uppercase tracking-wider"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Don't know your school code? Contact your school administrator.
                </p>
              </div>
              <Button type="submit" size="xl" className="w-full">
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="input-label">Username / Email</label>
                <Input
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <button type="button" className="text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" size="xl" className="w-full" disabled={loading}>
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

              <button
                type="button"
                onClick={() => setStep('school')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Change school
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact{' '}
            <a href="mailto:support@schoolerp.in" className="text-primary hover:underline">
              support@schoolerp.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
