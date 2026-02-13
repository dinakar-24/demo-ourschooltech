import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  Bell,
  MoreHorizontal,
  School,
  FileText,
  BarChart3,
} from 'lucide-react';

interface MobileNavProps {
  userRole?: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
}

// Route prefixes for each role
const rolePrefix = {
  super_admin: '/super-admin',
  school_admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
};

// Mobile nav items with relative paths
const navConfig = {
  super_admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Schools', path: '/schools', icon: School },
    { label: 'Users', path: '/users', icon: Users },
    { label: 'Settings', path: '/settings', icon: MoreHorizontal },
  ],
  school_admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Fees', path: '/fees', icon: CreditCard },
    { label: 'More', path: '/settings', icon: MoreHorizontal },
  ],
  teacher: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Homework', path: '/homework', icon: FileText },
    { label: 'Marks', path: '/marks', icon: BarChart3 },
    { label: 'More', path: '/announcements', icon: MoreHorizontal },
  ],
  parent: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Fees', path: '/fees', icon: CreditCard },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'More', path: '/announcements', icon: MoreHorizontal },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/attendance', icon: ClipboardList },
    { label: 'Homework', path: '/homework', icon: FileText },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'More', path: '/announcements', icon: MoreHorizontal },
  ],
};

export function MobileNav({ userRole = 'school_admin' }: MobileNavProps) {
  const location = useLocation();
  const navItems = navConfig[userRole];
  const prefix = rolePrefix[userRole];

  const getFullPath = (path: string) => `${prefix}${path}`;

  const isActive = (path: string) => {
    const fullPath = getFullPath(path);
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
  };

  return (
    <nav className="mobile-nav safe-area-bottom">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={getFullPath(item.path)}
          className={cn(
            "mobile-nav-item",
            isActive(item.path) && "mobile-nav-item-active"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
