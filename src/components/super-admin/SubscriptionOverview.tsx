import { useAllSubscriptions } from '@/hooks/useSubscription';
import { IndianRupee, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function SubscriptionOverview() {
  const { data: subscriptions, isLoading } = useAllSubscriptions();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const active = subscriptions?.filter((s) => s.status === 'active').length ?? 0;
  const trial = subscriptions?.filter((s) => s.status === 'trial').length ?? 0;
  const expired = subscriptions?.filter((s) => s.status === 'expired').length ?? 0;
  const totalRevenue = subscriptions
    ?.filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.total_amount || 0), 0) ?? 0;

  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const items = [
    {
      label: 'Active',
      value: active,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-success bg-success/10',
    },
    {
      label: 'Trial',
      value: trial,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-warning bg-warning/10',
    },
    {
      label: 'Expired',
      value: expired,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-destructive bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Revenue highlight */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-xs font-medium text-muted-foreground mb-1">Total Active Revenue</p>
        <div className="flex items-center gap-1">
          <IndianRupee className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold text-primary">₹{formatAmount(totalRevenue)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          from {active} active subscription{active !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>
            <span className="text-lg font-bold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
