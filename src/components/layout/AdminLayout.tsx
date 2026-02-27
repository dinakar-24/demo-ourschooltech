import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useMyAdminPermissions, PATH_TO_MODULE } from '@/hooks/useAdminPermissions';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner';
import { useTranslation } from 'react-i18next';
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
  Search,
  Moon,
  Sun,
  Video,
  Bus,
  MessageCircle,
  Image,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const menuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { 
    label: 'Students', 
    href: '/admin/students', 
    icon: Users,
    children: [
      { label: 'All Students', href: '/admin/students' },
      { label: 'Add Student', href: '/admin/students?action=add' },
      { label: 'Bulk Upload', href: '/admin/students/bulk-upload' },
    ]
  },
  { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { label: 'Classes', href: '/admin/classes', icon: BookOpen },
  { 
    label: 'Attendance', 
    href: '/admin/attendance', 
    icon: ClipboardList,
    children: [
      { label: 'Students', href: '/admin/attendance' },
      { label: 'Holiday Calendar', href: '/admin/holiday-calendar' },
      { label: 'Employees', href: '/admin/employee-attendance' },
    ]
  },
  { label: 'Fees', href: '/admin/fees', icon: CreditCard },
  { label: 'Exams', href: '/admin/exams', icon: FileText },
  { label: 'Online Classes', href: '/admin/online-classes', icon: Video },
  { label: 'Transport', href: '/admin/transport', icon: Bus },
  { label: 'Messages', href: '/admin/messages', icon: MessageCircle },
  { label: 'Academic Years', href: '/admin/academic-years', icon: Calendar },
  { label: 'Timetable', href: '/admin/timetable', icon: Clock },
  { label: 'Announcements', href: '/admin/announcements', icon: Bell },
  { label: 'Gallery', href: '/admin/gallery', icon: Image },
  { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  { label: 'Queries', href: '/admin/queries', icon: HelpCircle },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Subscription', href: '/admin/subscription', icon: CreditCard },
  { label: 'My Profile', href: '/admin/profile', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

// Translation key mapping
const labelToKey: Record<string, string> = {
  'Dashboard': 'sidebar.dashboard', 'Students': 'sidebar.students', 'Teachers': 'sidebar.teachers',
  'Classes': 'sidebar.classes', 'Attendance': 'sidebar.attendance', 'Fees': 'sidebar.fees',
  'Exams': 'sidebar.exams', 'Online Classes': 'sidebar.onlineClasses', 'Transport': 'sidebar.transport',
  'Messages': 'sidebar.messages', 'Academic Years': 'sidebar.academicYears', 'Timetable': 'sidebar.timetable',
  'Announcements': 'sidebar.announcements', 'Bulk Upload': 'sidebar.bulkUpload', 'Gallery': 'sidebar.gallery',
  'Feedback': 'sidebar.feedback', 'Queries': 'sidebar.queries', 'Reports': 'sidebar.reports',
  'Subscription': 'sidebar.subscription', 'Settings': 'sidebar.settings',
  'All Students': 'sidebar.allStudents', 'Add Student': 'sidebar.addStudent',
  'Holiday Calendar': 'sidebar.holidayCalendar', 'Employees': 'sidebar.employees',
  'My Profile': 'sidebar.myProfile',
};

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, school, logout } = useAuth();
  const { impersonatedSchool, isImpersonating } = useImpersonation();
  const { t } = useTranslation();
  const { hasPathAccess } = useMyAdminPermissions();
  const displaySchoolName = isImpersonating ? impersonatedSchool?.name : school?.name;
  const displaySchoolLogo = isImpersonating ? impersonatedSchool?.logo : school?.logo;
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Auto-expand menu items based on current route
  const getInitialExpanded = () => {
    const expanded: string[] = [];
    menuItems.forEach(item => {
      if ('children' in item && item.children) {
        const isChildActive = item.children.some(child => 
          location.pathname === child.href || location.pathname.startsWith(child.href + '/')
        );
        if (isChildActive) expanded.push(item.label);
      }
    });
    return expanded;
  };
  const [expandedItems, setExpandedItems] = useState<string[]>(getInitialExpanded);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');
  const isExactActive = (href: string) => location.pathname === href;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {displaySchoolLogo ? (
              <img src={displaySchoolLogo} alt={displaySchoolName || 'School'} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <School className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">{displaySchoolName}</p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">{isImpersonating ? 'Viewing as Admin' : 'School Admin'}</p>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon-sm" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hidden md:flex"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        <ul className="space-y-1">
          {menuItems.filter(item => {
            // Extract path segment for permission check
            const pathSegment = item.href.replace('/admin', '');
            return hasPathAccess(pathSegment);
          }).map((item) => (
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
                      {!isCollapsed && <span>{t(labelToKey[item.label] || item.label)}</span>}
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
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "block py-2 px-3 rounded-md text-sm transition-colors",
                              isExactActive(child.href)
                                ? "text-sidebar-primary bg-sidebar-accent"
                                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            {t(labelToKey[child.label] || child.label)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "nav-item",
                    isActive(item.href) && "nav-item-active"
                  )}
                  title={isCollapsed ? t(labelToKey[item.label] || item.label) : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>{t(labelToKey[item.label] || item.label)}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 cursor-pointer",
          isCollapsed && "justify-center"
        )}
        onClick={() => { navigate('/admin/profile'); setMobileMenuOpen(false); }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.name || 'User'} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-sidebar-accent-foreground">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.name}</p>
              <button 
                onClick={handleLogout}
                className="text-xs text-sidebar-foreground/70 hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                {t('sidebar.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground h-screen sticky top-0 transition-all duration-300 z-40",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-72 h-full bg-sidebar animate-slide-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile close button */}
            <div className="absolute top-3 right-3 z-10">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Impersonation Banner */}
        <ImpersonationBanner />
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              {title && (
                <h1 className="text-lg md:text-xl font-display font-semibold text-foreground">
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 w-64 bg-muted/50 border-none focus-visible:ring-1"
                />
              </div>
              <Button variant="ghost" size="icon-sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
