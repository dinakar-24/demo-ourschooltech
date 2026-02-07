import { Badge } from '@/components/ui/badge';
import { Mail, Building2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';

interface UserCardProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    school_name?: string;
    roles: string[];
  };
  isDisabled: boolean;
  isSelf: boolean;
  onActionComplete: (action?: string, userId?: string) => void;
}

const getRoleBadgeVariant = (role: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  switch (role) {
    case 'super_admin': return 'destructive';
    case 'school_admin': return 'default';
    case 'teacher': return 'secondary';
    default: return 'outline';
  }
};

export function UserCard({ user, isDisabled, isSelf, onActionComplete }: UserCardProps) {
  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="flex items-start gap-3 p-4 border rounded-xl bg-card">
      <Avatar className="w-11 h-11 shrink-0">
        <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate">{user.full_name}</p>
          <UserActionsMenu
            userId={user.id}
            userName={user.full_name}
            userEmail={user.email}
            isDisabled={isDisabled}
            isSelf={isSelf}
            onActionComplete={onActionComplete}
            currentFullName={user.full_name}
          />
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {user.roles.length > 0 ? (
            user.roles.map(role => (
              <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-[10px] h-5">
                {role.replace('_', ' ')}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No role</span>
          )}

          {user.school_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
              <Building2 className="w-3 h-3" />
              <span>{user.school_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}