import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Eye, EyeOff, ArrowRight, Loader2, Search, MapPin, Check, User, GraduationCap, Users, BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth, useSchoolSearch, UserRole } from '@/contexts/AuthContext';
import type { School as SchoolType } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type LoginStep = 'school' | 'role' | 'credentials';
type AuthMode = 'login' | 'signup';

const roleOptions: { role: UserRole; label: string; icon: typeof User; description: string; color: string }[] = [
  { role: 'school_admin', label: 'School Admin', icon: School, description: 'Manage your school', color: 'from-primary to-primary/80' },
  { role: 'teacher', label: 'Teacher', icon: GraduationCap, description: 'Classes & attendance', color: 'from-info to-info/80' },
  { role: 'parent', label: 'Parent', icon: Users, description: 'Track your child', color: 'from-success to-success/80' },
  { role: 'student', label: 'Student', icon: BookOpen, description: 'View academics', color: 'from-accent to-accent/80' },
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
        return '/super-admin/dashboard';
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

  const stepIndex = ['school', 'role', 'credentials'].indexOf(step);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-card/50 backdrop-blur-sm border-b border-border/50 px-4 py-4 safe-area-top">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <School className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-display font-bold text-foreground">Our School Tech</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col px-4 py-6 lg:py-10 lg:justify-center">
        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* Minimal Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === stepIndex ? "w-8 bg-primary" : i < stepIndex ? "w-4 bg-success" : "w-4 bg-border"
                )}
              />
            ))}
          </div>

          {/* Main Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xl shadow-black/5 overflow-hidden">
            {/* Back Button & Title */}
            <div className="px-6 pt-6 pb-4">
              {step !== 'school' && (
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              <h1 className="text-2xl font-display font-bold text-foreground">
                {step === 'school' && 'Find your school'}
                {step === 'role' && 'How will you use the app?'}
                {step === 'credentials' && (authMode === 'login' ? 'Welcome back' : 'Create account')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {step === 'school' && 'Search by name or school code'}
                {step === 'role' && selectedSchool?.name}
                {step === 'credentials' && `Sign in as ${roleOptions.find(r => r.role === selectedRole)?.label}`}
              </p>
            </div>

            {/* Card Body */}
            <div className="px-6 pb-6">
              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="mb-5 p-3 rounded-lg bg-success/10 text-success text-sm border border-success/20 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  {success}
                </div>
              )}

              {/* Step 1: School Search */}
              {step === 'school' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search school name or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus:bg-card focus:border-primary"
                      autoFocus
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                    {displaySchools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => handleSelectSchool(school)}
                        className={cn(
                          "w-full p-3.5 rounded-xl text-left transition-all flex items-center gap-3 group",
                          "bg-muted/30 hover:bg-muted border border-transparent hover:border-border/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                          <School className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{school.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{school.city}</span>
                            <span className="text-border">•</span>
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">{school.code}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                    
                    {searchQuery && searchResults.length === 0 && !searchLoading && (
                      <div className="text-center py-10 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No schools found</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                      </div>
                    )}

                    {displaySchools.length === 0 && !searchQuery && (
                      <div className="text-center py-10 text-muted-foreground">
                        <School className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No schools registered</p>
                        <p className="text-sm mt-1">Contact admin to add your school</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Role Selection */}
              {step === 'role' && (
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((option) => (
                    <button
                      key={option.role}
                      onClick={() => handleSelectRole(option.role)}
                      className={cn(
                        "p-4 rounded-xl text-left transition-all flex flex-col items-center text-center group",
                        "bg-muted/30 hover:bg-muted border-2 border-transparent hover:border-primary/20",
                        selectedRole === option.role && "border-primary bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-105 transition-transform",
                        option.color
                      )}>
                        <option.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: Credentials */}
              {step === 'credentials' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-card focus:border-primary"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-card focus:border-primary"
                      autoFocus={authMode === 'login'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-card focus:border-primary pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {authMode === 'login' && (
                    <div className="flex items-center justify-end">
                      <button type="button" className="text-sm text-primary hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl text-base font-semibold gap-2" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      <>
                        {authMode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <div className="text-center">
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
                          className="text-primary hover:underline font-semibold"
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
                          className="text-primary hover:underline font-semibold"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-card/50 backdrop-blur-sm px-4 py-4 text-center border-t border-border/50 safe-area-bottom">
        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <a href="mailto:support@ourschooltech.in" className="text-primary hover:underline font-medium">
            Contact support
          </a>
        </p>
      </footer>
    </div>
  );
}
