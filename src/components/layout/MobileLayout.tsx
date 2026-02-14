import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  FileText,
  User,
  BookOpen,
  Award,
  LogOut,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const navConfig: Record<UserRole, Array<{ label: string; href: string; icon: typeof LayoutDashboard }>> = {
  super_admin: [],
  school_admin: [],
  teacher: [
    { label: 'Home', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/teacher/attendance', icon: ClipboardList },
    { label: 'Homework', href: '/teacher/homework', icon: BookOpen },
    { label: 'Marks', href: '/teacher/marks', icon: FileText },
    { label: 'Profile', href: '/teacher/profile', icon: User },
  ],
  parent: [
    { label: 'Home', href: '/parent/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/parent/attendance', icon: ClipboardList },
    { label: 'Fees', href: '/parent/fees', icon: CreditCard },
    { label: 'Results', href: '/parent/results', icon: Award },
    { label: 'Profile', href: '/parent/profile', icon: User },
  ],
  student: [
    { label: 'Home', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/student/attendance', icon: ClipboardList },
    { label: 'Homework', href: '/student/homework', icon: BookOpen },
    { label: 'Results', href: '/student/results', icon: Award },
    { label: 'Profile', href: '/student/profile', icon: User },
  ],
};

export function MobileLayout({ children, title, showBack, onBack }: MobileLayoutProps) {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch avatar from profiles table as fallback
  const { data: profileAvatar } = useQuery({
    queryKey: ['profile-avatar', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Check profiles table first
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
      if (profile?.avatar_url) return profile.avatar_url;
      // For students, also check students table
      const { data: student } = await supabase.from('students').select('avatar_url').eq('user_id', user.id).maybeSingle();
      return student?.avatar_url || null;
    },
    enabled: !!user?.id && !user?.avatar,
    staleTime: 5 * 60 * 1000,
  });

  const avatarUrl = user?.avatar || profileAvatar;

  const role = user?.role || 'student';
  const navItems = navConfig[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {showBack && (
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={handleBack}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <Avatar className="w-8 h-8 border border-primary-foreground/20">
              <AvatarImage src={avatarUrl} alt={user?.name} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-semibold">
                {title || school?.name}
              </h1>
              {!title && (
                <p className="text-xs text-primary-foreground/70 capitalize">
                  {role.replace('_', ' ')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
