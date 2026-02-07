import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Search, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth, useSchoolSearch, UserRole } from '@/contexts/AuthContext';
import type { School as SchoolType } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminOTPLogin } from '@/components/auth/SuperAdminOTPLogin';
import { LoginSplash } from '@/components/login/LoginSplash';
import { LoginShapes } from '@/components/login/LoginShapes';
import { LoginRoleSelector } from '@/components/login/LoginRoleSelector';
import { LoginForm } from '@/components/login/LoginForm';

type LoginStep = 'splash' | 'school' | 'login' | 'superadmin';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, selectSchool, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<LoginStep>('splash');
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
    if (!email.trim() || !password.trim()) { setError('Please enter email and password'); return; }
    if (!selectedSchool || !selectedRole) { setError('Please select a school and role'); return; }
    setLoading(true);
    setError('');
    try { await login(email, password); }
    catch (err: any) { setError(err.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  // Splash
  if (step === 'splash') {
    return <LoginSplash onGetStarted={() => setStep('school')} onSuperAdmin={() => setStep('superadmin')} />;
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
          onClick={() => {
            if (step === 'login') { setStep('school'); setSelectedSchool(null); setSelectedRole(null); setError(''); }
            else { setStep('splash'); }
          }}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <School className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-base font-display font-bold text-white">Our School Tech</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 py-4 relative z-10 overflow-auto">
        <div className="w-full max-w-md flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {step === 'school' && (
              <motion.div
                key="school"
                className="flex-1 flex flex-col space-y-5"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: 'spring', damping: 22 }}
              >
                <div className="text-center pt-2">
                  <h2 className="text-2xl font-display font-bold text-white">Find your school</h2>
                  <p className="text-white/50 text-sm mt-1">Search by name or code</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <Input
                    type="text"
                    placeholder="Search school..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-13 text-base rounded-2xl border-0 bg-white shadow-lg focus-visible:ring-2 focus-visible:ring-white/30"
                    autoFocus
                  />
                </div>

                <div className="flex-1 bg-white/[0.06] backdrop-blur-sm rounded-2xl divide-y divide-white/[0.06] max-h-[50vh] overflow-y-auto scrollbar-thin border border-white/10">
                  {displaySchools.map((school, i) => (
                    <motion.button
                      key={school.id}
                      onClick={() => handleSelectSchool(school)}
                      className="w-full p-4 text-left flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 overflow-hidden">
                        {school.logo ? (
                          <img src={school.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <School className="w-5 h-5 text-white/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{school.name}</p>
                        <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{school.city}</span>
                          <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{school.code}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30" />
                    </motion.button>
                  ))}

                  {searchQuery && searchResults.length === 0 && !searchLoading && (
                    <div className="text-center py-10 text-white/30">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No schools found</p>
                    </div>
                  )}
                  {displaySchools.length === 0 && !searchQuery && (
                    <div className="text-center py-10 text-white/30">
                      <School className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No schools registered</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'login' && (
              <motion.div
                key="login"
                className="flex-1 flex flex-col space-y-5"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: 'spring', damping: 22 }}
              >
                {/* School indicator */}
                <motion.div
                  className="flex items-center justify-center gap-3 pt-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden">
                    {selectedSchool?.logo ? (
                      <img src={selectedSchool.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <School className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedSchool?.name}</p>
                    <p className="text-white/40 text-xs">{selectedSchool?.city}</p>
                  </div>
                </motion.div>

                {/* Glassmorphism login card */}
                <motion.div
                  className="bg-white/[0.08] backdrop-blur-xl rounded-3xl p-6 border border-white/15 shadow-2xl space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 22 }}
                >
                  <LoginRoleSelector selectedRole={selectedRole} onSelectRole={handleSelectRole} />

                  <AnimatePresence>
                    {selectedRole && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'spring', damping: 22 }}
                      >
                        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
