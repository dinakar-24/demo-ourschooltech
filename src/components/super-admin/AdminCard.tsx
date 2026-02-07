import { Badge } from '@/components/ui/badge';
import { Building2, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';

interface School {
  id: string;
  name: string;
  code: string;
}

interface SchoolAdmin {
  id: string;
  email: string;
  full_name: string;
  school_id: string | null;
  avatar_url?: string | null;
  school?: School;
}

interface AdminCardProps {
  admin: SchoolAdmin;
  isDisabled: boolean;
  isSelf: boolean;
  onActionComplete: (action?: string, userId?: string) => void;
}

export function AdminCard({ admin, isDisabled, isSelf, onActionComplete }: AdminCardProps) {
  const initials = admin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="flex items-start gap-3">
      <Avatar className="w-10 h-10 shrink-0 mt-0.5">
        <AvatarImage src={admin.avatar_url ?? undefined} alt={admin.full_name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-medium text-sm truncate">{admin.full_name}</p>
            <Badge
              variant={isDisabled ? 'destructive' : 'secondary'}
              className="text-[10px] h-[18px] px-1.5 shrink-0"
            >
              {isDisabled ? 'Disabled' : 'Active'}
            </Badge>
          </div>
          <UserActionsMenu
            userId={admin.id}
            userName={admin.full_name}
            userEmail={admin.email}
            isDisabled={isDisabled}
            isSelf={isSelf}
            onActionComplete={onActionComplete}
            currentFullName={admin.full_name}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{admin.email}</span>
        </div>

        {admin.school ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{admin.school.name}</span>
            <span className="opacity-60">({admin.school.code})</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not assigned to any school</span>
        )}
      </div>
    </div>
  );
}