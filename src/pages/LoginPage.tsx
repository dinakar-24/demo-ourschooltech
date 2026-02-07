import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Search, MapPin, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth, useSchoolSearch, UserRole } from '@/contexts/AuthContext';
import type { School as SchoolType } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminOTPLogin } from '@/components/auth/SuperAdminOTPLogin';
import { LoginHero } from '@/components/login/LoginHero';
import { LoginRoleSelector } from '@/components/login/LoginRoleSelector';
import { LoginForm } from '@/components/login/LoginForm';

type LoginStep = 'landing' | 'school' | 'login' | 'superadmin';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, selectSchool, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<LoginStep>('landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allSchools, setAllSchools] = useState<SchoolType[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const paths: Record<UserRole, string> = {
        super_admin: '/super-admin/dashboard',
        school_admin: '/admin/dashboard',
        teacher: '/teacher/dashboard',
        parent: '/parent/dashboard',
        student: '/student/dashboard',
      };
      navigate(paths[user.role] || '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase.from('schools').select('*').limit(10);
      if (!error && data) {
        setAllSchools(data.map(s => ({
          id: s.id, name: s.name, code: s.code,
          logo: s.logo || undefined, address: s.address, city: s.city,
        })));
      }
    };
    fetchSchools();
  }, []);

  const { schools: searchResults, isLoading: searchLoading } = useSchoolSearch(searchQuery);
  const displaySchools = searchQuery.trim() ? searchResults : allSchools;

  const handleSelectSchool = (school: SchoolType) => {
    setSelectedSchool(school);
    selectSchool(school);
    setError('');
    setStep('login');
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
  };

  const handleLogin = async (email: string, password: string) => {
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
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Landing / Splash screen
  if (step === 'landing') {
    return (
      <div className="min-h-[100dvh] flex flex-col lg:flex-row">
        {/* Hero takes full screen on mobile landing */}
        <div className="flex-1 relative">
          <LoginHero />
          {/* CTA overlay at bottom */}
          <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col items-center gap-3 animate-login-card-slide lg:relative lg:p-8">
            <button
              onClick={() => setStep('school')}
              className="w-full max-w-xs h-14 rounded-full bg-white text-primary font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setStep('superadmin')}
              className="text-white/50 hover:text-white/80 text-xs transition-colors"
            >
              🔐 Super Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Super admin login
  if (step === 'superadmin') {
    return (
      <div className="min-h-[100dvh] flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-1/2">
          <LoginHero />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary via-primary-hover to-[hsl(200,80%,25%)]">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl animate-login-card-slide">
            <h2 className="text-xl font-display font-bold text-white mb-1">Super Admin</h2>
            <p className="text-white/60 text-sm mb-6">System administrator access</p>
            <SuperAdminOTPLogin
              onBack={() => setStep('landing')}
              onSuccess={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Left: Hero (hidden on mobile for school/login steps, visible on desktop) */}
      <div className="hidden lg:flex lg:w-1/2">
        <LoginHero />
      </div>

      {/* Right: Form area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-primary via-primary-hover to-[hsl(200,80%,25%)] min-h-[100dvh] lg:min-h-0">
        {/* Mobile brand header */}
        <header className="lg:hidden flex items-center gap-3 px-5 pt-6 pb-3 safe-area-top">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
            <School className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-display font-bold text-white">Our School Tech</span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 overflow-auto">
          <div className="w-full max-w-md space-y-6">

            {/* School Selection Step */}
            {step === 'school' && (
              <div className="space-y-5 animate-login-card-slide">
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white">Find your school</h2>
                  <p className="text-white/60 text-sm mt-1">Search by name or school code</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search school name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-13 text-base rounded-xl border-0 bg-white shadow-lg"
                    autoFocus
                  />
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl divide-y divide-white/10 max-h-64 overflow-y-auto scrollbar-thin border border-white/10">
                  {displaySchools.map((school, i) => (
                    <button
                      key={school.id}
                      onClick={() => handleSelectSchool(school)}
                      className="w-full p-4 text-left transition-all flex items-center gap-4 hover:bg-white/10 active:bg-white/15 animate-login-role-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 overflow-hidden">
                        {school.logo ? (
                          <img src={school.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <School className="w-5 h-5 text-white/70" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{school.name}</p>
                        <div className="flex items-center gap-2 text-sm text-white/50 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{school.city}</span>
                          <span className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">{school.code}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/40" />
                    </button>
                  ))}

                  {searchQuery && searchResults.length === 0 && !searchLoading && (
                    <div className="text-center py-8 text-white/40">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium text-sm">No schools found</p>
                    </div>
                  )}
                  {displaySchools.length === 0 && !searchQuery && (
                    <div className="text-center py-8 text-white/40">
                      <School className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium text-sm">No schools registered</p>
                    </div>
                  )}
                </div>

                <button onClick={() => setStep('landing')} className="w-full text-sm text-white/50 hover:text-white transition-colors py-2">
                  ← Back
                </button>
              </div>
            )}

            {/* Login Step: Role selector + credentials */}
            {step === 'login' && (
              <div className="space-y-6 animate-login-card-slide">
                {/* School indicator */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden">
                    {selectedSchool?.logo ? (
                      <img src={selectedSchool.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <School className="w-5 h-5 text-white/70" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedSchool?.name}</p>
                    <p className="text-white/50 text-xs">{selectedSchool?.city}</p>
                  </div>
                </div>

                {/* Glassmorphism card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl space-y-6">
                  <LoginRoleSelector selectedRole={selectedRole} onSelectRole={handleSelectRole} />
                  
                  {selectedRole && (
                    <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
                  )}
                </div>

                <button onClick={() => { setStep('school'); setSelectedSchool(null); setSelectedRole(null); setError(''); }} className="w-full text-sm text-white/50 hover:text-white transition-colors py-2">
                  ← Change school
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-5 py-4 text-center safe-area-bottom">
          <p className="text-xs text-white/30">
            Need help? <a href="mailto:support@ourschooltech.in" className="hover:text-white/60 underline">support@ourschooltech.in</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
