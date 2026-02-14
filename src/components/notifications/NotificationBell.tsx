import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const rolePrefix = user?.role === 'teacher' ? '/teacher'
    : user?.role === 'parent' ? '/parent'
    : user?.role === 'student' ? '/student'
    : user?.role === 'school_admin' ? '/admin'
    : '/super-admin';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="relative text-primary-foreground hover:bg-primary-foreground/10"
      onClick={() => navigate(`${rolePrefix}/notifications`)}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
