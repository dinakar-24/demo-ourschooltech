import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useParentData } from '@/hooks/useParentData';
import { useParentInvoices, ParentInvoice } from '@/hooks/useParentInvoices';
import { useParentPaymentSubmissions } from '@/hooks/usePaymentSubmissions';
import { PaymentReceiptDialog } from '@/components/fees/PaymentReceiptDialog';
import { SubmitPaymentDialog } from '@/components/fees/SubmitPaymentDialog';
import { FeeInvoice, FeePayment } from '@/hooks/useFeeInvoices';
import {
  CreditCard, CheckCircle, AlertCircle, Clock, IndianRupee, TrendingUp,
  Loader2, Receipt, Building2, Percent, ChevronDown, ChevronRight, Send,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function ParentFees() {
  const { user } = useAuth();
  const { childProfile, fees, isLoading } = useParentData();
  const { data: invoices = [], isLoading: invoicesLoading } = useParentInvoices(childProfile?.id);
  const { data: submissions = [] } = useParentPaymentSubmissions(childProfile?.id);

  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<FeeInvoice | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitInvoice, setSubmitInvoice] = useState<ParentInvoice | null>(null);

  const childName = childProfile?.full_name || user?.childName || 'Your Child';

  // Invoice-based stats
  const invoiceStats = {
    totalAmount: invoices.reduce((s, i) => s + Number(i.total_amount), 0),
    totalPaid: invoices.reduce((s, i) => s + Number(i.paid_amount), 0),
    totalBalance: invoices.reduce((s, i) => s + Number(i.balance), 0),
  };

  // Legacy fees stats
  const legacyStats = {
    pending: fees.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0),
    paid: fees.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0),
  };

  const totalPending = invoiceStats.totalBalance + legacyStats.pending;
  const totalPaid = invoiceStats.totalPaid + legacyStats.paid;
  const grandTotal = invoiceStats.totalAmount + legacyStats.pending + legacyStats.paid;
  const paidPercentage = grandTotal > 0 ? Math.round((totalPaid / grandTotal) * 100) : 0;

  const today = new Date().toISOString().split('T')[0];

  // Helper: get submissions for an invoice
  const getInvoiceSubmissions = (invoiceId: string) =>
    submissions.filter(s => s.invoice_id === invoiceId);

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
      student: childProfile ? {
        id: childProfile.id,
        full_name: childProfile.full_name,
        class_name: childProfile.class_name,
        section: childProfile.section,
        admission_number: childProfile.admission_number,
      } : undefined,
    } as FeeInvoice);
    setReceiptOpen(true);
  };

  const openSubmitPayment = (inv: ParentInvoice) => {
    setSubmitInvoice(inv);
    setSubmitDialogOpen(true);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = status === 'pending' && dueDate < today;
    if (status === 'paid') return <Badge className="bg-success text-success-foreground text-xs">Paid</Badge>;
    if (isOverdue) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    if (status === 'partial') return <Badge className="bg-warning text-warning-foreground text-xs">Partial</Badge>;
    return <Badge variant="secondary" className="text-xs">Pending</Badge>;
  };

  if (isLoading || invoicesLoading) {
    return (
      <MobileLayout title="Fees" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const pendingLegacy = fees.filter(f => f.status !== 'paid');
  const paidLegacy = fees.filter(f => f.status === 'paid');

  return (
    <MobileLayout title="Fees" showBack>
      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-primary-foreground/70 text-sm">Pending Fees</p>
                <p className="text-3xl font-bold mt-1">₹{totalPending.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard className="w-7 h-7" />
              </div>
            </div>
            {grandTotal > 0 && (
              <div className="space-y-1.5">
                <Progress value={paidPercentage} className="h-2 bg-white/20" />
                <p className="text-xs text-primary-foreground/70">{paidPercentage}% paid · ₹{totalPaid.toLocaleString()} of ₹{grandTotal.toLocaleString()}</p>
              </div>
            )}
            {totalPending > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/10 text-sm mt-3">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>Pay via UPI and submit proof, or visit school office</span>
              </div>
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
                ₹{totalPaid >= 1000 ? `${(totalPaid / 1000).toFixed(0)}K` : totalPaid}
              </p>
              <p className="text-sm text-muted-foreground">Paid This Year</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground">{paidPercentage}%</p>
              <p className="text-sm text-muted-foreground">Payment Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice-Based Fees */}
        {invoices.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Term Invoices
            </h3>
            <div className="space-y-2">
              {invoices.map((inv) => {
                const isOverdue = inv.status === 'pending' && inv.due_date < today;
                const payPct = Number(inv.total_amount) > 0
                  ? Math.round((Number(inv.paid_amount) / Number(inv.total_amount)) * 100)
                  : 0;
                const invSubmissions = getInvoiceSubmissions(inv.id);
                const hasPending = invSubmissions.some(s => s.status === 'pending');
                const rejectedSubmissions = invSubmissions.filter(s => s.status === 'rejected');
                const canSubmit = inv.status !== 'paid' && Number(inv.balance) > 0 && !hasPending;

                return (
                  <Collapsible
                    key={inv.id}
                    open={expandedInvoice === inv.id}
                    onOpenChange={(open) => setExpandedInvoice(open ? inv.id : null)}
                  >
                    <Card className={isOverdue ? 'border-warning/50' : ''}>
                      <CollapsibleTrigger className="w-full text-left">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {expandedInvoice === inv.id
                                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                              <span className="font-medium">{inv.term?.name || 'Term'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {hasPending && (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                                  <Clock className="w-3 h-3 mr-0.5" /> Verifying
                                </Badge>
                              )}
                              {getStatusBadge(inv.status, inv.due_date)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}
                            </span>
                            <span className="font-bold">₹{Number(inv.total_amount).toLocaleString()}</span>
                          </div>
                          {Number(inv.total_amount) > 0 && (
                            <div className="mt-2 space-y-1">
                              <Progress value={payPct} className="h-1.5" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Paid: ₹{Number(inv.paid_amount).toLocaleString()}</span>
                                <span>Balance: ₹{Number(inv.balance).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 px-4 pb-4 space-y-3">
                          {/* Submit Payment Button */}
                          {canSubmit && (
                            <Button
                              className="w-full"
                              onClick={(e) => { e.stopPropagation(); openSubmitPayment(inv); }}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Submit Payment Proof (₹{Number(inv.balance).toLocaleString()} due)
                            </Button>
                          )}

                          {/* Pending verification notice */}
                          {hasPending && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>Payment proof submitted — awaiting admin verification</span>
                            </div>
                          )}

                          {/* Rejected submissions */}
                          {rejectedSubmissions.map(rs => (
                            <div key={rs.id} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 text-destructive text-sm">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">Payment rejected</p>
                                <p className="text-xs mt-0.5">{rs.rejection_reason || 'No reason provided'}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  ₹{Number(rs.amount).toLocaleString()} · UTR: {rs.transaction_id}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Components */}
                          {(inv.components || []).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Fee Breakdown</p>
                              <div className="space-y-1">
                                {(inv.components || []).map(c => (
                                  <div key={c.id} className="flex justify-between text-sm py-1 px-2 bg-muted/40 rounded">
                                    <span>{c.fee_type}</span>
                                    <span className="font-medium">₹{Number(c.amount).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Discounts */}
                          {(inv.discounts || []).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Percent className="w-3 h-3" /> Discounts Applied
                              </p>
                              <div className="space-y-1">
                                {(inv.discounts || []).map(d => (
                                  <div key={d.id} className="flex justify-between text-sm py-1 px-2 bg-success/5 rounded text-success">
                                    <span>{d.reason}</span>
                                    <span className="font-medium">-₹{Number(d.discount_amount).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Payments */}
                          {(inv.payments || []).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Payment History</p>
                              <div className="space-y-1.5">
                                {(inv.payments || []).map(p => (
                                  <div key={p.id} className="flex items-center justify-between text-sm bg-muted/30 rounded p-2">
                                    <div>
                                      <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span>
                                      <span className="text-muted-foreground ml-2 capitalize text-xs">{p.payment_method}</span>
                                      <span className="text-muted-foreground ml-2 text-xs">
                                        {new Date(p.payment_date).toLocaleDateString('en-IN')}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={(e) => { e.stopPropagation(); openReceipt(p, inv); }}
                                    >
                                      <Receipt className="w-3 h-3 mr-1" /> {p.receipt_number}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}

        {/* Legacy Pending Fees */}
        {pendingLegacy.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Pending & Upcoming
            </h3>
            <div className="space-y-2">
              {pendingLegacy.map((fee) => {
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
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Pay at school office · Cash / UPI / Bank Transfer / Cheque
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Legacy Payment History */}
        {paidLegacy.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Payment History
            </h3>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {paidLegacy.map((payment) => (
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
                      {(payment as any).receipt_number && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Receipt className="w-3 h-3" />
                          {(payment as any).receipt_number}
                        </p>
                      )}
                      {(payment as any).payment_method && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {(payment as any).payment_method}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {invoices.length === 0 && fees.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No fee records found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Receipt Dialog */}
      <PaymentReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        payment={receiptPayment}
        invoice={receiptInvoice}
      />

      {/* Submit Payment Dialog */}
      {submitInvoice && (
        <SubmitPaymentDialog
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
          invoiceId={submitInvoice.id}
          studentId={submitInvoice.student_id}
          schoolId={user?.schoolId || ''}
          maxAmount={Number(submitInvoice.balance)}
          termName={submitInvoice.term?.name}
        />
      )}
    </MobileLayout>
  );
}
