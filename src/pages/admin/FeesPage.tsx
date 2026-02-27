import { useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useClasses } from '@/hooks/useClasses';
import { useSections } from '@/hooks/useSections';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search, Plus, CreditCard, TrendingUp, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, Receipt, FileText, User,
  Download, Bell, Percent, ShieldCheck, Upload, MoreHorizontal,
} from 'lucide-react';
import { useFeeInvoices, useInvoiceStats, FeeInvoice, FeePayment } from '@/hooks/useFeeInvoices';
import { usePaymentSubmissions } from '@/hooks/usePaymentSubmissions';
import { PaymentVerificationPanel } from '@/components/fees/PaymentVerificationPanel';
import { useFees, FeeRecord } from '@/hooks/useFees';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeeReports } from '@/hooks/useFeeReports';
import { Skeleton } from '@/components/ui/skeleton';
import { RecordPaymentDialog } from '@/components/fees/RecordPaymentDialog';
import { CreateInvoiceDialog } from '@/components/fees/CreateInvoiceDialog';
import { PaymentReceiptDialog } from '@/components/fees/PaymentReceiptDialog';
import { FeeReceiptDialog } from '@/components/fees/FeeReceiptDialog';
import { SendReminderDialog } from '@/components/fees/SendReminderDialog';
import { ApplyDiscountDialog } from '@/components/fees/ApplyDiscountDialog';

interface StudentGroup {
  studentId: string;
  name: string;
  admissionNumber: string;
  className: string;
  section: string;
  invoices: FeeInvoice[];
  legacyFees: FeeRecord[];
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
}

function groupByStudent(invoices: FeeInvoice[], legacyFees: FeeRecord[]): StudentGroup[] {
  const map = new Map<string, StudentGroup>();

  for (const inv of invoices) {
    const sid = inv.student_id;
    if (!map.has(sid)) {
      map.set(sid, {
        studentId: sid,
        name: inv.student?.full_name || 'Unknown',
        admissionNumber: inv.student?.admission_number || '',
        className: inv.student?.class_name || '',
        section: inv.student?.section || '',
        invoices: [],
        legacyFees: [],
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
      });
    }
    const g = map.get(sid)!;
    g.invoices.push(inv);
    g.totalAmount += Number(inv.total_amount);
    g.totalPaid += Number(inv.paid_amount);
    g.totalBalance += Number(inv.balance);
  }

  for (const fee of legacyFees) {
    const sid = fee.student_id;
    if (!map.has(sid)) {
      map.set(sid, {
        studentId: sid,
        name: fee.student?.full_name || 'Unknown',
        admissionNumber: fee.student?.admission_number || '',
        className: fee.student?.class_name || '',
        section: fee.student?.section || '',
        invoices: [],
        legacyFees: [],
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
      });
    }
    const g = map.get(sid)!;
    g.legacyFees.push(fee);
    g.totalAmount += Number(fee.amount);
    if (fee.status === 'paid') {
      g.totalPaid += Number(fee.amount);
    } else {
      g.totalBalance += Number(fee.amount);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function FeesPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showVerifications, setShowVerifications] = useState(false);

  const { data: classes } = useClasses();
  const { data: sections } = useSections(selectedClass !== 'all' ? selectedClass : undefined);

  // Dialogs
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<FeeInvoice | null>(null);
  const [paymentPrefillAmount, setPaymentPrefillAmount] = useState<number | undefined>();
  const [paymentPrefillLabel, setPaymentPrefillLabel] = useState<string | undefined>();
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<FeeInvoice | null>(null);
  const [legacyReceiptOpen, setLegacyReceiptOpen] = useState(false);
  const [legacyReceiptFee, setLegacyReceiptFee] = useState<any>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountInvoice, setDiscountInvoice] = useState<FeeInvoice | null>(null);

  const { generateFeeSummary, generatePendingList, generatePaymentHistory, generateAllInvoices } = useFeeReports();

  const debouncedSearch = useDebounce(searchInput, 400);

  // Fetch all data (no pagination — grouped client-side)
  const { data: invoicesResult, isLoading } = useFeeInvoices({
    status: selectedStatus,
    search: debouncedSearch,
    className: selectedClass,
    page: 1,
    pageSize: 500,
  });
  const invoices = invoicesResult?.data || [];
  const { data: invoiceStats } = useInvoiceStats();

  const { data: legacyResult, isLoading: legacyLoading } = useFees({
    status: selectedStatus,
    search: debouncedSearch,
    className: selectedClass,
    page: 1,
    pageSize: 500,
  });
  const legacyFees = legacyResult?.data || [];

  const stats = invoiceStats;
  const loading = isLoading || legacyLoading;

  const { data: pendingSubmissions = [] } = usePaymentSubmissions('pending');
  const pendingCount = pendingSubmissions.length;

  const studentGroups = useMemo(
    () => groupByStudent(invoices, legacyFees),
    [invoices, legacyFees]
  );

  // Filter by status at group level
  const filteredGroups = useMemo(() => {
    let groups = studentGroups;

    // Filter by section client-side
    if (selectedSection !== 'all') {
      groups = groups.filter(g => g.section === selectedSection);
    }

    if (selectedStatus === 'all') return groups;
    return groups.filter(g => {
      if (selectedStatus === 'paid') return g.totalBalance === 0 && g.totalAmount > 0;
      if (selectedStatus === 'pending') return g.totalBalance > 0;
      if (selectedStatus === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        return g.invoices.some(i => i.status === 'pending' && i.due_date < today) ||
          g.legacyFees.some(f => f.status === 'pending' && f.due_date < today);
      }
      return true;
    });
  }, [studentGroups, selectedStatus, selectedSection]);

  const openPayment = (inv: FeeInvoice, componentAmount?: number, componentLabel?: string) => {
    setPaymentInvoice(inv);
    setPaymentPrefillAmount(componentAmount);
    setPaymentPrefillLabel(componentLabel);
    setPaymentDialogOpen(true);
  };

  const openReceipt = (payment: FeePayment, invoice: FeeInvoice) => {
    setReceiptPayment(payment);
    setReceiptInvoice(invoice);
    setReceiptDialogOpen(true);
  };

  const openLegacyReceipt = (fee: FeeRecord) => {
    setLegacyReceiptFee({ ...fee, student: fee.student });
    setLegacyReceiptOpen(true);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = status === 'pending' && dueDate < today;
    if (status === 'paid') return <Badge className="bg-success text-success-foreground">Paid</Badge>;
    if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
    if (status === 'partial') return <Badge className="bg-warning text-warning-foreground">Partial</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getGroupBadge = (g: StudentGroup) => {
    if (g.totalAmount === 0) return <Badge variant="secondary">No Fees</Badge>;
    if (g.totalBalance === 0) return <Badge className="bg-success text-success-foreground">Paid</Badge>;
    const today = new Date().toISOString().split('T')[0];
    const hasOverdue = g.invoices.some(i => i.status === 'pending' && i.due_date < today) ||
      g.legacyFees.some(f => f.status === 'pending' && f.due_date < today);
    if (hasOverdue) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const fmt = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n.toLocaleString()}`;
  };

  const collectionRate = stats && stats.totalDue > 0 ? ((stats.collected / stats.totalDue) * 100).toFixed(0) : '0';

  const renderExpandedContent = (g: StudentGroup) => (
    <div className="space-y-5">
      {/* Invoices */}
      {g.invoices.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Invoices ({g.invoices.length})
          </h4>
          <div className="space-y-4">
            {g.invoices.map(inv => (
              <div key={inv.id} className="rounded-xl border bg-card p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold">Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}</span>
                    <span className="text-lg sm:text-xl font-bold">₹{Number(inv.total_amount).toLocaleString()}</span>
                    {getStatusBadge(inv.status, inv.due_date)}
                  </div>
                  {inv.status !== 'paid' && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs flex-1 sm:flex-none" onClick={() => { setDiscountInvoice(inv); setDiscountDialogOpen(true); }}>
                        <Percent className="w-3.5 h-3.5 mr-1" /> Discount
                      </Button>
                      <Button size="sm" variant="default" className="h-8 text-xs flex-1 sm:flex-none" onClick={() => openPayment(inv)}>
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay All
                      </Button>
                    </div>
                  )}
                </div>

                {/* Fee Components - Each with its own Pay button */}
                {(inv.components || []).length > 0 && (
                  <div className="space-y-2">
                    {(inv.components || []).map(c => {
                      const componentAmount = Number(c.amount);
                      const canPayComponent = inv.status !== 'paid' && Number(inv.balance) > 0;
                      const payableAmount = Math.min(componentAmount, Number(inv.balance));
                      return (
                        <div key={c.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/40 border border-border/50 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-1.5 sm:w-2 h-7 sm:h-8 rounded-full bg-primary/30 shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-foreground truncate">{c.fee_type}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="text-sm sm:text-base font-bold text-foreground">₹{componentAmount.toLocaleString()}</span>
                            {canPayComponent && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] sm:text-xs px-2 sm:px-3 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                onClick={() => openPayment(inv, payableAmount, c.fee_type)}
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Totals Row */}
                <div className="grid grid-cols-3 gap-1 text-center border-t border-dashed pt-3">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                    <p className="text-sm sm:text-lg font-bold">₹{Number(inv.total_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Paid</p>
                    <p className="text-sm sm:text-lg font-bold text-success">₹{Number(inv.paid_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Balance</p>
                    <p className="text-sm sm:text-lg font-bold text-destructive">₹{Number(inv.balance).toLocaleString()}</p>
                  </div>
                </div>

                {/* Payments */}
                {(inv.payments || []).length > 0 && (
                  <div className="border-t pt-3 space-y-1.5">
                    {(inv.payments || []).map(p => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm bg-muted/20 rounded-lg px-3 py-2 gap-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm sm:text-base">₹{Number(p.amount).toLocaleString()}</span>
                          <span className="text-muted-foreground capitalize text-xs">{p.payment_method}</span>
                          <span className="text-muted-foreground text-xs">{new Date(p.payment_date).toLocaleDateString('en-IN')}</span>
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs justify-start sm:justify-center" onClick={() => openReceipt(p, inv)}>
                          <Receipt className="w-3.5 h-3.5 mr-1" /> {p.receipt_number}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy Fees */}
      {g.legacyFees.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" /> Fee Records ({g.legacyFees.length})
          </h4>
          <div className="space-y-2">
            {g.legacyFees.map(fee => (
              <div key={fee.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-base">{fee.fee_type}</span>
                  <span className="text-muted-foreground text-sm">Due: {new Date(fee.due_date).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base">₹{Number(fee.amount).toLocaleString()}</span>
                  {getStatusBadge(fee.status, fee.due_date)}
                  {fee.status === 'paid' && fee.receipt_number && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openLegacyReceipt(fee)}>
                      <Receipt className="w-3.5 h-3.5 mr-1" /> {fee.receipt_number}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout title="Fees Management">
      <div className="space-y-6 animate-fade-up">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: CheckCircle, value: fmt(stats?.collected || 0), label: 'Collected', color: 'text-success', bg: 'bg-success/10' },
            { icon: AlertCircle, value: fmt(stats?.pending || 0), label: 'Pending', color: 'text-warning', bg: 'bg-warning/10' },
            { icon: AlertCircle, value: fmt(stats?.overdue || 0), label: 'Overdue', color: 'text-destructive', bg: 'bg-destructive/10' },
            { icon: TrendingUp, value: `${collectionRate}%`, label: 'Collection Rate', color: 'text-foreground', bg: 'bg-primary/10' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 md:p-4">
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg mb-1.5 md:mb-2 ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${s.color}`} />
                </div>
                <p className={`text-xl md:text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions + Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Student Fees</h2>
              <Badge variant="secondary" className="text-xs">
                {filteredGroups.length}{filteredGroups.length !== studentGroups.length ? `/${studentGroups.length}` : ''} students
              </Badge>
            </div>
            
            {/* Desktop actions */}
            {!isMobile ? (
              <div className="flex gap-2 flex-wrap">
                {pendingCount > 0 && (
                  <Button
                    variant={showVerifications ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowVerifications(!showVerifications)}
                    className="relative"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Verify
                    <Badge className="ml-1 bg-warning text-warning-foreground text-xs px-1.5 py-0">{pendingCount}</Badge>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setReminderDialogOpen(true)}>
                  <Bell className="w-4 h-4 mr-1" /> Reminders
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={generateFeeSummary}>Fee Summary Report</DropdownMenuItem>
                    <DropdownMenuItem onClick={generatePendingList}>Pending Fees List</DropdownMenuItem>
                    <DropdownMenuItem onClick={generatePaymentHistory}>Payment History</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={generateAllInvoices}>All Invoices (Detailed)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/bulk-upload', { state: { tab: 'fees' } })}>
                  <Upload className="w-4 h-4 mr-1" /> Import
                </Button>
                <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create Invoice
                </Button>
              </div>
            ) : (
              /* Mobile actions: primary + more dropdown */
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => setReminderDialogOpen(true)}>
                      <Bell className="w-4 h-4 mr-2" /> Send Reminders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/bulk-upload', { state: { tab: 'fees' } })}>
                      <Upload className="w-4 h-4 mr-2" /> Import from Excel
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Download className="w-4 h-4 mr-2" /> Export Report
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={generateFeeSummary}>Fee Summary</DropdownMenuItem>
                        <DropdownMenuItem onClick={generatePendingList}>Pending Fees</DropdownMenuItem>
                        <DropdownMenuItem onClick={generatePaymentHistory}>Payment History</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={generateAllInvoices}>All Invoices</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    {pendingCount > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowVerifications(!showVerifications)}>
                          <ShieldCheck className="w-4 h-4 mr-2" /> Verify Payments ({pendingCount})
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search student..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection('all'); }}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {(classes || []).map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClass !== 'all' && (
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {(sections || []).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Payment Verification Panel */}
        {showVerifications && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-warning" />
                Pending Payment Verifications
                <Badge className="bg-warning text-warning-foreground">{pendingCount}</Badge>
              </h3>
              <PaymentVerificationPanel />
            </CardContent>
          </Card>
        )}

        {/* Student-Grouped List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No student fee records found</p>
                <p className="text-sm mt-1">Create invoices to get started</p>
              </div>
            ) : isMobile ? (
              /* ── Mobile: Cards ── */
              <div className="divide-y">
                {filteredGroups.map(g => (
                  <Collapsible key={g.studentId} open={expandedId === g.studentId} onOpenChange={(open) => setExpandedId(open ? g.studentId : null)}>
                    <CollapsibleTrigger className="w-full text-left p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {expandedId === g.studentId ? <ChevronDown className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{g.name}</p>
                            <p className="text-xs text-muted-foreground">{g.admissionNumber} · {g.className}-{g.section}</p>
                          </div>
                        </div>
                        {getGroupBadge(g)}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1.5 pl-6">
                        <span>Total: ₹{g.totalAmount.toLocaleString()}</span>
                        <span>Paid: ₹{g.totalPaid.toLocaleString()}</span>
                        <span className="font-medium text-foreground">Balance: ₹{g.totalBalance.toLocaleString()}</span>
                      </div>
                      {g.totalAmount > 0 && (
                        <div className="pl-6 mt-1.5">
                          <Progress value={Math.round((g.totalPaid / g.totalAmount) * 100)} className="h-1.5" />
                        </div>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      {renderExpandedContent(g)}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              /* ── Desktop: Table ── */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Due</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="w-24">Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map(g => (
                    <Fragment key={g.studentId}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === g.studentId ? null : g.studentId)}>
                        <TableCell>
                          {expandedId === g.studentId ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{g.name}</p>
                            <p className="text-xs text-muted-foreground">{g.admissionNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{g.className}-{g.section}</TableCell>
                        <TableCell className="font-medium">₹{g.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-success">₹{g.totalPaid.toLocaleString()}</TableCell>
                        <TableCell className="text-destructive font-medium">₹{g.totalBalance.toLocaleString()}</TableCell>
                        <TableCell>
                          {g.totalAmount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Progress value={Math.round((g.totalPaid / g.totalAmount) * 100)} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-8">{Math.round((g.totalPaid / g.totalAmount) * 100)}%</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getGroupBadge(g)}</TableCell>
                      </TableRow>
                      {expandedId === g.studentId && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={8} className="p-4">
                            {renderExpandedContent(g)}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateInvoiceDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} />
        <RecordPaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} invoice={paymentInvoice} prefillAmount={paymentPrefillAmount} prefillLabel={paymentPrefillLabel} />
        <PaymentReceiptDialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen} payment={receiptPayment} invoice={receiptInvoice} />
        <FeeReceiptDialog open={legacyReceiptOpen} onOpenChange={setLegacyReceiptOpen} fee={legacyReceiptFee} />
        <SendReminderDialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen} />
        <ApplyDiscountDialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen} invoice={discountInvoice} />
      </div>
    </AdminLayout>
  );
}
