import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}

export function AdminStatCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  trend,
  trendValue,
  className 
}: AdminStatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border/50 p-4 shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {(subtitle || trendValue) && (
        <div className="flex items-center gap-1 mt-1">
          {trendValue && (
            <span className={cn(
              "text-xs font-medium",
              trend === 'up' ? 'text-emerald-500' : 'text-red-500'
            )}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
