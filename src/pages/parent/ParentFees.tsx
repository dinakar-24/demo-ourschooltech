import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  IndianRupee,
  Download,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const mockFees = {
  pending: 12500,
  paid: 75000,
  upcoming: [
    { id: '1', type: 'Tuition Fee - Q4', amount: 12500, dueDate: '2024-01-31', status: 'pending' },
    { id: '2', type: 'Transport Fee - Feb', amount: 2500, dueDate: '2024-02-05', status: 'upcoming' },
  ],
  history: [
    { id: '3', type: 'Tuition Fee - Q3', amount: 12500, paidDate: '2023-10-15', status: 'paid', receiptNo: 'RCP2023001' },
    { id: '4', type: 'Transport Fee - Jan', amount: 2500, paidDate: '2024-01-05', status: 'paid', receiptNo: 'RCP2024001' },
    { id: '5', type: 'Lab Fee', amount: 3000, paidDate: '2023-07-20', status: 'paid', receiptNo: 'RCP2023002' },
    { id: '6', type: 'Tuition Fee - Q2', amount: 12500, paidDate: '2023-07-10', status: 'paid', receiptNo: 'RCP2023003' },
  ],
};

export default function ParentFees() {
  const { user } = useAuth();
  const childName = user?.childName || 'Your Child';

  return (
    <MobileLayout title="Fees" showBack>
      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-primary-foreground/70 text-sm">Pending Fees</p>
                <p className="text-3xl font-bold mt-1">₹{mockFees.pending.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard className="w-7 h-7" />
              </div>
            </div>
            <Button className="w-full bg-white text-primary hover:bg-white/90">
              Pay Now
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <p className="text-xl font-bold text-foreground">₹{(mockFees.paid / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">Paid This Year</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground">86%</p>
              <p className="text-sm text-muted-foreground">Paid on Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending/Upcoming Fees */}
        {mockFees.upcoming.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Pending & Upcoming
            </h3>
            <div className="space-y-2">
              {mockFees.upcoming.map((fee) => (
                <Card key={fee.id} className={fee.status === 'pending' ? 'border-warning/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {fee.status === 'pending' ? (
                          <AlertCircle className="w-5 h-5 text-warning" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{fee.type}</span>
                      </div>
                      <Badge variant={fee.status === 'pending' ? 'default' : 'secondary'}>
                        {fee.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-lg font-bold">
                        <IndianRupee className="w-4 h-4" />
                        {fee.amount.toLocaleString()}
                      </div>
                      <span className="text-sm text-muted-foreground">Due: {fee.dueDate}</span>
                    </div>
                    {fee.status === 'pending' && (
                      <Button className="w-full mt-3" size="sm">
                        Pay ₹{fee.amount.toLocaleString()}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Payment History
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {mockFees.history.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{payment.type}</p>
                      <p className="text-xs text-muted-foreground">{payment.paidDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₹{payment.amount.toLocaleString()}</p>
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
      </div>
    </MobileLayout>
  );
}
