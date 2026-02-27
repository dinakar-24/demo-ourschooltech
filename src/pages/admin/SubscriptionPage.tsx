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

  const logoUrl = window.location.origin + '/images/ost-logo.png';

  const receiptHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Invoice #${billNo} | Our School Tech</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #111; background: #fff; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 780px; margin: 0 auto; padding: 48px 48px 36px; }

  /* ── Header ── */
  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 28px; border-bottom: 2px solid #111; margin-bottom: 28px; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand img { height: 52px; width: auto; }
  .brand-info {}
  .brand-name { font-size: 20px; font-weight: 900; color: #111; letter-spacing: -0.5px; text-transform: uppercase; }
  .brand-site { font-size: 10px; color: #888; font-weight: 500; letter-spacing: 0.5px; margin-top: 2px; }
  .inv-title { text-align: right; }
  .inv-title h1 { font-size: 36px; font-weight: 900; color: #111; letter-spacing: -1.5px; text-transform: uppercase; }

  /* ── Invoice meta ── */
  .inv-meta { display: flex; justify-content: flex-end; gap: 32px; margin-bottom: 32px; }
  .inv-meta-item {}
  .inv-meta-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 700; }
  .inv-meta-val { font-size: 13px; font-weight: 700; color: #111; margin-top: 3px; }

  /* ── Parties ── */
  .parties { display: grid; grid-template-columns: 1fr auto; gap: 40px; margin-bottom: 36px; padding-bottom: 28px; border-bottom: 1px solid #e5e5e5; }
  .bill-to {}
  .section-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 700; margin-bottom: 8px; }
  .bill-name { font-size: 16px; font-weight: 800; color: #111; }
  .bill-desc { font-size: 11px; color: #777; margin-top: 4px; }
  .status-box { text-align: right; }
  .paid-badge { display: inline-block; border: 2px solid #111; padding: 6px 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #111; }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  thead th { font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #999; font-weight: 700; padding: 0 0 10px; border-bottom: 2px solid #111; text-align: left; }
  thead th:nth-child(1) { width: 36px; }
  thead th:nth-child(3) { width: 60px; text-align: center; }
  thead th:nth-child(4) { width: 90px; text-align: right; }
  thead th:last-child { text-align: right; width: 110px; }
  tbody td { padding: 16px 0; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: top; }
  tbody td:nth-child(1) { color: #bbb; font-weight: 600; }
  tbody td:nth-child(3) { text-align: center; color: #555; }
  tbody td:nth-child(4) { text-align: right; color: #555; }
  tbody td:last-child { text-align: right; font-weight: 800; color: #111; font-size: 14px; }
  .item-name { font-weight: 700; color: #111; }
  .item-sub { font-size: 11px; color: #999; margin-top: 3px; }

  /* ── Totals ── */
  .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-inner { width: 260px; }
  .t-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #777; }
  .t-row .tv { font-weight: 600; color: #333; }
  .t-row-grand { display: flex; justify-content: space-between; padding: 14px 0; margin-top: 8px; border-top: 2px solid #111; border-bottom: 2px solid #111; }
  .t-row-grand .tl { font-size: 13px; font-weight: 800; color: #111; text-transform: uppercase; letter-spacing: 1px; }
  .t-row-grand .tv { font-size: 18px; font-weight: 900; color: #111; }

  /* ── Words ── */
  .words { font-size: 11px; color: #888; margin-bottom: 36px; padding: 12px 0; border-bottom: 1px solid #eee; }
  .words strong { color: #555; font-weight: 600; }

  /* ── Notes ── */
  .notes { margin-bottom: 40px; }
  .notes-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 700; margin-bottom: 6px; }
  .notes p { font-size: 10px; color: #999; line-height: 1.7; }

  /* ── Footer ── */
  .footer { border-top: 2px solid #111; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { }
  .footer-left .fl-brand { font-size: 13px; font-weight: 800; color: #111; }
  .footer-left .fl-url { font-size: 10px; color: #999; margin-top: 2px; }
  .footer-left .fl-email { font-size: 10px; color: #999; margin-top: 1px; }
  .footer-right { text-align: right; }
  .footer-right .fr-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #bbb; font-weight: 700; }
  .footer-right .fr-name { font-size: 15px; font-weight: 800; color: #111; margin-top: 4px; }
  .footer-right .fr-role { font-size: 10px; color: #777; margin-top: 2px; }

  .ref { margin-top: 20px; padding-top: 10px; border-top: 1px dashed #ddd; display: flex; justify-content: space-between; font-size: 8px; color: #ccc; font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.5px; }

  @media print { body { padding: 0; } .page { padding: 32px; } }
</style></head><body>
<div class="page">

  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="Our School Tech" />
      <div class="brand-info">
        <div class="brand-name">Our School Tech</div>
        <div class="brand-site">ourschooltech.in</div>
      </div>
    </div>
    <div class="inv-title">
      <h1>Invoice</h1>
    </div>
  </div>

  <div class="inv-meta">
    <div class="inv-meta-item">
      <div class="inv-meta-label">Invoice No.</div>
      <div class="inv-meta-val">${billNo}</div>
    </div>
    <div class="inv-meta-item">
      <div class="inv-meta-label">Date</div>
      <div class="inv-meta-val">${paymentDate}</div>
    </div>
  </div>

  <div class="parties">
    <div class="bill-to">
      <div class="section-label">Billed To</div>
      <div class="bill-name">${schoolName}</div>
      <div class="bill-desc">School ERP Platform — Annual ${paymentType}</div>
    </div>
    <div class="status-box">
      <div class="section-label">Status</div>
      <div class="paid-badge">Paid</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <div class="item-name">School ERP — Annual ${paymentType}</div>
          <div class="item-sub">Cloud-based school management platform</div>
        </td>
        <td>${studentCount}</td>
        <td>₹${pricePerStudent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-inner">
      <div class="t-row"><span>Subtotal</span><span class="tv">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
      <div class="t-row"><span>Tax</span><span class="tv">₹0.00</span></div>
      <div class="t-row-grand">
        <span class="tl">Total</span>
        <span class="tv">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>

  <div class="words">
    <strong>In words:</strong>&nbsp; INR ${amountWords}
  </div>

  <div class="notes">
    <div class="notes-label">Terms</div>
    <p>Subscription fees are non-refundable once activated. This is a computer-generated invoice and does not require a physical signature.</p>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="fl-brand">Our School Tech</div>
      <div class="fl-url">ourschooltech.in</div>
      <div class="fl-email">support@ourschooltech.in</div>
    </div>
    <div class="footer-right">
      <div class="fr-label">Authorized Signatory</div>
      <div class="fr-name">Dinakar Sai Reddy Lingala</div>
      <div class="fr-role">CEO & Founder, Our School Tech</div>
    </div>
  </div>

  ${payment.razorpay_payment_id ? `
  <div class="ref">
    <span>PAY ${payment.razorpay_payment_id}</span>
    <span>ORD ${payment.razorpay_order_id || '—'}</span>
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
