import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useParentData } from '@/hooks/useParentData';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  IndianRupee,
  Download,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function ParentFees() {
  const { user } = useAuth();
  const { childProfile, fees, isLoading } = useParentData();
  
  const childName = childProfile?.full_name || user?.childName || 'Your Child';
  
  // Calculate fee stats
  const feeStats = {
    pending: fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0),
    paid: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0),
    total: fees.reduce((sum, f) => sum + Number(f.amount), 0),
  };

  const paidOnTimePercentage = feeStats.total > 0 
    ? Math.round((feeStats.paid / feeStats.total) * 100) 
    : 0;

  const today = new Date().toISOString().split('T')[0];
  
  const pendingFees = fees.filter(f => f.status !== 'paid');
  const paidFees = fees.filter(f => f.status === 'paid');

  if (isLoading) {
    return (
      <MobileLayout title="Fees" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Fees" showBack>
      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-primary-foreground/70 text-sm">Pending Fees</p>
                <p className="text-3xl font-bold mt-1">₹{feeStats.pending.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard className="w-7 h-7" />
              </div>
            </div>
            {feeStats.pending > 0 && (
              <Button className="w-full bg-white text-primary hover:bg-white/90">
                Pay Now
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <p className="text-xl font-bold text-foreground">
                ₹{feeStats.paid >= 1000 ? `${(feeStats.paid / 1000).toFixed(0)}K` : feeStats.paid}
              </p>
              <p className="text-sm text-muted-foreground">Paid This Year</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground">{paidOnTimePercentage}%</p>
              <p className="text-sm text-muted-foreground">Paid on Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending/Upcoming Fees */}
        {pendingFees.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Pending & Upcoming
            </h3>
            <div className="space-y-2">
              {pendingFees.map((fee) => {
                const isOverdue = fee.due_date < today;
                return (
                  <Card key={fee.id} className={isOverdue ? 'border-warning/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isOverdue ? (
                            <AlertCircle className="w-5 h-5 text-warning" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="font-medium">{fee.fee_type}</span>
                        </div>
                        <Badge variant={isOverdue ? 'default' : 'secondary'}>
                          {isOverdue ? 'overdue' : 'pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-lg font-bold">
                          <IndianRupee className="w-4 h-4" />
                          {Number(fee.amount).toLocaleString()}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Due: {new Date(fee.due_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <Button className="w-full mt-3" size="sm">
                        Pay ₹{Number(fee.amount).toLocaleString()}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment History */}
        {paidFees.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Payment History
            </h3>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {paidFees.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.fee_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.paid_date 
                            ? new Date(payment.paid_date).toLocaleDateString('en-IN')
                            : 'Paid'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">₹{Number(payment.amount).toLocaleString()}</p>
                      <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
                        <Download className="w-3 h-3 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {fees.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No fee records found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
