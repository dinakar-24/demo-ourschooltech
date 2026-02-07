import { School, GraduationCap, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/contexts/AuthContext';

const roleOptions: { role: UserRole; label: string; icon: typeof School; color: string }[] = [
  { role: 'school_admin', label: 'Admin', icon: School, color: 'bg-accent text-accent-foreground' },
  { role: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'bg-info text-info-foreground' },
  { role: 'parent', label: 'Parent', icon: Users, color: 'bg-success text-success-foreground' },
  { role: 'student', label: 'Student', icon: BookOpen, color: 'bg-warning text-warning-foreground' },
];

interface LoginRoleSelectorProps {
  selectedRole: UserRole | null;
  onSelectRole: (role: UserRole) => void;
}

export function LoginRoleSelector({ selectedRole, onSelectRole }: LoginRoleSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-semibold text-primary-foreground/80 tracking-wider uppercase">
        I am
      </p>
      <div className="flex justify-center gap-4">
        {roleOptions.map((option, i) => {
          const Icon = option.icon;
          const isActive = selectedRole === option.role;
          return (
            <button
              key={option.role}
              onClick={() => onSelectRole(option.role)}
              className={cn(
                "flex flex-col items-center gap-2 transition-all duration-300 group",
                "animate-login-role-in"
              )}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                isActive
                  ? `${option.color} border-transparent scale-110 shadow-lg`
                  : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:scale-105"
              )}>
                <Icon className="w-7 h-7" />
              </div>
              <span className={cn(
                "text-xs font-semibold transition-colors",
                isActive ? "text-white" : "text-white/60"
              )}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
