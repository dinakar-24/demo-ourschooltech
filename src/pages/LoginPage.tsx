import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Eye, EyeOff, ArrowRight, Loader2, Search, MapPin, Check, User, GraduationCap, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth, useSchoolSearch, UserRole } from '@/contexts/AuthContext';
import type { School as SchoolType } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type LoginStep = 'school' | 'role' | 'credentials' | 'superadmin';
type AuthMode = 'login' | 'signup';

const roleOptions: { role: UserRole; label: string; icon: typeof User; description: string }[] = [
  { role: 'school_admin', label: 'School Admin', icon: School, description: 'Full administrative access' },
  { role: 'teacher', label: 'Teacher', icon: GraduationCap, description: 'Classes, attendance & homework' },
  { role: 'parent', label: 'Parent', icon: Users, description: 'View your child\'s progress' },
  { role: 'student', label: 'Student', icon: BookOpen, description: 'View your academics' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, selectSchool, isLoading, isAuthenticated, user } = useAuth();
  
  const [step, setStep] = useState<LoginStep>('school');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [allSchools, setAllSchools] = useState<SchoolType[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = getDashboardPath(user.role);
      navigate(dashboardPath);
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch all schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .limit(10);
      
      if (!error && data) {
        setAllSchools(data.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          logo: s.logo || undefined,
          address: s.address,
          city: s.city,
        })));
      }
    };
    fetchSchools();
  }, []);

  const { schools: searchResults, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const displaySchools = searchQuery.trim() ? searchResults : allSchools;

  const getDashboardPath = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
      case 'school_admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'parent':
        return '/parent/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/dashboard';
    }
  };

  const handleSelectSchool = (school: SchoolType) => {
    setSelectedSchool(school);
    selectSchool(school);
    setError('');
    setStep('role');
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    
    if (authMode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    if (!selectedSchool || !selectedRole) {
      setError('Please select a school and role');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (authMode === 'login') {
        await login(email, password);
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        await signup(email, password, fullName, selectedRole, selectedSchool.id);
        setSuccess('Account created! Please check your email to verify your account.');
        setAuthMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    setSuccess('');
    if (step === 'credentials') {
      setStep('role');
    } else if (step === 'role') {
      setStep('school');
      setSelectedSchool(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 safe-area-top">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <School className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">Our School Tech</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-6 lg:px-12 lg:justify-center">
          <div className="w-full max-w-md mx-auto space-y-4">
            
            {/* Step Progress Card */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                {['school', 'role', 'credentials'].map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-sm",
                        step === s ? "bg-primary text-primary-foreground scale-110" :
                        ['school', 'role', 'credentials'].indexOf(step) > i ? "bg-success text-success-foreground" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {['school', 'role', 'credentials'].indexOf(step) > i ? <Check className="w-5 h-5" /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-[10px] mt-1.5 font-medium",
                        step === s ? "text-primary" : "text-muted-foreground"
                      )}>
                        {s === 'school' ? 'School' : s === 'role' ? 'Role' : 'Login'}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className={cn(
                        "w-full h-0.5 -mt-4 mx-1",
                        ['school', 'role', 'credentials'].indexOf(step) > i ? "bg-success" : "bg-muted"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Header Card */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="text-xl font-display font-bold text-foreground">
                {step === 'school' && 'Find your school'}
                {step === 'role' && 'Select your role'}
                {step === 'credentials' && (authMode === 'login' ? 'Sign in to continue' : 'Create your account')}
                {step === 'superadmin' && 'Super Admin Login'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 'school' && 'Search by school name or code'}
                {step === 'role' && `Signing into ${selectedSchool?.name}`}
                {step === 'credentials' && `Continue as ${roleOptions.find(r => r.role === selectedRole)?.label}`}
                {step === 'superadmin' && 'Access to manage all schools'}
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">!</div>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-success/10 text-success text-sm border border-success/20 flex items-start gap-3">
                <Check className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Step 1: School Search */}
            {step === 'school' && (
              <div className="space-y-4">
                {/* Search Card */}
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search school name or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 text-base rounded-xl border-2 focus:border-primary"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Schools List Card */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-3 bg-muted/50 border-b border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {searchQuery ? `Results for "${searchQuery}"` : 'Available Schools'}
                    </p>
                  </div>
                  
                  <div className="divide-y divide-border max-h-64 overflow-y-auto scrollbar-thin">
                    {displaySchools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => handleSelectSchool(school)}
                        className={cn(
                          "w-full p-4 text-left transition-all flex items-center gap-4",
                          "hover:bg-primary/5 active:bg-primary/10",
                          selectedSchool?.id === school.id && "bg-primary/5"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <School className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{school.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{school.city}</span>
                            <span className="text-border">•</span>
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{school.code}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                    ))}
                    
                    {searchQuery && searchResults.length === 0 && !searchLoading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No schools found</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                      </div>
                    )}

                    {displaySchools.length === 0 && !searchQuery && (
                      <div className="text-center py-8 text-muted-foreground">
                        <School className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No schools registered yet</p>
                        <p className="text-sm mt-1">Contact administrator to add your school</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Super Admin Link Card */}
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setStep('superadmin')}
                    className="w-full flex items-center justify-between py-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium">
                      <span className="text-lg">🔐</span>
                      Super Admin Login
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Role Selection */}
            {step === 'role' && (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-3 bg-muted/50 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Select Your Role
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {roleOptions.map((option) => (
                    <button
                      key={option.role}
                      onClick={() => handleSelectRole(option.role)}
                      className={cn(
                        "w-full p-4 text-left transition-all flex items-center gap-4",
                        "hover:bg-primary/5 active:bg-primary/10",
                        selectedRole === option.role && "bg-primary/5"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <option.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
                <div className="p-4 border-t border-border">
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    ← Change school
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Credentials */}
            {step === 'credentials' && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {authMode === 'signup' && (
                    <div>
                      <label className="input-label">Full Name</label>
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-14 rounded-xl"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="input-label">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 rounded-xl"
                      autoFocus={authMode === 'login'}
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
                        className="h-14 rounded-xl pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {authMode === 'login' && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-border w-4 h-4" />
                        <span className="text-muted-foreground">Remember me</span>
                      </label>
                      <button type="button" className="text-primary hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button type="submit" size="xl" className="w-full h-14 text-base rounded-xl" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      <>
                        {authMode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    {authMode === 'login' ? (
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signup');
                            setError('');
                            setSuccess('');
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign up
                        </button>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setError('');
                            setSuccess('');
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </form>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    ← Back to role selection
                  </button>
                </div>
              </div>
            )}

            {/* Super Admin Login */}
            {step === 'superadmin' && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!email.trim() || !password.trim()) {
                    setError('Please enter email and password');
                    return;
                  }
                  setLoading(true);
                  setError('');
                  try {
                    await login(email, password);
                  } catch (err: any) {
                    setError(err.message || 'Authentication failed. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }} className="space-y-5">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-primary font-medium">Super Admin Access</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      For system administrators with access to all schools
                    </p>
                  </div>

                  <div>
                    <label className="input-label">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter super admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 rounded-xl"
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
                        className="h-14 rounded-xl pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" size="xl" className="w-full h-14 text-base rounded-xl" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In as Super Admin
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('school');
                      setError('');
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    ← Back to school selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-4 text-center border-t border-border safe-area-bottom">
          <p className="text-sm text-muted-foreground">
            Need help? Contact{' '}
            <a href="mailto:support@ourschooltech.in" className="text-primary hover:underline">
              support@ourschooltech.in
            </a>
          </p>
        </footer>
      </div>
  );
}
