import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionWarningBanner } from '@/components/layout/SessionWarningBanner';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { friendlyErrorMessage } from '@/lib/error-utils';
import { logError, updateLoggerContext } from '@/lib/logger';

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface School {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId: string;
  schoolName: string;
  childName?: string;
  className?: string;
  section?: string;
  employeeId?: string;
  subjects?: string[];
}

interface AuthContextType {
  user: User | null;
  school: School | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole, schoolId: string) => Promise<void>;
  logout: () => void;
  selectSchool: (school: School) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- sessionStorage cache helpers ---
const AUTH_CACHE_KEY = 'ost_auth_cache';

function cacheAuthData(user: User, school: School | null) {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user, school, ts: Date.now() }));
  } catch { /* quota exceeded is non-critical */ }
}

function getCachedAuth(): { user: User; school: School | null } | null {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 30 minutes
    if (Date.now() - parsed.ts > 30 * 60 * 1000) {
      sessionStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    return { user: parsed.user, school: parsed.school };
  } catch {
    return null;
  }
}

function clearAuthCache() {
  try { sessionStorage.removeItem(AUTH_CACHE_KEY); } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore from cache for instant UI on reopen
  const cached = getCachedAuth();
  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [school, setSchool] = useState<School | null>(cached?.school ?? null);
  const [isLoading, setIsLoading] = useState(!cached); // skip loading if cached
  const { tenant, isSubdomain } = useTenant();

  // Cross-tenant validation
  const validateTenant = useCallback(async (userData: User) => {
    if (isSubdomain && tenant) {
      if (userData.schoolId !== tenant.schoolId) {
        await supabase.auth.signOut();
        setUser(null);
        setSchool(null);
        clearAuthCache();
        toast.error('Your account does not belong to this school. Please use the correct school portal.');
        return false;
      }
    }
    return true;
  }, [isSubdomain, tenant]);

  // Fetch user profile, role, and school in a single optimized query
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase.rpc('get_user_auth_data', {
        _user_id: supabaseUser.id,
      });

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      const result = data as unknown as { profile: any; role: string | null; school: any | null } | null;

      if (!result?.profile) {
        console.log('No profile found for user');
        return null;
      }

      const { profile, role, school } = result;

      const schoolData: School | null = school
        ? {
            id: school.id,
            name: school.name,
            code: school.code,
            logo: school.logo || undefined,
            address: school.address,
            city: school.city,
            phone: school.phone || undefined,
            email: school.email || undefined,
          }
        : null;

      const userData: User = {
        id: supabaseUser.id,
        name: profile.full_name,
        email: profile.email,
        role: (role as UserRole) || 'student',
        avatar: profile.avatar_url || undefined,
        schoolId: profile.school_id || '',
        schoolName: schoolData?.name || '',
        className: profile.class_name || undefined,
        section: profile.section || undefined,
        employeeId: profile.employee_id || undefined,
        subjects: profile.subjects || undefined,
      };

      return { user: userData, school: schoolData };
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return null;
    }
  };

  // Deduplication guard to prevent triple RPC calls
  const fetchInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userId = session.user.id;
          // Skip if a fetch for this user is already in progress
          if (fetchInFlightRef.current === userId) return;
          fetchInFlightRef.current = userId;

          setTimeout(async () => {
            try {
              const data = await fetchUserData(session.user);
              if (data) {
                const isValid = await validateTenant(data.user);
                if (isValid) {
                  setUser(data.user);
                  setSchool(data.school);
                  cacheAuthData(data.user, data.school);
                  updateLoggerContext(data.user.id, data.user.schoolId);
                }
              }
            } finally {
              fetchInFlightRef.current = null;
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setSchool(null);
          clearAuthCache();
          updateLoggerContext(undefined, undefined);
          setIsLoading(false);
        }
      }
    );

    // Only check for no-session case (onAuthStateChange handles active sessions)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setUser(null);
        setSchool(null);
        clearAuthCache();
        setIsLoading(false);
      }
      // If session exists, onAuthStateChange INITIAL_SESSION event handles it
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [validateTenant]);

  const selectSchool = (selectedSchool: School) => {
    setSchool(selectedSchool);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      logError('auth', `Login failed: ${error.message}`, { email }, 'warning');
      throw new Error(friendlyErrorMessage(error.message));
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole, schoolId: string) => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setIsLoading(false);
      throw new Error(friendlyErrorMessage(error.message));
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          school_id: schoolId,
          full_name: fullName,
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: data.user.id, 
          role: role 
        });

      if (roleError) {
        console.error('Error inserting role:', roleError);
      }
    }

    setIsLoading(false);
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSchool(null);
    clearAuthCache();
  }, []);

  const handleSessionTimeout = useCallback(() => {
    toast.info('You have been logged out due to inactivity.');
    logout();
  }, [logout]);

  const { showWarning, remainingSeconds, extendSession } = useSessionTimeout(user?.role, handleSessionTimeout);

  return (
    <AuthContext.Provider value={{
      user,
      school,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      selectSchool,
    }}>
      {children}
      {showWarning && (
        <SessionWarningBanner
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to search schools
export function useSchoolSearch(query: string): { schools: School[]; isLoading: boolean } {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSchools([]);
      return;
    }

    const searchSchools = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('search_schools_public', {
        _query: query.trim(),
      });

      if (!error && data) {
        setSchools((data as any[]).map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          logo: s.logo || undefined,
          address: '',
          city: s.city,
        })));
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchSchools, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  return { schools, isLoading };
}
