import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface School {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address: string;
  city: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and role from database
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      if (!profile) {
        console.log('No profile found for user');
        return null;
      }

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      // Fetch school if profile has school_id
      let schoolData: School | null = null;
      if (profile.school_id) {
        const { data: schoolResult, error: schoolError } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .maybeSingle();

        if (!schoolError && schoolResult) {
          schoolData = {
            id: schoolResult.id,
            name: schoolResult.name,
            code: schoolResult.code,
            logo: schoolResult.logo || undefined,
            address: schoolResult.address,
            city: schoolResult.city,
          };
        }
      }

      const userData: User = {
        id: supabaseUser.id,
        name: profile.full_name,
        email: profile.email,
        role: (roleData?.role as UserRole) || 'student',
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock
          setTimeout(async () => {
            const data = await fetchUserData(session.user);
            if (data) {
              setUser(data.user);
              setSchool(data.school);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setSchool(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const data = await fetchUserData(session.user);
        if (data) {
          setUser(data.user);
          setSchool(data.school);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

    // User data will be fetched by the auth state listener
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
      // Update profile with school_id
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

      // Insert user role
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSchool(null);
  };

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
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .or(`name.ilike.%${query}%,code.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(10);

      if (!error && data) {
        setSchools(data.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          logo: s.logo || undefined,
          address: s.address,
          city: s.city,
        })));
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchSchools, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return { schools, isLoading };
}
