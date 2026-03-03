import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionWarningBanner } from '@/components/layout/SessionWarningBanner';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

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
  const isFreshCache = cached && (() => {
    try {
      const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
      if (!raw) return false;
      return Date.now() - JSON.parse(raw).ts < 5 * 60 * 1000; // fresh if < 5 min
    } catch { return false; }
  })();
  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [school, setSchool] = useState<School | null>(cached?.school ?? null);
  const [isLoading, setIsLoading] = useState(!isFreshCache); // instant render if fresh cache
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
      // Direct fetch to bypass Supabase client lock contention
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_user_auth_data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ _user_id: supabaseUser.id }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        console.error('Error fetching user data:', res.status);
        return null;
      }

      const result = await res.json() as { profile: any; role: string | null; school: any | null } | null;

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

  useEffect(() => {
    let isMounted = true;

    // Check if there's a session token in localStorage before calling getSession
    // This avoids the Supabase client lock contention for unauthenticated users
    const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
    const hasStoredSession = !!localStorage.getItem(storageKey);

    const initSession = async () => {
      if (!hasStoredSession) {
        // No stored session — skip getSession() entirely to avoid lock hang
        if (isMounted) {
          setUser(null);
          setSchool(null);
          clearAuthCache();
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const data = await fetchUserData(session.user);
          if (!isMounted) return;
          if (data) {
            const isValid = await validateTenant(data.user);
            if (isValid && isMounted) {
              setUser(data.user);
              setSchool(data.school);
              cacheAuthData(data.user, data.school);
            }
          }
        } else {
          setUser(null);
          setSchool(null);
          clearAuthCache();
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setSchool(null);
          clearAuthCache();
        }
      }
      if (isMounted) setIsLoading(false);
    };

    initSession();

    // Then listen for subsequent auth changes (sign-in, sign-out, token refresh)
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        // Skip the initial session event since getSession handles it
        if (event === 'INITIAL_SESSION') return;

        // Skip fetchUserData on TOKEN_REFRESHED when we already have cached data
        if (event === 'TOKEN_REFRESHED' && user) {
          return;
        }

        if (session?.user) {
          // Debounce rapid auth events (50ms) to prevent RPC storms
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(async () => {
            if (!isMounted) return;
            const data = await fetchUserData(session.user);
            if (!isMounted) return;
            if (data) {
              const isValid = await validateTenant(data.user);
              if (isValid && isMounted) {
                setUser(data.user);
                setSchool(data.school);
                cacheAuthData(data.user, data.school);
              }
            }
            if (isMounted) setIsLoading(false);
          }, 50);
        } else {
          setUser(null);
          setSchool(null);
          clearAuthCache();
          setIsLoading(false);
        }
      }
    );

    // Safety timeout — if nothing resolves in 4 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      if (debounceTimer) clearTimeout(debounceTimer);
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
      throw new Error(error.message);
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
      throw new Error(error.message);
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
    try { sessionStorage.removeItem('ost_email_lookup_cache'); } catch {}
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
