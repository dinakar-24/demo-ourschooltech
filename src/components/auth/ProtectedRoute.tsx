import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useTenant } from '@/contexts/TenantContext';
import { ReactNode, useRef } from 'react';
import { EyesRefreshAnimation } from '@/components/ui/eyes-refresh-animation';

/** Detect if the current page load is a refresh (not initial visit or navigation) */
function isPageRefresh(): boolean {
  try {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0) {
      return entries[0].type === 'reload';
    }
  } catch {
    // fallback
  }
  return false;
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  /** When true and user is super_admin, requires active impersonation to access */
  requireImpersonation?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireImpersonation }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isImpersonating } = useImpersonation();
  const { isSubdomain } = useTenant();
  const location = useLocation();
  const isRefresh = useRef(isPageRefresh());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <EyesRefreshAnimation visible={isRefresh.current} message="Refreshing..." />
      </div>
    );
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
