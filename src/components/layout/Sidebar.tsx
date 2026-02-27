import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardList,
  CreditCard,
  BookOpen,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  School,
  BarChart3,
  Clock,
  LogOut,
  Menu,
  X,
  Shield,
  UserCheck,
  ScrollText,
  Upload,
  Video,
  Bus,
  MessageCircle,
  Image,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import appLogo from '@/assets/logo.png';

interface SidebarProps {
  userRole?: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
  schoolName?: string;
  userName?: string;
}

// Route prefixes for each role
const rolePrefix = {
  super_admin: '/super-admin',
  school_admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
};

// Menu items with relative paths (prefix will be added)
const menuConfig = {
  super_admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Schools', path: '/schools', icon: School },
    { label: 'School Admins', path: '/admins', icon: UserCheck },
    { label: 'All Users', path: '/users', icon: Users },
    { label: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
    { label: 'Announcements', path: '/announcements', icon: Bell },
    { label: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
  school_admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Teachers', path: '/teachers', icon: GraduationCap },
    { label: 'Classes', path: '/classes', icon: BookOpen },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Fees', path: '/fees', icon: CreditCard },
    { label: 'Exams', path: '/exams', icon: FileText },
    { label: 'Online Classes', path: '/online-classes', icon: Video },
    { label: 'Transport', path: '/transport', icon: Bus },
    { label: 'Messages', path: '/messages', icon: MessageCircle },
    { label: 'Academic Years', path: '/academic-years', icon: Calendar },
    { label: 'Timetable', path: '/timetable', icon: Clock },
    { label: 'Announcements', path: '/announcements', icon: Bell },
    { label: 'Bulk Upload', path: '/bulk-upload', icon: Upload },
    { label: 'Gallery', path: '/gallery', icon: Image },
    { label: 'Feedback', path: '/feedback', icon: MessageSquare },
    { label: 'Queries', path: '/queries', icon: HelpCircle },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Subscription', path: '/subscription', icon: CreditCard },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
  teacher: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Homework', path: '/homework', icon: FileText },
    { label: 'Marks', path: '/marks', icon: BarChart3 },
    { label: 'Online Classes', path: '/online-classes', icon: Video },
    { label: 'Timetable', path: '/timetable', icon: Clock },
    { label: 'Messages', path: '/messages', icon: MessageCircle },
    { label: 'Announcements', path: '/announcements', icon: Bell },
    { label: 'Feedback', path: '/feedback', icon: MessageSquare },
    { label: 'Queries', path: '/queries', icon: HelpCircle },
    { label: 'Profile', path: '/profile', icon: GraduationCap },
  ],
  parent: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Homework', path: '/homework', icon: BookOpen },
    { label: 'Fees', path: '/fees', icon: CreditCard },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'Online Classes', path: '/online-classes', icon: Video },
    { label: 'Transport', path: '/transport', icon: Bus },
    { label: 'Messages', path: '/messages', icon: MessageCircle },
    { label: 'Announcements', path: '/announcements', icon: Bell },
    { label: 'Gallery', path: '/gallery', icon: Image },
    { label: 'Feedback', path: '/feedback', icon: MessageSquare },
    { label: 'Queries', path: '/queries', icon: HelpCircle },
    { label: 'Profile', path: '/profile', icon: Users },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Homework', path: '/homework', icon: FileText },
    { label: 'Timetable', path: '/timetable', icon: Clock },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'Online Classes', path: '/online-classes', icon: Video },
    { label: 'Transport', path: '/transport', icon: Bus },
    { label: 'Announcements', path: '/announcements', icon: Bell },
    { label: 'Gallery', path: '/gallery', icon: Image },
    { label: 'Profile', path: '/profile', icon: GraduationCap },
  ],
};

export function Sidebar({ userRole = 'school_admin', schoolName = 'Our School Tech', userName = 'Rajesh Kumar' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const { tenant, isSubdomain } = useTenant();

  // Use tenant branding on subdomains
  const displayLogo = isSubdomain && tenant?.logo ? tenant.logo : appLogo;
  const displayName = isSubdomain && tenant ? tenant.name : (userRole === 'super_admin' ? 'Super Admin' : schoolName);

  const menuItems = menuConfig[userRole];
  const prefix = rolePrefix[userRole];

  const getFullPath = (path: string) => `${prefix}${path}`;

  const isActive = (path: string) => {
    const fullPath = getFullPath(path);
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
  };

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground h-screen sticky top-0 transition-all duration-300 z-40",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={displayLogo} alt={displayName} className="w-10 h-10 object-contain drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon-sm" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link
                to={getFullPath(item.path)}
                className={cn(
                  "nav-item",
                  isActive(item.path) && "nav-item-active"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
            <img src={displayLogo} alt={displayName} className="w-9 h-9 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{userName}</p>
              <button 
                onClick={logout}
                className="text-xs text-sidebar-foreground/70 hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
