import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CreditCard, 
  Building2, 
  TrendingUp, 
  AlertCircle,
  Search,
  Eye,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useAllSubscriptions, useSubscriptionPayments } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubscriptionsPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const { data: subscriptions, isLoading } = useAllSubscriptions();

  const filteredSubscriptions = subscriptions?.filter(sub => 
    sub.school?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.school?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate stats
  const stats = {
    totalSchools: subscriptions?.length || 0,
    activeSubscriptions: subscriptions?.filter(s => s.status === 'active').length || 0,
    expiredSubscriptions: subscriptions?.filter(s => s.status === 'expired').length || 0,
    totalRevenue: subscriptions?.reduce((sum, s) => s.status === 'active' ? sum + s.total_amount : sum, 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'trial':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <SuperAdminLayout title="Subscriptions">
      <div className="space-y-6 animate-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Schools</p>
                  <p className="text-2xl font-bold">{isLoading ? '...' : stats.totalSchools}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{isLoading ? '...' : stats.activeSubscriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold">{isLoading ? '...' : stats.expiredSubscriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{isLoading ? '...' : stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                All Subscriptions
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No subscriptions found</p>
                <p className="text-sm mt-1">Subscriptions will appear here when schools are billed</p>
              </div>
            ) : isMobile ? (
              /* Mobile Card Layout */
              <div className="divide-y">
                {filteredSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{subscription.school?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{subscription.school?.code}</p>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Students: </span>
                        <span className="font-medium">{subscription.student_count}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-muted-foreground">Amount: </span>
                        <IndianRupee className="w-3 h-3" />
                        <span className="font-medium">{subscription.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {subscription.end_date ? `Valid until ${format(new Date(subscription.end_date), 'MMM d, yyyy')}` : 'No end date'}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedSchoolId(subscription.school_id)}>
                          <Eye className="w-4 h-4 mr-1" />Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Subscription Details</DialogTitle></DialogHeader>
                        <SubscriptionDetails subscription={subscription} schoolId={subscription.school_id} />
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscription.school?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{subscription.school?.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1"><Users className="w-4 h-4 text-muted-foreground" />{subscription.student_count}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1"><IndianRupee className="w-4 h-4 text-muted-foreground" />{subscription.total_amount.toLocaleString()}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          {subscription.end_date ? (
                            <div className="flex items-center gap-1 text-sm"><Calendar className="w-4 h-4 text-muted-foreground" />{format(new Date(subscription.end_date), 'MMM d, yyyy')}</div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedSchoolId(subscription.school_id)}>
                                <Eye className="w-4 h-4 mr-1" />Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader><DialogTitle>Subscription Details</DialogTitle></DialogHeader>
                              <SubscriptionDetails subscription={subscription} schoolId={subscription.school_id} />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

function SubscriptionDetails({ subscription, schoolId }: { subscription: any; schoolId: string }) {
  const { data: payments, isLoading } = useSubscriptionPayments(schoolId);

  return (
    <div className="space-y-6">
      {/* Subscription Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">School</p>
          <p className="font-medium">{subscription.school?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Plan Type</p>
          <p className="font-medium capitalize">{subscription.plan_type}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Student Count</p>
          <p className="font-medium">{subscription.student_count}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Price/Student</p>
          <p className="font-medium">₹{subscription.price_per_student}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="font-medium text-lg">₹{subscription.total_amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{subscription.status}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Start Date</p>
          <p className="font-medium">
            {subscription.start_date 
              ? format(new Date(subscription.start_date), 'MMM d, yyyy')
              : 'Not started'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">End Date</p>
          <p className="font-medium">
            {subscription.end_date 
              ? format(new Date(subscription.end_date), 'MMM d, yyyy')
              : 'Not set'}
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h4 className="font-medium mb-3">Payment History</h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : payments && payments.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {payments.map((payment) => (
              <div 
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.paid_at 
                      ? format(new Date(payment.paid_at), 'MMM d, yyyy')
                      : format(new Date(payment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge 
                  variant={payment.status === 'success' ? 'default' : 
                           payment.status === 'failed' ? 'destructive' : 'secondary'}
                >
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No payments recorded yet
          </p>
        )}
      </div>
    </div>
  );
}
