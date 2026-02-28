import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, school } = useAuth();
  const location = useLocation();
  
  const userRole = user?.role || 'school_admin';
  const schoolName = school?.name || 'Our School Tech';
  const userName = user?.name || 'User';

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Desktop only */}
      <Sidebar 
        userRole={userRole} 
        schoolName={schoolName}
        userName={userName}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-64 h-full bg-sidebar animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar 
              userRole={userRole}
              schoolName={schoolName}
              userName={userName}
              isMobileOverlay
              onMobileClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className={cn(
          "flex-1 p-4 md:p-6 overflow-auto",
          "pb-24 md:pb-6"
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav userRole={userRole} />
    </div>
  );
}