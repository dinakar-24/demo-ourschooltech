import { useNotifications, Notification } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, Check, CheckCheck, BookOpen, ClipboardList, CreditCard, Megaphone, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<string, typeof Bell> = {
  attendance: ClipboardList,
  homework: BookOpen,
  fee: CreditCard,
  announcement: Megaphone,
  result: Award,
  general: Bell,
};

const typeColors: Record<string, string> = {
  attendance: 'text-blue-600 bg-blue-50',
  homework: 'text-purple-600 bg-purple-50',
  fee: 'text-amber-600 bg-amber-50',
  announcement: 'text-teal-600 bg-teal-50',
  result: 'text-green-600 bg-green-50',
  general: 'text-muted-foreground bg-muted',
};

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || typeColors.general;

  return (
    <Card
      className={cn(
        "p-3 flex items-start gap-3 cursor-pointer transition-colors border-0 shadow-none",
        !notification.is_read ? "bg-primary/5" : "bg-transparent"
      )}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.is_read ? "font-semibold" : "font-medium text-muted-foreground")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </Card>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllRead } = useNotifications();
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();

  return (
    <div className="space-y-4">
      {/* Push notification prompt */}
      {isSupported && !isSubscribed && permission !== 'denied' && (
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Enable Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get instant alerts on your phone even when the app is closed</p>
            </div>
            <Button size="sm" onClick={subscribe}>Enable</Button>
          </div>
        </Card>
      )}

      {permission === 'denied' && (
        <Card className="p-4 border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-3">
            <BellOff className="w-5 h-5 text-destructive" />
            <p className="text-xs text-muted-foreground">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        </Card>
      )}

      {/* Header with mark all read */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold">
          Notifications {unreadCount > 0 && <span className="text-sm text-muted-foreground">({unreadCount} new)</span>}
        </h2>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()} className="text-xs gap-1">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );
}
