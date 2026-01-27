import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  // Role-specific data
  childName?: string; // For parents
  className?: string; // For students/parents
  section?: string;
  employeeId?: string; // For teachers
  subjects?: string[]; // For teachers
}

interface AuthContextType {
  user: User | null;
  school: School | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (schoolId: string, username: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  selectSchool: (school: School) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock schools data for demo
const mockSchools: School[] = [
  { id: '1', name: 'Delhi Public School', code: 'DPS2024', address: 'Sector 45, Gurugram', city: 'Gurugram' },
  { id: '2', name: 'Ryan International School', code: 'RYAN2024', address: 'Vasant Kunj', city: 'New Delhi' },
  { id: '3', name: 'St. Xavier\'s High School', code: 'STXAV24', address: 'Andheri West', city: 'Mumbai' },
  { id: '4', name: 'Kendriya Vidyalaya', code: 'KV2024', address: 'IIT Campus', city: 'Chennai' },
  { id: '5', name: 'DAV Public School', code: 'DAV2024', address: 'Sector 14', city: 'Chandigarh' },
];

// Mock users for demo
const mockUsers: Record<string, { password: string; user: Omit<User, 'schoolId' | 'schoolName'> }> = {
  'admin': {
    password: 'admin123',
    user: { id: '1', name: 'Rajesh Kumar', email: 'admin@dps.edu.in', role: 'school_admin', avatar: undefined }
  },
  'teacher': {
    password: 'teacher123',
    user: { id: '2', name: 'Priya Sharma', email: 'priya@dps.edu.in', role: 'teacher', employeeId: 'EMP001', subjects: ['Mathematics', 'Physics'] }
  },
  'parent': {
    password: 'parent123',
    user: { id: '3', name: 'Amit Verma', email: 'amit@gmail.com', role: 'parent', childName: 'Arjun Verma', className: 'Class 8', section: 'A' }
  },
  'student': {
    password: 'student123',
    user: { id: '4', name: 'Arjun Verma', email: 'arjun@dps.edu.in', role: 'student', className: 'Class 8', section: 'A' }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('erp_user');
    const storedSchool = localStorage.getItem('erp_school');
    
    if (storedUser && storedSchool) {
      setUser(JSON.parse(storedUser));
      setSchool(JSON.parse(storedSchool));
    }
    setIsLoading(false);
  }, []);

  const selectSchool = (selectedSchool: School) => {
    setSchool(selectedSchool);
    localStorage.setItem('erp_school', JSON.stringify(selectedSchool));
  };

  const login = async (schoolId: string, username: string, password: string, role: UserRole) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = mockUsers[username.toLowerCase()];
    
    if (!mockUser || mockUser.password !== password) {
      setIsLoading(false);
      throw new Error('Invalid username or password');
    }

    if (mockUser.user.role !== role) {
      setIsLoading(false);
      throw new Error(`This account is not registered as ${role.replace('_', ' ')}`);
    }

    const selectedSchool = mockSchools.find(s => s.id === schoolId) || mockSchools[0];
    
    const authenticatedUser: User = {
      ...mockUser.user,
      schoolId: selectedSchool.id,
      schoolName: selectedSchool.name,
    };

    setUser(authenticatedUser);
    setSchool(selectedSchool);
    localStorage.setItem('erp_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('erp_school', JSON.stringify(selectedSchool));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setSchool(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_school');
  };

  return (
    <AuthContext.Provider value={{
      user,
      school,
      isAuthenticated: !!user,
      isLoading,
      login,
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

export function useSchoolSearch(query: string): School[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return mockSchools.filter(
    school => 
      school.name.toLowerCase().includes(lowerQuery) ||
      school.code.toLowerCase().includes(lowerQuery) ||
      school.city.toLowerCase().includes(lowerQuery)
  );
}

export { mockSchools };
