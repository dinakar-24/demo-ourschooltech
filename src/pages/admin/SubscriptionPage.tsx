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
<title>Invoice ${billNo} | Our School Tech</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Serif+Display&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; color: #0a0a0a; background: #fff; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 800px; margin: 0 auto; padding: 0; }

  /* ═══ TOP BAR ═══ */
  .topbar { background: #0a0a0a; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; }
  .topbar-brand { display: flex; align-items: center; gap: 14px; }
  .topbar-brand img { height: 40px; width: auto; filter: brightness(10); }
  .topbar-text { color: #fff; }
  .topbar-name { font-size: 16px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  .topbar-url { font-size: 9px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
  .topbar-right { color: #fff; text-align: right; }
  .topbar-inv { font-family: 'DM Serif Display', serif; font-size: 28px; letter-spacing: 2px; }
  .topbar-inv-sub { font-size: 9px; color: #666; letter-spacing: 1px; margin-top: 4px; }

  .body { padding: 32px 40px 24px; }

  /* ═══ META ROW ═══ */
  .meta-strip { display: flex; background: #f5f5f5; border-radius: 4px; margin-bottom: 28px; overflow: hidden; }
  .meta-cell { flex: 1; padding: 14px 20px; border-right: 1px solid #e5e5e5; }
  .meta-cell:last-child { border-right: none; }
  .mc-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 700; }
  .mc-val { font-size: 14px; font-weight: 800; color: #0a0a0a; margin-top: 4px; }
  .mc-val.paid { color: #0a0a0a; }

  /* ═══ BILLED TO ═══ */
  .billed { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
  .bl-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #bbb; font-weight: 700; margin-bottom: 6px; }
  .bl-name { font-size: 18px; font-weight: 900; color: #0a0a0a; }
  .bl-desc { font-size: 11px; color: #888; margin-top: 3px; }

  /* ═══ TABLE ═══ */
  .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .inv-table thead { background: #0a0a0a; }
  .inv-table thead th { color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; padding: 12px 16px; text-align: left; }
  .inv-table thead th.c { text-align: center; }
  .inv-table thead th.r { text-align: right; }
  .inv-table tbody td { padding: 18px 16px; font-size: 13px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .inv-table tbody td.c { text-align: center; }
  .inv-table tbody td.r { text-align: right; }
  .inv-table .it-name { font-weight: 800; color: #0a0a0a; font-size: 14px; }
  .inv-table .it-sub { font-size: 11px; color: #aaa; margin-top: 3px; }
  .inv-table .it-amt { font-weight: 900; color: #0a0a0a; font-size: 15px; }

  /* ═══ TOTALS ═══ */
  .totals-wrap { display: flex; justify-content: flex-end; padding: 0 0 24px; }
  .totals-box { width: 280px; }
  .tr { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; color: #888; border-bottom: 1px solid #f5f5f5; }
  .tr .trv { font-weight: 700; color: #444; }
  .tr-grand { display: flex; justify-content: space-between; padding: 16px 20px; background: #0a0a0a; color: #fff; margin-top: 8px; border-radius: 4px; }
  .tr-grand .trl { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  .tr-grand .trv { font-size: 20px; font-weight: 900; }

  /* ═══ AMOUNT WORDS ═══ */
  .words { background: #fafafa; padding: 12px 16px; border-left: 3px solid #0a0a0a; margin-bottom: 28px; font-size: 11px; color: #666; }
  .words b { color: #333; }

  /* ═══ INFO GRID ═══ */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #eee; border: 1px solid #eee; border-radius: 4px; overflow: hidden; margin-bottom: 28px; }
  .info-cell { background: #fff; padding: 16px 20px; }
  .ic-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #bbb; font-weight: 700; margin-bottom: 8px; }
  .ic-row { display: flex; font-size: 11px; line-height: 2; }
  .ic-row .ik { color: #aaa; width: 110px; flex-shrink: 0; }
  .ic-row .iv { color: #333; font-weight: 600; }
  .ic-text { font-size: 10px; color: #888; line-height: 1.7; }

  /* ═══ FOOTER ═══ */
  .foot { background: #0a0a0a; padding: 24px 40px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; }
  .foot-left {}
  .foot-left .fl-name { font-size: 13px; font-weight: 800; color: #fff; }
  .foot-left .fl-detail { font-size: 9px; color: #666; margin-top: 4px; line-height: 1.6; }
  .foot-right { text-align: right; }
  .foot-right .fr-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; font-weight: 700; }
  .foot-right .fr-name { font-size: 16px; font-weight: 900; color: #fff; margin-top: 6px; }
  .foot-right .fr-role { font-size: 9px; color: #888; margin-top: 2px; }

  .ref-bar { padding: 8px 40px; background: #f5f5f5; display: flex; justify-content: space-between; font-size: 8px; color: #bbb; font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.3px; }

  @media print { body { padding: 0; } .page { max-width: 100%; } }
</style></head><body>
<div class="page">

  <div class="topbar">
    <div class="topbar-brand">
      <img src="${logoUrl}" alt="OST" />
      <div class="topbar-text">
        <div class="topbar-name">Our School Tech</div>
        <div class="topbar-url">ourschooltech.in</div>
      </div>
    </div>
    <div class="topbar-right">
      <div class="topbar-inv">INVOICE</div>
    </div>
  </div>

  <div class="body">
    <div class="meta-strip">
      <div class="meta-cell">
        <div class="mc-label">Invoice No.</div>
        <div class="mc-val">${billNo}</div>
      </div>
      <div class="meta-cell">
        <div class="mc-label">Date</div>
        <div class="mc-val">${paymentDate}</div>
      </div>
      <div class="meta-cell">
        <div class="mc-label">Payment</div>
        <div class="mc-val paid">✓ PAID</div>
      </div>
      <div class="meta-cell">
        <div class="mc-label">Students</div>
        <div class="mc-val">${studentCount}</div>
      </div>
    </div>

    <div class="billed">
      <div class="bl-label">Billed To</div>
      <div class="bl-name">${schoolName}</div>
      <div class="bl-desc">School ERP Platform — Annual ${paymentType} Subscription</div>
    </div>

    <table class="inv-table">
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th>Service Description</th>
          <th class="c" style="width:60px">Qty</th>
          <th class="r" style="width:100px">Rate (₹)</th>
          <th class="r" style="width:120px">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <div class="it-name">School ERP Platform — Annual ${paymentType}</div>
            <div class="it-sub">Cloud-based school management system · ${studentCount} student${studentCount !== 1 ? 's' : ''}</div>
          </td>
          <td class="c">${studentCount}</td>
          <td class="r">${pricePerStudent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="r it-amt">${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tr"><span>Subtotal</span><span class="trv">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
        <div class="tr"><span>Tax (0%)</span><span class="trv">₹0.00</span></div>
        <div class="tr"><span>Discount</span><span class="trv">₹0.00</span></div>
        <div class="tr-grand">
          <span class="trl">Total</span>
          <span class="trv">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <div class="words">
      <b>Amount in words:</b>&nbsp; INR ${amountWords}
    </div>

    <div class="info-grid">
      <div class="info-cell">
        <div class="ic-label">Company Details</div>
        <div class="ic-row"><span class="ik">Company</span><span class="iv">Our School Tech</span></div>
        <div class="ic-row"><span class="ik">Website</span><span class="iv">ourschooltech.in</span></div>
        <div class="ic-row"><span class="ik">Email</span><span class="iv">support@ourschooltech.in</span></div>
      </div>
      <div class="info-cell">
        <div class="ic-label">Terms & Conditions</div>
        <div class="ic-text">
          1. Subscription fees are non-refundable once activated.<br/>
          2. Service validity as per subscription period.<br/>
          3. This is a computer-generated invoice.<br/>
          4. No physical signature required.
        </div>
      </div>
    </div>
  </div>

  <div class="foot">
    <div class="foot-left">
      <div class="fl-name">Our School Tech</div>
      <div class="fl-detail">ourschooltech.in<br/>support@ourschooltech.in</div>
    </div>
    <div class="foot-right">
      <div class="fr-label">Authorized Signatory</div>
      <div class="fr-name">Dinakar Sai Reddy Lingala</div>
      <div class="fr-role">CEO & Founder</div>
    </div>
  </div>

  ${payment.razorpay_payment_id ? `
  <div class="ref-bar">
    <span>PAYMENT: ${payment.razorpay_payment_id}</span>
    <span>ORDER: ${payment.razorpay_order_id || '—'}</span>
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
