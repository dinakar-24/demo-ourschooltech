import { useState, useEffect, Fragment } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminLayout } from '@/components/layout/AdminLayout';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Plus, CreditCard, TrendingUp, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, Receipt, CalendarDays, FileText,
} from 'lucide-react';
import { useFeeInvoices, useInvoiceStats, useFeeTerms, FeeInvoice, FeePayment } from '@/hooks/useFeeInvoices';
import { useFees, useFeeStats, FeeRecord } from '@/hooks/useFees';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { RecordPaymentDialog } from '@/components/fees/RecordPaymentDialog';
import { CreateInvoiceDialog } from '@/components/fees/CreateInvoiceDialog';
import { CreateTermDialog } from '@/components/fees/CreateTermDialog';
import { PaymentReceiptDialog } from '@/components/fees/PaymentReceiptDialog';
import { FeeReceiptDialog } from '@/components/fees/FeeReceiptDialog';

export default function FeesPage() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('invoices');
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

  const pagination = usePagination(25);
  const legacyPagination = usePagination(25);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => { pagination.resetPage(); legacyPagination.resetPage(); }, [debouncedSearch, selectedStatus, selectedTerm]);

  // Invoice-based fees
  const { data: invoicesResult, isLoading } = useFeeInvoices({
    status: selectedStatus,
    search: debouncedSearch,
    termId: selectedTerm,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });
  const invoices = invoicesResult?.data || [];
  const totalCount = invoicesResult?.totalCount || 0;
  const { data: invoiceStats } = useInvoiceStats();
  const { data: terms } = useFeeTerms();

  // Legacy fees
  const { data: legacyResult, isLoading: legacyLoading } = useFees({
    status: selectedStatus,
    search: debouncedSearch,
    page: legacyPagination.page,
    pageSize: legacyPagination.pageSize,
  });
  const legacyFees = legacyResult?.data || [];
  const legacyTotal = legacyResult?.totalCount || 0;
  const { data: legacyStats } = useFeeStats();

  // Combined stats
  const stats = activeTab === 'invoices' ? invoiceStats : legacyStats;

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
    setLegacyReceiptFee({
      ...fee,
      student: fee.student,
    });
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

  const fmt = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n.toLocaleString()}`;
  };

  const collectionRate = stats && stats.totalDue > 0 ? ((stats.collected / stats.totalDue) * 100).toFixed(0) : '0';

  return (
    <AdminLayout title="Fees Management">
      <div className="space-y-6 animate-fade-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-success">{fmt(stats?.collected || 0)}</p>
              <p className="text-sm text-muted-foreground">Collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold text-warning">{fmt(stats?.pending || 0)}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-bold text-destructive">{fmt(stats?.overdue || 0)}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{collectionRate}%</p>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <TabsList>
                <TabsTrigger value="invoices" className="gap-1.5">
                  <FileText className="w-4 h-4" /> Invoices
                </TabsTrigger>
                <TabsTrigger value="legacy" className="gap-1.5">
                  <CreditCard className="w-4 h-4" /> Fees
                  {legacyTotal > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">{legacyTotal}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search student..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
              </div>
              {activeTab === 'invoices' && (
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    {(terms || []).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  {activeTab === 'invoices' && <SelectItem value="partial">Partial</SelectItem>}
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTab === 'invoices' && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setTermDialogOpen(true)}>
                  <CalendarDays className="w-4 h-4 mr-2" /> Add Term
                </Button>
                <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create Invoice
                </Button>
              </div>
            )}
          </div>

          {/* Invoice Tab */}
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
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
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No fee invoices found</p>
                    <p className="text-sm mt-1">Create terms first, then create invoices for students</p>
                  </div>
                ) : isMobile ? (
                  <div className="divide-y">
                    {invoices.map((inv) => (
                      <Collapsible key={inv.id} open={expandedId === inv.id} onOpenChange={(open) => setExpandedId(open ? inv.id : null)}>
                        <div className="p-4 space-y-2">
                          <CollapsibleTrigger className="w-full text-left">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex items-start gap-2">
                                {expandedId === inv.id ? <ChevronDown className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />}
                                <div>
                                  <p className="font-medium text-sm truncate">{inv.student?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{inv.student?.admission_number} · {inv.student?.class_name}-{inv.student?.section}</p>
                                </div>
                              </div>
                              {getStatusBadge(inv.status, inv.due_date)}
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center justify-between text-sm pl-6">
                            <div>
                              <span className="text-muted-foreground">{inv.term?.name || 'N/A'}</span>
                              <span className="mx-2">·</span>
                              <span className="text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}</span>
                            </div>
                            <span className="font-medium">₹{Number(inv.total_amount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground pl-6">
                            <span>Paid: ₹{Number(inv.paid_amount).toLocaleString()} | Balance: ₹{Number(inv.balance).toLocaleString()}</span>
                            {inv.status !== 'paid' && (
                              <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); openPayment(inv); }}>
                                <CreditCard className="w-3 h-3 mr-1" /> Pay
                              </Button>
                            )}
                          </div>
                          <CollapsibleContent>
                            <div className="mt-3 pl-6 space-y-3">
                              <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Fee Components</p>
                                {(inv.components || []).map(c => (
                                  <div key={c.id} className="flex justify-between text-sm py-0.5">
                                    <span>{c.fee_type}</span>
                                    <span>₹{Number(c.amount).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                              {(inv.payments || []).length > 0 && (
                                <div className="rounded-lg border bg-success/5 p-3">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Payment History</p>
                                  {(inv.payments || []).map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-sm py-1">
                                      <div>
                                        <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span>
                                        <span className="text-muted-foreground ml-2 capitalize text-xs">{p.payment_method}</span>
                                        <span className="text-muted-foreground ml-2 text-xs">{new Date(p.payment_date).toLocaleDateString('en-IN')}</span>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openReceipt(p, inv)}>
                                        <Receipt className="w-3 h-3 mr-1" /> {p.receipt_number}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[120px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <Fragment key={inv.id}>
                          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                            <TableCell>
                              {expandedId === inv.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{inv.student?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{inv.student?.admission_number}</p>
                              </div>
                            </TableCell>
                            <TableCell>{inv.student?.class_name}-{inv.student?.section}</TableCell>
                            <TableCell>{inv.term?.name || 'N/A'}</TableCell>
                            <TableCell className="font-medium">₹{Number(inv.total_amount).toLocaleString()}</TableCell>
                            <TableCell className="text-success">₹{Number(inv.paid_amount).toLocaleString()}</TableCell>
                            <TableCell className="text-destructive font-medium">₹{Number(inv.balance).toLocaleString()}</TableCell>
                            <TableCell>{new Date(inv.due_date).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>{getStatusBadge(inv.status, inv.due_date)}</TableCell>
                            <TableCell>
                              {inv.status !== 'paid' && (
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); openPayment(inv); }}>
                                  <CreditCard className="w-3 h-3 mr-1" /> Pay
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedId === inv.id && (
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={10} className="p-0">
                                <div className="p-4 grid md:grid-cols-2 gap-4">
                                  <div className="rounded-lg border bg-card p-4">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Fee Components</h4>
                                    <div className="space-y-1">
                                      {(inv.components || []).map(c => (
                                        <div key={c.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                                          <span>{c.fee_type}</span>
                                          <span className="font-medium">₹{Number(c.amount).toLocaleString()}</span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between text-sm pt-2 font-semibold">
                                        <span>Total</span>
                                        <span>₹{Number(inv.total_amount).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rounded-lg border bg-card p-4">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Payments ({(inv.payments || []).length})</h4>
                                    {(inv.payments || []).length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No payments recorded yet</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {(inv.payments || []).map(p => (
                                          <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                            <div>
                                              <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span>
                                              <span className="text-muted-foreground ml-2 capitalize text-xs">{p.payment_method}</span>
                                              <div className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString('en-IN')}</div>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openReceipt(p, inv)}>
                                              <Receipt className="w-3 h-3 mr-1" /> {p.receipt_number}
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <PaginationControls
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalCount={totalCount}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legacy Fees Tab */}
          <TabsContent value="legacy" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {legacyLoading ? (
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
                ) : legacyFees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No fee records found</p>
                    <p className="text-sm mt-1">Fee records will appear here</p>
                  </div>
                ) : isMobile ? (
                  <div className="divide-y">
                    {legacyFees.map((fee) => (
                      <div key={fee.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{fee.student?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{fee.student?.admission_number} · {fee.student?.class_name}-{fee.student?.section}</p>
                          </div>
                          {getStatusBadge(fee.status, fee.due_date)}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{fee.fee_type}</span>
                          <span className="font-medium">₹{Number(fee.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Due: {new Date(fee.due_date).toLocaleDateString('en-IN')}</span>
                          {fee.status === 'paid' && fee.receipt_number && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openLegacyReceipt(fee)}>
                              <Receipt className="w-3 h-3 mr-1" /> {fee.receipt_number}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {legacyFees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{fee.student?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{fee.student?.admission_number}</p>
                            </div>
                          </TableCell>
                          <TableCell>{fee.student?.class_name}-{fee.student?.section}</TableCell>
                          <TableCell>{fee.fee_type}</TableCell>
                          <TableCell className="font-medium">₹{Number(fee.amount).toLocaleString()}</TableCell>
                          <TableCell>{new Date(fee.due_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{getStatusBadge(fee.status, fee.due_date)}</TableCell>
                          <TableCell>
                            {fee.status === 'paid' && fee.receipt_number ? (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openLegacyReceipt(fee)}>
                                <Receipt className="w-3 h-3 mr-1" /> {fee.receipt_number}
                              </Button>
                            ) : fee.status === 'paid' ? (
                              <span className="text-xs text-muted-foreground">Paid</span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <PaginationControls
                  page={legacyPagination.page}
                  pageSize={legacyPagination.pageSize}
                  totalCount={legacyTotal}
                  onPageChange={legacyPagination.setPage}
                  onPageSizeChange={legacyPagination.setPageSize}
                  isLoading={legacyLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
