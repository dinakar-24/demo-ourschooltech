import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useParentInvoices, ParentInvoice } from '@/hooks/useParentInvoices';
import { PaymentReceiptDialog } from '@/components/fees/PaymentReceiptDialog';
import { FeeInvoice, FeePayment } from '@/hooks/useFeeInvoices';
import {
  CreditCard, CheckCircle, AlertCircle, Clock, TrendingUp,
  Loader2, Percent, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function StudentFees() {
  const { data: studentProfile, isLoading: profileLoading } = useStudentProfile();
  const { data: invoices = [], isLoading: invoicesLoading } = useParentInvoices(studentProfile?.id);

  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<FeeInvoice | null>(null);

  const isLoading = profileLoading || invoicesLoading;

  const stats = {
    totalAmount: invoices.reduce((s, i) => s + Number(i.total_amount), 0),
    totalPaid: invoices.reduce((s, i) => s + Number(i.paid_amount), 0),
    totalBalance: invoices.reduce((s, i) => s + Number(i.balance), 0),
  };
  const paidPercentage = stats.totalAmount > 0 ? Math.round((stats.totalPaid / stats.totalAmount) * 100) : 0;
  const today = new Date().toISOString().split('T')[0];

  const openReceipt = (payment: ParentInvoice['payments'][0], invoice: ParentInvoice) => {
    setReceiptPayment({
      ...payment,
      invoice_id: invoice.id,
      student_id: invoice.student_id,
      school_id: '',
      cheque_number: null,
      cheque_date: null,
      bank_name: null,
      received_by: null,
    } as FeePayment);
    setReceiptInvoice({
      ...invoice,
      school_id: '',
      created_at: '',
      student: studentProfile ? {
        id: studentProfile.id,
        full_name: studentProfile.full_name,
        class_name: studentProfile.class_name,
        section: studentProfile.section,
        admission_number: studentProfile.admission_number,
      } : undefined,
    } as FeeInvoice);
    setReceiptOpen(true);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = status === 'pending' && dueDate < today;
    if (status === 'paid') return <Badge className="bg-success text-success-foreground text-xs">Paid</Badge>;
    if (isOverdue) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    if (status === 'partial') return <Badge className="bg-warning text-warning-foreground text-xs">Partial</Badge>;
    return <Badge variant="secondary" className="text-xs">Pending</Badge>;
  };

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
      <div className="p-4 space-y-3">
        {/* Summary Card */}
        <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary-foreground/70">Pending Fees</p>
              <p className="text-2xl font-extrabold tracking-tight mt-0.5">₹{stats.totalBalance.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          {stats.totalAmount > 0 && (
            <div className="mt-2.5 space-y-1">
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white/70 transition-all" style={{ width: `${paidPercentage}%` }} />
              </div>
              <p className="text-[11px] text-primary-foreground/70">
                {paidPercentage}% paid · ₹{stats.totalPaid.toLocaleString('en-IN')} of ₹{stats.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <p className="text-lg font-bold text-foreground">
              ₹{stats.totalPaid >= 100000 ? `${(stats.totalPaid / 100000).toFixed(1)}L` : stats.totalPaid >= 1000 ? `${(stats.totalPaid / 1000).toFixed(0)}K` : stats.totalPaid.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground">Paid This Year</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">{paidPercentage}%</p>
            <p className="text-xs text-muted-foreground">Payment Progress</p>
          </div>
        </div>

        {/* Fee Invoices */}
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <CreditCard className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No fee invoices found</p>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fee Invoices</h3>
            <div className="space-y-3">
              {invoices.map((inv) => {
                const payPct = Number(inv.total_amount) > 0 ? Math.round((Number(inv.paid_amount) / Number(inv.total_amount)) * 100) : 0;
                const isOverdue = inv.status === 'pending' && inv.due_date < today;

                return (
                  <Collapsible key={inv.id} open={expandedInvoice === inv.id} onOpenChange={(open) => setExpandedInvoice(open ? inv.id : null)}>
                    <div className={`rounded-xl border bg-card overflow-hidden ${isOverdue ? 'border-warning/60' : 'border-border/60'}`}>
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {expandedInvoice === inv.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                              <span className="text-sm font-medium text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            {getStatusBadge(inv.status, inv.due_date)}
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">{(inv.components || []).length} item{(inv.components || []).length !== 1 ? 's' : ''}</span>
                            <span className="text-2xl font-bold text-foreground">₹{Number(inv.total_amount).toLocaleString('en-IN')}</span>
                          </div>
                          {Number(inv.total_amount) > 0 && (
                            <div className="mt-3 space-y-1.5">
                              <Progress value={payPct} className="h-1.5" />
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>Paid: ₹{Number(inv.paid_amount).toLocaleString('en-IN')}</span>
                                <span>Balance: ₹{Number(inv.balance).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                          {/* Components */}
                          {(inv.components || []).length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fee Breakdown</p>
                              <div className="space-y-1.5">
                                {(inv.components || []).map(c => (
                                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-1 h-6 rounded-full bg-primary/40" />
                                      <span className="text-sm font-medium text-foreground">{c.fee_type}</span>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">₹{Number(c.amount).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Discounts */}
                          {(inv.discounts || []).length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Percent className="w-3 h-3" /> Discounts Applied
                              </p>
                              <div className="space-y-1">
                                {(inv.discounts || []).map(d => (
                                  <div key={d.id} className="flex justify-between text-sm py-1.5 px-3 bg-success/5 rounded-lg text-success">
                                    <span>{d.reason}</span>
                                    <span className="font-medium">-₹{Number(d.discount_amount).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Payments */}
                          {(inv.payments || []).length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment History</p>
                              <div className="space-y-2">
                                {(inv.payments || []).map(p => (
                                  <div key={p.id} className="bg-muted/30 rounded-lg p-3 space-y-1.5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openReceipt(p, inv)}>
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-sm text-foreground">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                                      <span className="text-[11px] text-muted-foreground">{new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground capitalize">{p.payment_method}</span>
                                      <span className="text-xs text-primary">{p.receipt_number}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PaymentReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} payment={receiptPayment} invoice={receiptInvoice} />
    </MobileLayout>
  );
}
