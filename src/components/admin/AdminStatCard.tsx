import { ReactNode, useEffect, useState } from 'react';
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

function AnimatedValue({ value }: { value: string }) {
  const [display, setDisplay] = useState('0');
  
  useEffect(() => {
    // Extract numeric part
    const numMatch = value.match(/[\d.]+/);
    if (!numMatch) {
      setDisplay(value);
      return;
    }
    
    const target = parseFloat(numMatch[0]);
    const prefix = value.slice(0, value.indexOf(numMatch[0]));
    const suffix = value.slice(value.indexOf(numMatch[0]) + numMatch[0].length);
    const isDecimal = numMatch[0].includes('.');
    const duration = 600;
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setDisplay(`${prefix}${isDecimal ? current.toFixed(1) : Math.round(current).toLocaleString()}${suffix}`);
      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{display}</>;
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
  const isLoading = value === '...';
  
  return (
    <div className={cn(
      "rounded-xl border border-border/50 p-3 md:p-4",
      "bg-gradient-to-br from-card to-muted/30",
      "shadow-[0_2px_10px_-3px_hsl(var(--primary)/0.08)]",
      "hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.15)] transition-shadow duration-200",
      className
    )}>
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-[11px] md:text-xs font-medium text-muted-foreground">{title}</span>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <p className="text-xl md:text-2xl font-bold text-foreground">
        {isLoading ? '...' : <AnimatedValue value={value} />}
      </p>
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
