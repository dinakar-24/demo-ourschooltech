import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Eye, EyeOff, ArrowRight, Loader2, Search, MapPin, Check, User, GraduationCap, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth, useSchoolSearch, UserRole } from '@/contexts/AuthContext';
import type { School as SchoolType } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminOTPLogin } from '@/components/auth/SuperAdminOTPLogin';

type LoginStep = 'school' | 'role' | 'credentials' | 'superadmin';

const roleOptions: { role: UserRole; label: string; icon: typeof User; description: string }[] = [
  { role: 'school_admin', label: 'School Admin', icon: School, description: 'Full administrative access' },
  { role: 'teacher', label: 'Teacher', icon: GraduationCap, description: 'Classes, attendance & homework' },
  { role: 'parent', label: 'Parent', icon: Users, description: 'View your child\'s progress' },
  { role: 'student', label: 'Student', icon: BookOpen, description: 'View your academics' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, selectSchool, isLoading, isAuthenticated, user } = useAuth();
  
  const [step, setStep] = useState<LoginStep>('school');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
    
    if (!selectedSchool || !selectedRole) {
      setError('Please select a school and role');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'credentials') {
      setStep('role');
    } else if (step === 'role') {
      setStep('school');
      setSelectedSchool(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-primary/5 to-background flex flex-col overflow-auto">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 px-4 py-4 safe-area-top shrink-0">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <School className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">Our School Tech</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-4 lg:px-12 lg:py-6 lg:justify-center overflow-auto">
        <div className="w-full max-w-md mx-auto space-y-5">
          
          {/* Step Progress - Clean horizontal stepper */}
          {step !== 'superadmin' && (
            <div className="py-2">
              <div className="flex items-center justify-center">
                {['school', 'role', 'credentials'].map((s, i) => {
                  const stepIndex = ['school', 'role', 'credentials'].indexOf(step);
                  const isCompleted = stepIndex > i;
                  const isCurrent = step === s;
                  
                  return (
                    <div key={s} className="flex items-center">
                      {/* Step circle */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                          isCurrent && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-105",
                          isCompleted && "bg-success text-success-foreground border-success",
                          !isCurrent && !isCompleted && "bg-white text-muted-foreground border-border"
                        )}>
                          {isCompleted ? <Check className="w-5 h-5" /> : i + 1}
                        </div>
                        <span className={cn(
                          "text-xs mt-2 font-medium transition-colors",
                          isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
                        )}>
                          {s === 'school' ? 'School' : s === 'role' ? 'Role' : 'Login'}
                        </span>
                      </div>
                      
                      {/* Connector line */}
                      {i < 2 && (
                        <div className={cn(
                          "w-16 md:w-20 h-0.5 mx-2 -mt-5 rounded-full transition-colors duration-300",
                          stepIndex > i ? "bg-success" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step Content Card */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-5 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
              <h2 className="text-xl font-display font-bold text-foreground">
                {step === 'school' && 'Find your school'}
                {step === 'role' && 'Select your role'}
                {step === 'credentials' && 'Welcome back!'}
                {step === 'superadmin' && 'Super Admin'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 'school' && 'Search by name or school code'}
                {step === 'role' && `Logging into ${selectedSchool?.name}`}
                {step === 'credentials' && `Sign in as ${roleOptions.find(r => r.role === selectedRole)?.label}`}
                {step === 'superadmin' && 'System administrator access'}
              </p>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {error && (
                <div className="mb-5 p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: School Search */}
              {step === 'school' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search school name or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 text-base rounded-xl border-2 focus:border-primary bg-white"
                      autoFocus
                    />
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl divide-y divide-border/50 max-h-56 overflow-y-auto scrollbar-thin">
                    {displaySchools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => handleSelectSchool(school)}
                        className={cn(
                          "w-full p-4 text-left transition-all flex items-center gap-4",
                          "hover:bg-white active:bg-white/80",
                          selectedSchool?.id === school.id && "bg-white"
                        )}
                      >
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {school.logo ? (
                            <img 
                              src={school.logo} 
                              alt={`${school.name} logo`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <School className={cn("w-5 h-5 text-primary", school.logo && "hidden")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{school.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{school.city}</span>
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{school.code}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                    
                    {searchQuery && searchResults.length === 0 && !searchLoading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium text-sm">No schools found</p>
                      </div>
                    )}

                    {displaySchools.length === 0 && !searchQuery && (
                      <div className="text-center py-8 text-muted-foreground">
                        <School className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium text-sm">No schools registered</p>
                        <p className="text-xs mt-1">Contact admin to add your school</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Role Selection */}
              {step === 'role' && (
                <div className="space-y-3">
                  {roleOptions.map((option) => (
                    <button
                      key={option.role}
                      onClick={() => handleSelectRole(option.role)}
                      className={cn(
                        "w-full p-4 rounded-xl text-left transition-all flex items-center gap-4",
                        "bg-muted/30 hover:bg-white active:scale-[0.99]",
                        selectedRole === option.role && "bg-white ring-2 ring-primary"
                      )}
                    >
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <option.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors py-3 mt-2"
                  >
                    ← Change school
                  </button>
                </div>
              )}

              {/* Step 3: Credentials */}
              {step === 'credentials' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="input-label">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
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
                  
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border w-4 h-4" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <button type="button" className="text-primary hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" size="xl" className="w-full h-14 text-base rounded-xl" disabled={loading}>
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

                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Contact your administrator if you don't have an account
                  </p>
                  
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    ← Back to role selection
                  </button>
                </form>
              )}

              {/* Super Admin Login with OTP */}
              {step === 'superadmin' && (
                <SuperAdminOTPLogin 
                  onBack={() => {
                    setStep('school');
                    setError('');
                  }}
                  onSuccess={() => {
                    // Navigation will be handled by auth state change
                  }}
                />
              )}
            </div>
          </div>

          {/* Super Admin Link - Outside main card */}
          {step === 'school' && (
            <button
              type="button"
              onClick={() => setStep('superadmin')}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span>🔐</span>
              <span>Super Admin Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm px-4 py-4 text-center border-t border-border/50 safe-area-bottom">
        <p className="text-sm text-muted-foreground">
          Need help? Contact{' '}
          <a href="mailto:support@ourschooltech.in" className="text-primary hover:underline font-medium">
            support@ourschooltech.in
          </a>
        </p>
      </footer>
    </div>
  );
}
