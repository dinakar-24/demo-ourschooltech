import { useState, useMemo, Fragment } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Search, Plus, CreditCard, TrendingUp, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, Receipt, CalendarDays, FileText, User,
  IndianRupee,
} from 'lucide-react';
import { useFeeInvoices, useInvoiceStats, useFeeTerms, FeeInvoice, FeePayment } from '@/hooks/useFeeInvoices';
import { useFees, FeeRecord } from '@/hooks/useFees';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { RecordPaymentDialog } from '@/components/fees/RecordPaymentDialog';
import { CreateInvoiceDialog } from '@/components/fees/CreateInvoiceDialog';
import { CreateTermDialog } from '@/components/fees/CreateTermDialog';
import { PaymentReceiptDialog } from '@/components/fees/PaymentReceiptDialog';
import { FeeReceiptDialog } from '@/components/fees/FeeReceiptDialog';

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
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialogs
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<FeeInvoice | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<FeeInvoice | null>(null);
  const [legacyReceiptOpen, setLegacyReceiptOpen] = useState(false);
  const [legacyReceiptFee, setLegacyReceiptFee] = useState<any>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  // Fetch all data (no pagination — grouped client-side)
  const { data: invoicesResult, isLoading } = useFeeInvoices({
    status: selectedStatus,
    search: debouncedSearch,
    termId: selectedTerm,
    page: 1,
    pageSize: 500,
  });
  const invoices = invoicesResult?.data || [];
  const { data: invoiceStats } = useInvoiceStats();
  const { data: terms } = useFeeTerms();

  const { data: legacyResult, isLoading: legacyLoading } = useFees({
    status: selectedStatus,
    search: debouncedSearch,
    page: 1,
    pageSize: 500,
  });
  const legacyFees = legacyResult?.data || [];

  const stats = invoiceStats;
  const loading = isLoading || legacyLoading;

  const studentGroups = useMemo(
    () => groupByStudent(invoices, legacyFees),
    [invoices, legacyFees]
  );

  // Filter by status at group level
  const filteredGroups = useMemo(() => {
    if (selectedStatus === 'all') return studentGroups;
    return studentGroups.filter(g => {
      if (selectedStatus === 'paid') return g.totalBalance === 0 && g.totalAmount > 0;
      if (selectedStatus === 'pending') return g.totalBalance > 0;
      if (selectedStatus === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        return g.invoices.some(i => i.status === 'pending' && i.due_date < today) ||
          g.legacyFees.some(f => f.status === 'pending' && f.due_date < today);
      }
      return true;
    });
  }, [studentGroups, selectedStatus]);

  const openPayment = (inv: FeeInvoice) => {
    setPaymentInvoice(inv);
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

  const getPaymentProgress = (g: StudentGroup) => {
    if (g.totalAmount === 0) return 0;
    return Math.round((g.totalPaid / g.totalAmount) * 100);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  };

  const renderExpandedContent = (g: StudentGroup) => (
    <div className="space-y-4 pt-2">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border">
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Payment Progress</span>
            <span className="font-medium text-foreground">{getPaymentProgress(g)}%</span>
          </div>
          <Progress value={getPaymentProgress(g)} className="h-2" />
        </div>
        <div className="flex gap-4 text-center shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold">₹{g.totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-sm font-bold text-success">₹{g.totalPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-sm font-bold text-destructive">₹{g.totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Invoices */}
      {g.invoices.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Invoices ({g.invoices.length})
          </h4>
          <div className="space-y-2">
            {g.invoices.map(inv => (
              <div key={inv.id} className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{inv.term?.name || 'N/A'}</span>
                      <p className="text-xs text-muted-foreground">Due: {new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(inv.status, inv.due_date)}
                    {inv.status !== 'paid' && (
                      <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => openPayment(inv)}>
                        <IndianRupee className="w-3 h-3 mr-1" /> Pay
                      </Button>
                    )}
                  </div>
                </div>
                {/* Components grid */}
                {(inv.components || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(inv.components || []).map(c => (
                      <div key={c.id} className="flex justify-between text-xs py-1.5 px-2.5 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground">{c.fee_type}</span>
                        <span className="font-semibold">₹{Number(c.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center text-xs border-t pt-2">
                  <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">₹{Number(inv.total_amount).toLocaleString()}</span></span>
                  <span className="text-muted-foreground">Paid: <span className="font-semibold text-success">₹{Number(inv.paid_amount).toLocaleString()}</span></span>
                  <span className="text-muted-foreground">Balance: <span className="font-semibold text-destructive">₹{Number(inv.balance).toLocaleString()}</span></span>
                </div>
                {/* Payments */}
                {(inv.payments || []).length > 0 && (
                  <div className="border-t pt-2 space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Payments</p>
                    {(inv.payments || []).map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs bg-success/5 rounded-lg px-2.5 py-1.5">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-success" />
                          <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span>
                          <span className="text-muted-foreground capitalize">{p.payment_method}</span>
                          <span className="text-muted-foreground">{new Date(p.payment_date + 'T00:00:00').toLocaleDateString('en-IN')}</span>
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs hover:bg-success/10" onClick={() => openReceipt(p, inv)}>
                          <Receipt className="w-3 h-3 mr-1" /> {p.receipt_number}
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
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Fee Records ({g.legacyFees.length})
          </h4>
          <div className="space-y-1.5">
            {g.legacyFees.map(fee => (
              <div key={fee.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-2.5 text-sm shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium">{fee.fee_type}</span>
                    <p className="text-xs text-muted-foreground">Due: {new Date(fee.due_date + 'T00:00:00').toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">₹{Number(fee.amount).toLocaleString()}</span>
                  {getStatusBadge(fee.status, fee.due_date)}
                  {fee.status === 'paid' && fee.receipt_number && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => openLegacyReceipt(fee)}>
                      <Receipt className="w-3 h-3 mr-1" /> {fee.receipt_number}
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
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Student Fees</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setTermDialogOpen(true)}>
                <CalendarDays className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Add</span> Term
              </Button>
              <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Create</span> Invoice
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search student..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {(terms || []).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <p className="text-sm mt-1">Create terms and invoices to get started</p>
              </div>
            ) : isMobile ? (
              /* ── Mobile: Cards ── */
              <div className="divide-y">
                {filteredGroups.map(g => {
                  const progress = getPaymentProgress(g);
                  const isOpen = expandedId === g.studentId;
                  return (
                    <Collapsible key={g.studentId} open={isOpen} onOpenChange={(open) => setExpandedId(open ? g.studentId : null)}>
                      <CollapsibleTrigger className="w-full text-left p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {getInitials(g.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm truncate">{g.name}</p>
                              {getGroupBadge(g)}
                            </div>
                            <p className="text-xs text-muted-foreground">{g.admissionNumber} · {g.className}-{g.section}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground w-8 text-right">{progress}%</span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-muted-foreground">₹{g.totalPaid.toLocaleString()} / ₹{g.totalAmount.toLocaleString()}</span>
                              {g.totalBalance > 0 && (
                                <span className="font-semibold text-destructive">Due: ₹{g.totalBalance.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        {renderExpandedContent(g)}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              /* ── Desktop: Table ── */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Total Due</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map(g => {
                    const progress = getPaymentProgress(g);
                    return (
                      <Fragment key={g.studentId}>
                        <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setExpandedId(expandedId === g.studentId ? null : g.studentId)}>
                          <TableCell>
                            {expandedId === g.studentId ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {getInitials(g.name)}
                              </div>
                              <div>
                                <p className="font-semibold">{g.name}</p>
                                <p className="text-xs text-muted-foreground">{g.admissionNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">{g.className}-{g.section}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={progress} className="h-2 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground w-8">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">₹{g.totalAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-success font-medium">₹{g.totalPaid.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-destructive font-semibold">₹{g.totalBalance.toLocaleString()}</TableCell>
                          <TableCell>{getGroupBadge(g)}</TableCell>
                        </TableRow>
                        {expandedId === g.studentId && (
                          <TableRow className="bg-muted/10 hover:bg-muted/10">
                            <TableCell colSpan={8} className="p-5">
                              {renderExpandedContent(g)}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateTermDialog open={termDialogOpen} onOpenChange={setTermDialogOpen} />
        <CreateInvoiceDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} />
        <RecordPaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} invoice={paymentInvoice} />
        <PaymentReceiptDialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen} payment={receiptPayment} invoice={receiptInvoice} />
        <FeeReceiptDialog open={legacyReceiptOpen} onOpenChange={setLegacyReceiptOpen} fee={legacyReceiptFee} />
      </div>
    </AdminLayout>
  );
}
