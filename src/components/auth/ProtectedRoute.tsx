import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useTenant } from '@/contexts/TenantContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireImpersonation?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireImpersonation }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isImpersonating } = useImpersonation();
  const { isSubdomain } = useTenant();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated) {
    if (isSubdomain) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const hasRole = allowedRoles.includes(user.role);
    
    if (hasRole && requireImpersonation && user.role === 'super_admin' && !isImpersonating) {
      return <Navigate to="/super-admin/schools" replace />;
    }

    if (!hasRole) {
      const dashboardPath = getRoleDashboard(user.role);
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return <>{children}</>;
}

export function getRoleDashboard(role: UserRole): string {
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
      return '/login';
  }
}
