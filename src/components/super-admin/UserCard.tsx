import { Badge } from '@/components/ui/badge';
import { Mail, GraduationCap } from 'lucide-react';
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
    linked_students?: string[];
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
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{user.full_name}</p>
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

        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Mail className="w-3 h-3 shrink-0" />
          {user.email}
        </p>

        <div className="flex items-center flex-wrap gap-1">
          {user.roles.length > 0 ? (
            user.roles.map(role => (
              <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-[10px] h-[18px] px-1.5">
                {role.replace('_', ' ')}
              </Badge>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">No role</span>
          )}

          {user.linked_students && user.linked_students.length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-1">
              <GraduationCap className="w-3 h-3" />
              {user.linked_students.join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
