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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  userRole?: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
  schoolName?: string;
  userName?: string;
}

const menuConfig = {
  super_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Schools', href: '/schools', icon: School },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  school_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { 
      label: 'Students', 
      href: '/students', 
      icon: Users,
      children: [
        { label: 'All Students', href: '/students' },
        { label: 'Add Student', href: '/students/add' },
        { label: 'Bulk Upload', href: '/students/bulk-upload' },
      ]
    },
    { label: 'Teachers', href: '/teachers', icon: GraduationCap },
    { label: 'Classes', href: '/classes', icon: BookOpen },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Fees', href: '/fees', icon: CreditCard },
    { label: 'Exams', href: '/exams', icon: FileText },
    { label: 'Timetable', href: '/timetable', icon: Clock },
    { label: 'Announcements', href: '/announcements', icon: Bell },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  teacher: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Classes', href: '/my-classes', icon: BookOpen },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Homework', href: '/homework', icon: FileText },
    { label: 'Exams', href: '/exams', icon: Calendar },
    { label: 'Timetable', href: '/timetable', icon: Clock },
    { label: 'Announcements', href: '/announcements', icon: Bell },
  ],
  parent: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Homework', href: '/homework', icon: FileText },
    { label: 'Fees', href: '/fees', icon: CreditCard },
    { label: 'Results', href: '/results', icon: BarChart3 },
    { label: 'Announcements', href: '/announcements', icon: Bell },
  ],
  student: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/attendance', icon: ClipboardList },
    { label: 'Homework', href: '/homework', icon: FileText },
    { label: 'Timetable', href: '/timetable', icon: Clock },
    { label: 'Results', href: '/results', icon: BarChart3 },
    { label: 'Announcements', href: '/announcements', icon: Bell },
  ],
};

export function Sidebar({ userRole = 'school_admin', schoolName = 'Our School Tech', userName = 'Rajesh Kumar' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  const menuItems = menuConfig[userRole];

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

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
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <School className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">{schoolName}</p>
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
              {'children' in item && item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={cn(
                      "nav-item w-full justify-between",
                      isActive(item.href) && "nav-item-active"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      expandedItems.includes(item.label) 
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {!isCollapsed && expandedItems.includes(item.label) && (
                    <ul className="mt-1 ml-8 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            className={cn(
                              "block py-2 px-3 rounded-md text-sm transition-colors",
                              isActive(child.href)
                                ? "text-sidebar-primary bg-sidebar-accent"
                                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={cn(
                    "nav-item",
                    isActive(item.href) && "nav-item-active"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )}
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
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-sidebar-accent-foreground">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{userName}</p>
              <button className="text-xs text-sidebar-foreground/70 hover:text-destructive flex items-center gap-1 transition-colors">
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
