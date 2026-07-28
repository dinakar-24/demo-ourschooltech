import { useState } from 'react';
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
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
  XCircle,
  RefreshCw,
  Plus,
  Pencil,
} from 'lucide-react';
import { useAllSubscriptions, useSubscriptionPayments } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ManageSubscriptionDialog } from '@/components/super-admin/ManageSubscriptionDialog';

type StatusFilter = 'all' | 'active' | 'expired' | 'pending' | 'trial';

export default function SubscriptionsPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const { data: subscriptions, isLoading, refetch } = useAllSubscriptions();

  const filteredSubscriptions = (subscriptions || []).filter(sub => {
    const matchesSearch =
      sub.school?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.school?.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalSchools: subscriptions?.length || 0,
    active: subscriptions?.filter(s => s.status === 'active').length || 0,
    expired: subscriptions?.filter(s => s.status === 'expired').length || 0,
    pending: subscriptions?.filter(s => s.status === 'pending' || s.status === 'trial').length || 0,
    totalRevenue: subscriptions?.reduce((sum, s) => s.status === 'active' ? sum + s.total_amount : sum, 0) || 0,
    totalStudents: subscriptions?.reduce((sum, s) => s.status === 'active' ? sum + s.student_count : sum, 0) || 0,
  };

  const activePercent = stats.totalSchools > 0 ? Math.round((stats.active / stats.totalSchools) * 100) : 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
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

  const filterTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.totalSchools },
    { value: 'active', label: 'Active', count: stats.active },
    { value: 'expired', label: 'Expired', count: stats.expired },
    { value: 'pending', label: 'Pending', count: stats.pending },
  ];

  const DetailsWrapper = isMobile ? DrawerDetailsWrapper : DialogDetailsWrapper;

  return (
    <SuperAdminLayout title="Subscriptions">
      <div className="space-y-6 animate-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="relative overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Schools</p>
                  <p className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : stats.totalSchools}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : stats.active}</p>
                </div>
              </div>
              {!isLoading && stats.totalSchools > 0 && (
                <Progress value={activePercent} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/10">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Expired</p>
                  <p className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-12" /> : formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Students Summary (desktop only) */}
        {!isMobile && !isLoading && stats.totalSchools > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Active Students</p>
                  <p className="text-lg font-bold">{stats.totalStudents.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <IndianRupee className="w-5 h-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Revenue/School</p>
                  <p className="text-lg font-bold">
                    {stats.active > 0 ? formatCurrency(Math.round(stats.totalRevenue / stats.active)) : '₹0'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="text-lg font-bold">₹250/student/yr</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscriptions List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-5 h-5 text-primary" />
                  All Subscriptions
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon-sm" onClick={() => refetch()} title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => { setEditingSubscription(null); setManageDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isMobile ? 'Add' : 'New Subscription'}
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Filter Tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {filterTabs.map(tab => (
                  <Button
                    key={tab.value}
                    variant={statusFilter === tab.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No subscriptions found</p>
                <p className="text-sm mt-1 mb-4">
                  {statusFilter !== 'all'
                    ? `No ${statusFilter} subscriptions. Try changing the filter.`
                    : 'Create a subscription to get started'}
                </p>
                {statusFilter === 'all' && (
                  <Button size="sm" onClick={() => { setEditingSubscription(null); setManageDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Subscription
                  </Button>
                )}
              </div>
            ) : isMobile ? (
              /* Mobile Card Layout */
              <div className="space-y-3">
                {filteredSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{subscription.school?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{subscription.school?.code}</p>
                        </div>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Students:</span>
                          <span className="font-semibold">{subscription.student_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold">{subscription.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {subscription.end_date
                          ? `Valid until ${format(new Date(subscription.end_date), 'MMM d, yyyy')}`
                          : 'No end date set'}
                      </div>
                      <div className="flex gap-2">
                        <DetailsWrapper subscription={subscription}>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1.5" />Details
                          </Button>
                        </DetailsWrapper>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => { setEditingSubscription(subscription); setManageDialogOpen(true); }}
                        >
                          <Pencil className="w-4 h-4 mr-1.5" />Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Desktop Table */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Plan</TableHead>
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
                            <p className="text-xs text-muted-foreground font-mono">{subscription.school?.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">{subscription.plan_type}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {subscription.student_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5 font-medium">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {subscription.total_amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          {subscription.end_date ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {format(new Date(subscription.end_date), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DetailsWrapper subscription={subscription}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-1" />Details
                              </Button>
                            </DetailsWrapper>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingSubscription(subscription); setManageDialogOpen(true); }}
                            >
                              <Pencil className="w-4 h-4 mr-1" />Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manage Subscription Dialog */}
        <ManageSubscriptionDialog
          open={manageDialogOpen}
          onOpenChange={(open) => {
            setManageDialogOpen(open);
            if (!open) {
              setEditingSubscription(null);
              refetch();
            }
          }}
          existingSubscription={editingSubscription}
          existingSchoolIds={(subscriptions || []).map(s => s.school_id)}
        />
      </div>
    </SuperAdminLayout>
  );
}

/* Mobile: Drawer wrapper */
function DrawerDetailsWrapper({ subscription, children }: { subscription: any; children: React.ReactNode }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="px-4 pb-6 max-h-[85dvh]">
        <DrawerHeader className="px-0">
          <DrawerTitle>Subscription Details</DrawerTitle>
        </DrawerHeader>
        <div data-vaul-no-drag className="overflow-y-auto">
          <SubscriptionDetails subscription={subscription} schoolId={subscription.school_id} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* Desktop: Dialog wrapper */
function DialogDetailsWrapper({ subscription, children }: { subscription: any; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Subscription Details</DialogTitle>
        </DialogHeader>
        <SubscriptionDetails subscription={subscription} schoolId={subscription.school_id} />
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionDetails({ subscription, schoolId }: { subscription: any; schoolId: string }) {
  const { data: payments, isLoading } = useSubscriptionPayments(schoolId);

  return (
    <div className="space-y-6">
      {/* Subscription Info */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="School" value={subscription.school?.name} />
        <InfoItem label="Plan Type" value={<span className="capitalize">{subscription.plan_type}</span>} />
        <InfoItem label="Student Count" value={subscription.student_count} />
        <InfoItem label="Price/Student" value={`₹${subscription.price_per_student}`} />
        <InfoItem label="Total Amount" value={<span className="text-lg font-bold">₹{subscription.total_amount.toLocaleString()}</span>} />
        <InfoItem label="Status" value={
          <span className={`capitalize font-semibold ${
            subscription.status === 'active' ? 'text-success' :
            subscription.status === 'expired' ? 'text-destructive' : ''
          }`}>{subscription.status}</span>
        } />
        <InfoItem label="Start Date" value={
          subscription.start_date
            ? format(new Date(subscription.start_date), 'MMM d, yyyy')
            : 'Not started'
        } />
        <InfoItem label="End Date" value={
          subscription.end_date
            ? format(new Date(subscription.end_date), 'MMM d, yyyy')
            : 'Not set'
        } />
      </div>

      {/* Payment History */}
      <div>
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          Payment History
        </h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : payments && payments.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border"
              >
                <div>
                  <p className="font-semibold text-sm">₹{payment.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.paid_at
                      ? format(new Date(payment.paid_at), 'MMM d, yyyy')
                      : format(new Date(payment.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge
                  variant={
                    payment.status === 'success' ? 'default' :
                    payment.status === 'failed' ? 'destructive' : 'secondary'
                  }
                >
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground rounded-xl bg-muted/30 border border-dashed">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No payments recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}
