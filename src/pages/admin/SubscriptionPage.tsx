import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  Calendar,
  Users,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Loader2,
  Download,
  FileText,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';
import { useSubscription, useSubscriptionPayments, SubscriptionPayment } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useSubscriptionPricing } from '@/hooks/useSubscriptionPricing';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';

function useStudentCount() {
  const schoolId = useEffectiveSchoolId();
  return useQuery({
    queryKey: ['student-count', schoolId],
    queryFn: async () => {
      if (!schoolId) return 0;
      const { count, error } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'active');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!schoolId,
  });
}

function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(num) + ' Rupees Only';
}

function downloadSubscriptionReceipt(
  payment: SubscriptionPayment,
  schoolName: string,
  studentCount: number,
  pricePerStudent: number
) {
  const paymentDate = payment.paid_at
    ? format(new Date(payment.paid_at), 'dd-MMMM-yy')
    : format(new Date(payment.created_at), 'dd-MMMM-yy');
  const receiptId = (payment.razorpay_payment_id || payment.id.slice(0, 8)).toUpperCase();
  const billNo = receiptId.replace('PAY_', '').slice(0, 8);
  const amountWords = numberToIndianWords(payment.amount);
  const paymentType = (payment as any).payment_type === 'topup' ? 'Top-Up' : 'Renewal';

  const receiptHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Invoice #${billNo} — Our School Tech</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; background: #fff; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 800px; margin: 0 auto; padding: 48px; }

  .topbar { background: #0f766e; height: 6px; border-radius: 3px; margin-bottom: 36px; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-logo { width: 44px; height: 44px; background: #0f766e; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 18px; }
  .brand-text {}
  .brand-name { font-size: 18px; font-weight: 800; color: #0f172a; }
  .brand-url { font-size: 10px; color: #64748b; font-weight: 500; margin-top: 2px; }
  .inv-header { text-align: right; }
  .inv-header h1 { font-size: 32px; font-weight: 800; color: #0f766e; letter-spacing: -1px; text-transform: uppercase; }
  .inv-header .inv-meta { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.6; }
  .inv-header .inv-meta strong { color: #334155; }

  .sep { height: 1px; background: #e2e8f0; margin: 0 0 28px; }

  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .party {}
  .party-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 700; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 700; color: #0f172a; }
  .party-detail { font-size: 11px; color: #64748b; line-height: 1.7; margin-top: 4px; }
  .status-pill { display: inline-flex; align-items: center; gap: 5px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 20px; padding: 4px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #059669; }

  .table-wrap { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #f8fafc; font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 700; padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  thead th:nth-child(1) { width: 44px; text-align: center; }
  thead th:nth-child(3) { width: 80px; text-align: center; }
  thead th:nth-child(4) { width: 90px; text-align: right; }
  thead th:last-child { text-align: right; width: 110px; }
  tbody td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  tbody td:nth-child(1) { text-align: center; color: #94a3b8; font-weight: 600; }
  tbody td:nth-child(3) { text-align: center; }
  tbody td:nth-child(4) { text-align: right; }
  tbody td:last-child { text-align: right; font-weight: 700; }
  .item-name { font-weight: 600; color: #0f172a; }
  .item-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  .summary { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .summary-box { width: 260px; }
  .sum-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9; }
  .sum-row .sr-val { font-weight: 600; color: #334155; }
  .sum-total { display: flex; justify-content: space-between; padding: 12px 16px; background: #0f766e; color: #fff; border-radius: 8px; font-weight: 800; font-size: 16px; margin-top: 8px; }

  .words-bar { background: #f8fafc; border-radius: 6px; padding: 10px 16px; font-size: 11px; color: #64748b; margin-bottom: 32px; }
  .words-bar span { color: #0f172a; font-weight: 600; }

  .footer-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .f-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .f-card h5 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; margin-bottom: 8px; }
  .f-card p { font-size: 11px; color: #475569; line-height: 1.7; }

  .bottom-bar { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .bottom-left { font-size: 10px; color: #94a3b8; line-height: 1.6; }
  .bottom-left a { color: #0f766e; text-decoration: none; }
  .bottom-right { text-align: right; font-size: 10px; color: #94a3b8; }
  .bottom-right .auth-for { font-size: 9px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .bottom-right .auth-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .bottom-right .auth-role { font-size: 10px; color: #64748b; margin-top: 2px; }

  .ref-strip { margin-top: 16px; padding: 8px 0; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #cbd5e1; font-family: monospace; }

  @media print { body { padding: 0; } .page { padding: 28px; } }
</style></head><body>
<div class="page">
  <div class="topbar"></div>

  <div class="header">
    <div class="brand">
      <div class="brand-logo">OST</div>
      <div class="brand-text">
        <div class="brand-name">Our School Tech</div>
        <div class="brand-url">ourschooltech.in</div>
      </div>
    </div>
    <div class="inv-header">
      <h1>Invoice</h1>
      <div class="inv-meta">
        <strong>No.</strong> ${billNo}<br/>
        <strong>Date</strong> ${paymentDate}
      </div>
    </div>
  </div>

  <div class="sep"></div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Billed To</div>
      <div class="party-name">${schoolName}</div>
      <div class="party-detail">School ERP Platform Subscription</div>
    </div>
    <div class="party" style="text-align: right;">
      <div class="party-label">Payment Status</div>
      <div class="status-pill"><span class="status-dot"></span> Paid</div>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate (₹)</th>
          <th>Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <div class="item-name">Annual ${paymentType} — School ERP</div>
            <div class="item-sub">Cloud-based management platform subscription</div>
          </td>
          <td>${studentCount}</td>
          <td>${pricePerStudent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td>${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="sum-row"><span>Subtotal</span><span class="sr-val">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
      <div class="sum-row"><span>Discount</span><span class="sr-val">₹0.00</span></div>
      <div class="sum-total"><span>Total</span><span>₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    </div>
  </div>

  <div class="words-bar">
    <span>Amount in words:</span>&nbsp; INR ${amountWords}
  </div>

  <div class="footer-cards">
    <div class="f-card">
      <h5>Contact</h5>
      <p>
        Our School Tech<br/>
        support@ourschooltech.in<br/>
        ourschooltech.in
      </p>
    </div>
    <div class="f-card">
      <h5>Notes</h5>
      <p>
        Subscription fees are non-refundable once activated. This is a system-generated invoice and does not require a physical signature.
      </p>
    </div>
  </div>

  <div class="bottom-bar">
    <div class="bottom-left">
      Our School Tech &nbsp;·&nbsp; <a href="https://ourschooltech.in">ourschooltech.in</a><br/>
      support@ourschooltech.in
    </div>
    <div class="bottom-right">
      <div class="auth-for">Authorized By</div>
      <div class="auth-name">Our School Tech</div>
      <div class="auth-role">Platform Administration</div>
    </div>
  </div>

  ${payment.razorpay_payment_id ? `
  <div class="ref-strip">
    <span>PAY: ${payment.razorpay_payment_id}</span>
    <span>ORD: ${payment.razorpay_order_id || '—'}</span>
  </div>` : ''}
</div>
</body></html>`;

  const blob = new Blob([receiptHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  }
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: payments, isLoading: paymentsLoading } = useSubscriptionPayments();
  const { data: dbStudentCount = 0, isLoading: studentsLoading } = useStudentCount();
  const { initiatePayment, isLoading: paymentLoading, isProcessing } = useRazorpay();
  const { pricePerStudent } = useSubscriptionPricing();
  const paidStudentCount = subscription?.student_count || 0;
  const totalAmount = dbStudentCount * pricePerStudent;

  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';

  const newStudents = isActive ? Math.max(0, dbStudentCount - paidStudentCount) : 0;
  const topUpAmount = newStudents * pricePerStudent;

  const daysRemaining = subscription?.end_date
    ? differenceInDays(new Date(subscription.end_date), new Date())
    : 0;

  const handlePayment = async () => {
    if (totalAmount <= 0) return;
    initiatePayment({
      subscriptionId: subscription?.id,
      amount: totalAmount,
      schoolName: user?.schoolName || 'School',
      userEmail: user?.email,
      userName: user?.name,
      schoolId: user?.schoolId || '',
      studentCount: dbStudentCount,
      paymentType: 'renewal',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
        queryClient.invalidateQueries({ queryKey: ['student-count'] });
      },
    });
  };

  const handleTopUp = async () => {
    if (topUpAmount <= 0) return;
    initiatePayment({
      subscriptionId: subscription?.id,
      amount: topUpAmount,
      schoolName: user?.schoolName || 'School',
      userEmail: user?.email,
      userName: user?.name,
      schoolId: user?.schoolId || '',
      studentCount: dbStudentCount,
      paymentType: 'topup',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
        queryClient.invalidateQueries({ queryKey: ['student-count'] });
      },
    });
  };

  if (subLoading || studentsLoading) {
    return (
      <AdminLayout title="Subscription">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  const statusConfig = isActive
    ? { label: 'Active', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' }
    : isTrial
    ? { label: 'Trial', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' }
    : isExpired
    ? { label: 'Expired', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5', border: 'border-destructive/20' }
    : { label: 'Pending', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' };

  const StatusIcon = statusConfig.icon;

  return (
    <AdminLayout title="Subscription">
      <div className="max-w-2xl mx-auto space-y-4 pb-8">

        {/* Alerts */}
        {isExpired && (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-destructive text-sm">Subscription Expired</p>
              <p className="text-xs text-muted-foreground">Renew now to continue using all features.</p>
            </div>
          </div>
        )}

        {daysRemaining > 0 && daysRemaining <= 30 && !isExpired && (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Expiring in {daysRemaining} days</p>
              <p className="text-xs text-muted-foreground">Renew to avoid service interruption.</p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <Card className="overflow-hidden border shadow-sm">
          <CardContent className="p-0">
            {/* Top Section */}
            <div className="p-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Annual Plan</h2>
                </div>
                <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} text-xs font-semibold px-2.5 py-1`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">₹{totalAmount.toLocaleString('en-IN')}</span>
                <span className="text-sm text-muted-foreground">/year</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {dbStudentCount} student{dbStudentCount !== 1 ? 's' : ''} × ₹{pricePerStudent}/student
              </p>
            </div>

            <Separator />

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="p-4 text-center">
                <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">{dbStudentCount}</p>
                <p className="text-[10px] text-muted-foreground">Students</p>
              </div>
              <div className="p-4 text-center">
                <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-base font-bold text-foreground">
                  {subscription?.end_date ? format(new Date(subscription.end_date), 'dd MMM yy') : '—'}
                </p>
                {daysRemaining > 0 && !isExpired && (
                  <p className="text-[10px] text-primary font-medium">{daysRemaining}d left</p>
                )}
                {(!daysRemaining || isExpired) && <p className="text-[10px] text-muted-foreground">Expiry</p>}
              </div>
              <div className="p-4 text-center">
                <IndianRupee className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">₹{pricePerStudent}</p>
                <p className="text-[10px] text-muted-foreground">Per Student</p>
              </div>
            </div>

            <Separator />

            {/* Action */}
            <div className="p-4">
              <Button
                className="w-full h-11 font-semibold rounded-lg"
                onClick={handlePayment}
                disabled={paymentLoading || isProcessing || totalAmount <= 0}
              >
                {(paymentLoading || isProcessing) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : isActive ? (
                  <><CreditCard className="w-4 h-4 mr-2" /> Renew Subscription</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Subscribe — ₹{totalAmount.toLocaleString('en-IN')}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plan Details */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Plan Details</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Plan', value: subscription?.plan_type || 'Yearly' },
                ...(subscription?.start_date ? [{ label: 'Started', value: format(new Date(subscription.start_date), 'dd MMM yyyy') }] : []),
                ...(subscription?.end_date ? [{ label: 'Expires', value: format(new Date(subscription.end_date), 'dd MMM yyyy') }] : []),
                { label: 'Paid Students', value: String(paidStudentCount) },
                { label: 'Active Students', value: String(dbStudentCount) },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top-Up */}
        {newStudents > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                {newStudents} New Student{newStudents > 1 ? 's' : ''} — Top-Up Required
              </p>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid for</span>
                  <span className="font-medium">{paidStudentCount} students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current active</span>
                  <span className="font-medium">{dbStudentCount} students</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Top-up ({newStudents} × ₹{pricePerStudent})</span>
                  <span className="text-primary">₹{topUpAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <Button
                className="w-full h-10 font-semibold rounded-lg"
                onClick={handleTopUp}
                disabled={paymentLoading || isProcessing}
              >
                {(paymentLoading || isProcessing) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><ArrowUpRight className="w-4 h-4 mr-2" /> Pay ₹{topUpAmount.toLocaleString('en-IN')} Top-Up</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Payment History
            </h3>

            {paymentsLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-1.5">
                {payments.map((payment) => {
                  const isSuccess = payment.status === 'success';
                  const isFailed = payment.status === 'failed';
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isSuccess ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          isFailed ? 'bg-destructive/10' : 'bg-muted'
                        }`}>
                          {isSuccess ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : isFailed ? (
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-sm">₹{payment.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {payment.paid_at
                              ? format(new Date(payment.paid_at), 'dd MMM yyyy, hh:mm a')
                              : format(new Date(payment.created_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            isSuccess
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                              : isFailed
                              ? 'border-destructive/30 bg-destructive/5 text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {isSuccess ? 'Paid' : isFailed ? 'Failed' : 'Pending'}
                        </Badge>
                        {isSuccess && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md"
                            title="Download Invoice"
                            onClick={() => downloadSubscriptionReceipt(
                              payment,
                              user?.schoolName || 'School',
                              payment.student_count || dbStudentCount,
                              pricePerStudent
                            )}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No payments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
