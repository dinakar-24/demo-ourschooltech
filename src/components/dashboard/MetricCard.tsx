import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel = 'from last month',
  icon,
  trend = 'neutral',
  className 
}: MetricCardProps) {
  return (
    <div className={cn("card-metric", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1",
              trend === 'up' && "stat-change-positive",
              trend === 'down' && "stat-change-negative",
              trend === 'neutral' && "text-muted-foreground text-xs"
            )}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              <span className="text-muted-foreground ml-1">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
