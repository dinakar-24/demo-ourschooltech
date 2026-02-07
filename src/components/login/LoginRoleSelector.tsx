import { motion } from 'framer-motion';
import { School, GraduationCap, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/contexts/AuthContext';

const roleOptions: { role: UserRole; label: string; icon: typeof School; gradient: string }[] = [
  { role: 'school_admin', label: 'Admin', icon: School, gradient: 'from-[hsl(0,70%,58%)] to-[hsl(15,80%,55%)]' },
  { role: 'teacher', label: 'Teacher', icon: GraduationCap, gradient: 'from-[hsl(200,80%,45%)] to-[hsl(220,70%,50%)]' },
  { role: 'parent', label: 'Parent', icon: Users, gradient: 'from-[hsl(142,72%,40%)] to-[hsl(160,60%,35%)]' },
  { role: 'student', label: 'Student', icon: BookOpen, gradient: 'from-[hsl(38,92%,50%)] to-[hsl(25,85%,50%)]' },
];

interface LoginRoleSelectorProps {
  selectedRole: UserRole | null;
  onSelectRole: (role: UserRole) => void;
}

export function LoginRoleSelector({ selectedRole, onSelectRole }: LoginRoleSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-bold text-white/80 tracking-widest uppercase">
        I am
      </p>
      <div className="flex justify-center gap-3 sm:gap-4">
        {roleOptions.map((option, i) => {
          const Icon = option.icon;
          const isActive = selectedRole === option.role;
          return (
            <motion.button
              key={option.role}
              onClick={() => onSelectRole(option.role)}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', damping: 18 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-[2.5px]",
                  isActive
                    ? `bg-gradient-to-br ${option.gradient} border-white/40 shadow-lg shadow-white/10`
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                )}
                animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className={cn("w-7 h-7", isActive ? "text-white" : "text-white/60")} />
              </motion.div>
              <span className={cn(
                "text-xs font-bold transition-colors",
                isActive ? "text-white" : "text-white/50"
              )}>
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
