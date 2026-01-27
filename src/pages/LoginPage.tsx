import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Eye, EyeOff, ArrowRight, Loader2, Search, MapPin, Check, User, GraduationCap, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth, useSchoolSearch, mockSchools, UserRole } from '@/contexts/AuthContext';
import type { School as SchoolType } from '@/contexts/AuthContext';

type LoginStep = 'school' | 'role' | 'credentials';

const roleOptions: { role: UserRole; label: string; icon: typeof User; description: string }[] = [
  { role: 'school_admin', label: 'School Admin', icon: School, description: 'Full administrative access' },
  { role: 'teacher', label: 'Teacher', icon: GraduationCap, description: 'Classes, attendance & homework' },
  { role: 'parent', label: 'Parent', icon: Users, description: 'View your child\'s progress' },
  { role: 'student', label: 'Student', icon: BookOpen, description: 'View your academics' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, selectSchool, isLoading } = useAuth();
  
  const [step, setStep] = useState<LoginStep>('school');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchResults = useSchoolSearch(searchQuery);
  const displaySchools = searchQuery.trim() ? searchResults : mockSchools.slice(0, 5);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }
    if (!selectedSchool || !selectedRole) {
      setError('Please select a school and role');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login(selectedSchool.id, username, password, selectedRole);
      
      // Navigate based on role
      switch (selectedRole) {
        case 'super_admin':
        case 'school_admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'parent':
          navigate('/parent/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding (Desktop only) */}
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

      {/* Right Panel - Login Flow */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <School className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">SchoolERP</span>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {['school', 'role', 'credentials'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s ? "bg-primary text-primary-foreground" :
                  ['school', 'role', 'credentials'].indexOf(step) > i ? "bg-success text-success-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {['school', 'role', 'credentials'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && (
                  <div className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    ['school', 'role', 'credentials'].indexOf(step) > i ? "bg-success" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {step === 'school' && 'Find your school'}
              {step === 'role' && 'Select your role'}
              {step === 'credentials' && 'Sign in'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {step === 'school' && 'Search by school name or code'}
              {step === 'role' && `Signing into ${selectedSchool?.name}`}
              {step === 'credentials' && `Continue as ${roleOptions.find(r => r.role === selectedRole)?.label}`}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          {/* Step 1: School Search */}
          {step === 'school' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search school name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {displaySchools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSelectSchool(school)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      selectedSchool?.id === school.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <School className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{school.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{school.city}</span>
                          <span className="text-border">•</span>
                          <span className="font-mono text-xs">{school.code}</span>
                        </div>
                      </div>
                      {selectedSchool?.id === school.id && (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
                
                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No schools found for "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try a different search term</p>
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
                    "w-full p-4 rounded-xl border text-left transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    selectedRole === option.role 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <option.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {selectedRole === option.role && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
              
              <button
                type="button"
                onClick={goBack}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                ← Change school
              </button>
            </div>
          )}

          {/* Step 3: Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="input-label">Username / Email</label>
                <Input
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Demo: admin / teacher / parent / student (password: [role]123)
                </p>
              </div>
              
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12"
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
                onClick={goBack}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to role selection
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
