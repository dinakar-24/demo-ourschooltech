import { cn } from '@/lib/utils';
import { IndianRupee, TrendingUp, AlertCircle } from 'lucide-react';

interface FeeCategory {
  name: string;
  collected: number;
  pending: number;
  overdue: number;
}

const feeData: FeeCategory[] = [
  { name: 'Tuition Fee', collected: 1250000, pending: 350000, overdue: 75000 },
  { name: 'Transport Fee', collected: 450000, pending: 125000, overdue: 25000 },
  { name: 'Lab Fee', collected: 180000, pending: 45000, overdue: 12000 },
];

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${(amount / 1000).toFixed(0)}K`;
}

export function FeesSummary() {
  const totalCollected = feeData.reduce((sum, f) => sum + f.collected, 0);
  const totalPending = feeData.reduce((sum, f) => sum + f.pending, 0);
  const totalOverdue = feeData.reduce((sum, f) => sum + f.overdue, 0);

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Fee Collection</h3>
        <span className="text-xs text-muted-foreground">This Month</span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center p-3 rounded-lg bg-success-muted">
          <p className="text-lg font-bold text-success">{formatCurrency(totalCollected)}</p>
          <p className="text-xs text-success/80">Collected</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-warning-muted">
          <p className="text-lg font-bold text-warning">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-warning/80">Pending</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-destructive-muted">
          <p className="text-lg font-bold text-destructive">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-destructive/80">Overdue</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {feeData.map((fee, index) => {
          const total = fee.collected + fee.pending;
          const percentage = Math.round((fee.collected / total) * 100);
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{fee.name}</span>
                <span className="text-muted-foreground">{percentage}% collected</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                <div 
                  className="bg-success h-full"
                  style={{ width: `${(fee.collected / total) * 100}%` }}
                />
                <div 
                  className="bg-warning h-full"
                  style={{ width: `${((fee.pending - fee.overdue) / total) * 100}%` }}
                />
                <div 
                  className="bg-destructive h-full"
                  style={{ width: `${(fee.overdue / total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-primary hover:bg-primary-muted rounded-lg transition-colors">
        View Detailed Report →
      </button>
    </div>
  );
}
