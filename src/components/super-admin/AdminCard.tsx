import { Badge } from '@/components/ui/badge';
import { Building2, Mail } from 'lucide-react';
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
  school?: School;
}

interface AdminCardProps {
  admin: SchoolAdmin;
  isDisabled: boolean;
  isSelf: boolean;
  onActionComplete: (action?: string, userId?: string) => void;
}

export function AdminCard({ admin, isDisabled, isSelf, onActionComplete }: AdminCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-xl bg-card">
      {/* Avatar */}
      <div className="w-11 h-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
        {admin.full_name.split(' ').map(n => n[0]).join('')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate">{admin.full_name}</p>
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

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{admin.email}</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {admin.school ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>{admin.school.name}</span>
              <span className="opacity-60">({admin.school.code})</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Not assigned</span>
          )}

          <Badge variant={isDisabled ? 'destructive' : 'default'} className="text-[10px] h-5">
            {isDisabled ? 'Disabled' : 'Active'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
