import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  Bell,
  MoreHorizontal,
} from 'lucide-react';

interface MobileNavProps {
  userRole?: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
}

const navConfig = {
  super_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Schools', href: '/schools', icon: Users },
    { label: 'Alerts', href: '/alerts', icon: Bell },
    { label: 'More', href: '/more', icon: MoreHorizontal },
  ],
  school_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/students', icon: Users },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Fees', href: '/fees', icon: CreditCard },
    { label: 'More', href: '/more', icon: MoreHorizontal },
  ],
  teacher: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Homework', href: '/homework', icon: CreditCard },
    { label: 'Alerts', href: '/announcements', icon: Bell },
    { label: 'More', href: '/more', icon: MoreHorizontal },
  ],
  parent: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Fees', href: '/fees', icon: CreditCard },
    { label: 'Alerts', href: '/announcements', icon: Bell },
    { label: 'More', href: '/more', icon: MoreHorizontal },
  ],
  student: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Homework', href: '/homework', icon: CreditCard },
    { label: 'Alerts', href: '/announcements', icon: Bell },
    { label: 'More', href: '/more', icon: MoreHorizontal },
  ],
};

export function MobileNav({ userRole = 'school_admin' }: MobileNavProps) {
  const location = useLocation();
  const navItems = navConfig[userRole];

  return (
    <nav className="mobile-nav safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "mobile-nav-item",
              isActive && "mobile-nav-item-active"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
