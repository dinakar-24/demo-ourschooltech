import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { prefetchForPath } from '@/lib/prefetch-helpers';
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

// Mobile nav items with relative paths and i18n keys
const navConfig = {
  super_admin: [
    { i18nKey: 'nav.home', path: '/dashboard', icon: LayoutDashboard },
    { i18nKey: 'sidebar.schools', path: '/schools', icon: School },
    { i18nKey: 'sidebar.allUsers', path: '/users', icon: Users },
    { i18nKey: 'sidebar.settings', path: '/settings', icon: MoreHorizontal },
  ],
  school_admin: [
    { i18nKey: 'nav.home', path: '/dashboard', icon: LayoutDashboard },
    { i18nKey: 'sidebar.students', path: '/students', icon: Users },
    { i18nKey: 'nav.attendance', path: '/attendance', icon: ClipboardList },
    { i18nKey: 'nav.fees', path: '/fees', icon: CreditCard },
    { i18nKey: 'nav.more', path: '/settings', icon: MoreHorizontal },
  ],
  teacher: [
    { i18nKey: 'nav.home', path: '/dashboard', icon: LayoutDashboard },
    { i18nKey: 'nav.attendance', path: '/attendance', icon: ClipboardList },
    { i18nKey: 'nav.homework', path: '/homework', icon: FileText },
    { i18nKey: 'nav.marks', path: '/marks', icon: BarChart3 },
    { i18nKey: 'nav.more', path: '/announcements', icon: MoreHorizontal },
  ],
  parent: [
    { i18nKey: 'nav.home', path: '/dashboard', icon: LayoutDashboard },
    { i18nKey: 'nav.attendance', path: '/attendance', icon: ClipboardList },
    { i18nKey: 'nav.fees', path: '/fees', icon: CreditCard },
    { i18nKey: 'nav.results', path: '/results', icon: BarChart3 },
    { i18nKey: 'nav.more', path: '/more', icon: MoreHorizontal },
  ],
  student: [
    { i18nKey: 'nav.home', path: '/dashboard', icon: LayoutDashboard },
    { i18nKey: 'nav.attendance', path: '/attendance', icon: ClipboardList },
    { i18nKey: 'nav.homework', path: '/homework', icon: FileText },
    { i18nKey: 'nav.results', path: '/results', icon: BarChart3 },
    { i18nKey: 'nav.more', path: '/announcements', icon: MoreHorizontal },
  ],
};

export function MobileNav({ userRole = 'school_admin' }: MobileNavProps) {
  const location = useLocation();
  const { t } = useTranslation();
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
          <span className="text-xs font-medium">{t(item.i18nKey)}</span>
        </Link>
      ))}
    </nav>
  );
}
