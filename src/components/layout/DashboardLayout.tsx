import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  userRole?: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
}

export function DashboardLayout({ children, title, userRole = 'school_admin' }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Desktop only */}
      <Sidebar userRole={userRole} />

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
            <Sidebar userRole={userRole} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className={cn(
          "flex-1 p-4 md:p-6 overflow-auto",
          "pb-24 md:pb-6" // Extra padding for mobile nav
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav userRole={userRole} />
    </div>
  );
}
