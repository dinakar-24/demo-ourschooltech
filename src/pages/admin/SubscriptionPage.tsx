import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Users,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Download,
  FileText,
  Shield,
  CreditCard,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useSubscription, useSubscriptionPayments, SubscriptionPayment } from '@/hooks/useSubscription';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

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

async function getLogoBase64(): Promise<string> {
  try {
    const response = await fetch('/images/ost-logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

async function downloadSubscriptionReceipt(
  payment: SubscriptionPayment,
  schoolName: string,
  studentCount: number,
  pricePerStudent: number
) {
  const paymentDate = payment.paid_at
    ? format(new Date(payment.paid_at), 'dd MMMM yyyy')
    : format(new Date(payment.created_at), 'dd MMMM yyyy');
  const billingStart = payment.paid_at
    ? format(new Date(payment.paid_at), 'dd MMM yyyy')
    : format(new Date(payment.created_at), 'dd MMM yyyy');
  const billingEndDate = payment.paid_at
    ? new Date(new Date(payment.paid_at).setFullYear(new Date(payment.paid_at).getFullYear() + 1))
    : new Date(new Date(payment.created_at).setFullYear(new Date(payment.created_at).getFullYear() + 1));
  const billingEnd = format(billingEndDate, 'dd MMM yyyy');
  const receiptId = (payment.razorpay_payment_id || payment.id.slice(0, 8)).toUpperCase();
  const billNo = 'INV-' + receiptId.replace('PAY_', '').slice(0, 8);
  const amountWords = numberToIndianWords(payment.amount);
  const paymentType = (payment as any).payment_type === 'topup' ? 'Top-Up' : 'Renewal';
  const subtotal = payment.amount;
  const gst = 0;
  const total = subtotal + gst;

  const logoBase64 = await getLogoBase64();

  const receiptHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Invoice ${billNo} — Our School Tech</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',system-ui,sans-serif;color:#111827;background:#fff;font-size:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;line-height:1.5;}
  .page{max-width:760px;margin:20px auto;background:#fff;}
  .hdr{padding:30px 40px 22px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e5e7eb;}
  .hdr-left{display:flex;align-items:center;gap:14px;}
  .hdr-left img{height:46px;width:auto;}
  .hdr-co{font-size:17px;font-weight:700;color:#111827;}
  .hdr-url{font-size:12px;color:#6B7280;margin-top:2px;font-weight:500;}
  .hdr-right{text-align:right;}
  .hdr-title{font-size:26px;font-weight:700;color:#0F766E;letter-spacing:-0.3px;}
  .hdr-id{font-size:13px;color:#4B5563;margin-top:3px;font-weight:600;}
  .body{padding:30px 40px;}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:18px 0;margin-bottom:30px;}
  .meta-c{padding:0 22px;border-right:1px solid #E5E7EB;}
  .meta-c:last-child{border-right:none;}
  .meta-c .lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;font-weight:600;}
  .meta-c .val{font-size:14px;font-weight:600;color:#111827;margin-top:5px;}
  .badge-paid{display:inline-flex;align-items:center;gap:4px;background:#D1FAE5;color:#047857;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;}
  .billing-row{display:flex;justify-content:space-between;margin-bottom:28px;}
  .bill-block{}
  .bill-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;font-weight:600;margin-bottom:6px;}
  .bill-name{font-size:18px;font-weight:700;color:#111827;}
  .bill-desc{font-size:13px;color:#4B5563;margin-top:4px;font-weight:500;}
  .divider{height:1px;background:#E5E7EB;margin:0 0 28px;}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;}
  thead th{font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#4B5563;font-weight:700;padding:12px 14px;text-align:left;border-bottom:2px solid #E5E7EB;background:#F9FAFB;}
  thead th.cen{text-align:center;}
  thead th.rt{text-align:right;}
  tbody td{padding:16px 14px;font-size:14px;color:#1F2937;border-bottom:1px solid #F3F4F6;vertical-align:top;}
  tbody td.cen{text-align:center;color:#4B5563;}
  tbody td.rt{text-align:right;color:#1F2937;}
  .svc-name{font-weight:600;color:#111827;font-size:14px;}
  .svc-sub{font-size:12px;color:#6B7280;margin-top:3px;font-weight:400;}
  .totals{display:flex;justify-content:flex-end;margin-bottom:24px;}
  .totals-box{width:280px;}
  .trow{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#6B7280;}
  .trow .tv{color:#1F2937;font-weight:600;}
  .trow-total{display:flex;justify-content:space-between;padding:12px 0;font-size:15px;font-weight:700;color:#111827;border-top:2px solid #0F766E;margin-top:6px;}
  .trow-total .tv{color:#0F766E;font-size:18px;font-weight:700;}
  .words{padding:12px 16px;background:#F9FAFB;border-radius:6px;border:1px solid #E5E7EB;font-size:13px;color:#4B5563;margin-bottom:28px;}
  .words strong{color:#111827;font-weight:700;}
  .pay-method{margin-bottom:28px;}
  .pay-method .lbl{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;font-weight:600;margin-bottom:5px;}
  .pay-method .val{font-size:14px;color:#1F2937;font-weight:600;}
  .info{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:0;padding-top:24px;border-top:1px solid #E5E7EB;}
  .info-cell{}
  .info-cell .sec-lbl{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;font-weight:600;margin-bottom:10px;}
  .info-cell .row{font-size:13px;line-height:2.2;display:flex;}
  .info-cell .row .k{color:#6B7280;width:85px;flex-shrink:0;font-weight:500;}
  .info-cell .row .v{color:#1F2937;font-weight:600;}
  .info-cell .terms{font-size:11px;color:#6B7280;line-height:1.8;}
  .ftr{padding:20px 40px;border-top:2px solid #E5E7EB;display:flex;justify-content:space-between;align-items:flex-end;background:#F9FAFB;}
  .ftr-l .fn{font-size:13px;font-weight:700;color:#1F2937;}
  .ftr-l .fd{font-size:11px;color:#6B7280;line-height:1.7;margin-top:3px;font-weight:500;}
  .ftr-r{text-align:right;}
  .ftr-r .fl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;font-weight:600;}
  .ftr-r .fsig{font-size:14px;font-weight:700;color:#111827;margin-top:5px;}
  .ftr-r .frole{font-size:11px;color:#4B5563;margin-top:2px;font-weight:500;}
  .ref{padding:10px 40px;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF;font-family:'SF Mono','Fira Code',monospace;letter-spacing:0.3px;border-top:1px solid #E5E7EB;}
  @media print{body{margin:0;}.page{margin:0;max-width:100%;}}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div class="hdr-left">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo"/>` : ''}
      <div>
        <div class="hdr-co">Our School Tech</div>
        <div class="hdr-url">ourschooltech.com</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="hdr-title">Invoice</div>
      <div class="hdr-id">${billNo}</div>
    </div>
  </div>
  <div class="body">
    <div class="meta">
      <div class="meta-c">
        <div class="lbl">Invoice Date</div>
        <div class="val">${paymentDate}</div>
      </div>
      <div class="meta-c">
        <div class="lbl">Billing Period</div>
        <div class="val">${billingStart} — ${billingEnd}</div>
      </div>
      <div class="meta-c">
        <div class="lbl">Status</div>
        <div class="val"><span class="badge-paid">✓ Paid</span></div>
      </div>
      <div class="meta-c">
        <div class="lbl">Students</div>
        <div class="val">${studentCount}</div>
      </div>
    </div>
    <div class="billing-row">
      <div class="bill-block">
        <div class="bill-label">Billed To</div>
        <div class="bill-name">${schoolName}</div>
        <div class="bill-desc">Annual ${paymentType} — School ERP Platform</div>
      </div>
      <div class="bill-block" style="text-align:right;">
        <div class="bill-label">From</div>
        <div class="bill-name" style="font-size:14px;">Our School Tech</div>
        <div class="bill-desc">support@ourschooltech.com</div>
      </div>
    </div>
    <div class="divider"></div>
    <table>
      <thead><tr>
        <th style="width:32px">#</th>
        <th>Description</th>
        <th class="cen" style="width:55px">Qty</th>
        <th class="rt" style="width:95px">Rate</th>
        <th class="rt" style="width:110px">Amount</th>
      </tr></thead>
      <tbody><tr>
        <td style="color:#6B7280;">1</td>
        <td>
          <div class="svc-name">School ERP Platform — Annual ${paymentType}</div>
          <div class="svc-sub">Cloud-based school management · ${studentCount} student${studentCount !== 1 ? 's' : ''}</div>
        </td>
        <td class="cen">${studentCount}</td>
        <td class="rt">₹${pricePerStudent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="rt" style="font-weight:700;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr></tbody>
    </table>
    <div class="totals">
      <div class="totals-box">
        <div class="trow"><span>Subtotal</span><span class="tv">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
        <div class="trow"><span>GST (0%)</span><span class="tv">₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
        <div class="trow-total"><span>Total</span><span class="tv">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
      </div>
    </div>
    <div class="words">
      <strong>Amount in words:</strong> INR ${amountWords}
    </div>
    <div class="pay-method">
      <div class="lbl">Payment Method</div>
      <div class="val">${payment.razorpay_payment_id ? 'Online Payment (Razorpay)' : 'Online Payment'}</div>
    </div>
    <div class="info">
      <div class="info-cell">
        <div class="sec-lbl">Company Details</div>
        <div class="row"><span class="k">Company</span><span class="v">Our School Tech</span></div>
        <div class="row"><span class="k">Website</span><span class="v">ourschooltech.com</span></div>
        <div class="row"><span class="k">Email</span><span class="v">support@ourschooltech.com</span></div>
      </div>
      <div class="info-cell">
        <div class="sec-lbl">Terms & Conditions</div>
        <div class="terms">
          1. Subscription fees are non-refundable once activated.<br/>
          2. Service validity as per subscription period.<br/>
          3. This is a computer-generated invoice.<br/>
          4. No physical signature required.
        </div>
      </div>
    </div>
  </div>
  <div class="ftr">
    <div class="ftr-l">
      <div class="fn">Our School Tech</div>
      <div class="fd">ourschooltech.com · support@ourschooltech.com</div>
    </div>
    <div class="ftr-r">
      <div class="fl">Authorized Signatory</div>
      <div class="fsig">Dinakar Sai Reddy Lingala</div>
      <div class="frole">CEO & Founder</div>
    </div>
  </div>
  ${payment.razorpay_payment_id ? `
  <div class="ref">
    <span>Payment ID: ${payment.razorpay_payment_id}</span>
    <span>Order ID: ${payment.razorpay_order_id || '—'}</span>
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
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: payments, isLoading: paymentsLoading } = useSubscriptionPayments();
  const { initiatePayment, isLoading: payLoading, isProcessing } = useRazorpay();
  const queryClient = useQueryClient();

  // Live active student count
  const [liveStudentCount, setLiveStudentCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    if (!user?.schoolId) return;
    setCountLoading(true);
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', user.schoolId)
      .eq('status', 'active')
      .then(({ count }) => {
        setLiveStudentCount(count ?? 0);
        setCountLoading(false);
      });
  }, [user?.schoolId]);

  const paidStudentCount = subscription?.student_count || 0;
  const pricePerStudent = subscription?.price_per_student || 0;
  const totalAmount = subscription?.total_amount || 0;

  // Dynamic calculation based on live count
  const currentStudentCount = liveStudentCount ?? paidStudentCount;
  const dynamicTotal = currentStudentCount * pricePerStudent;

  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';
  const isPending = subscription?.status === 'pending';

  const daysRemaining = subscription?.end_date
    ? differenceInDays(new Date(subscription.end_date), new Date())
    : 0;

  // Top-up logic: extra students added after initial payment
  const extraStudents = isActive && liveStudentCount !== null && liveStudentCount > paidStudentCount
    ? liveStudentCount - paidStudentCount
    : 0;
  const topUpAmount = extraStudents * pricePerStudent;
  const needsTopUp = extraStudents > 0;

  // needsTopUp is used for upgrade logic

  const handlePayPlan = () => {
    if (!user?.schoolId || !subscription) return;

    initiatePayment({
      subscriptionId: subscription.id,
      amount: dynamicTotal,
      schoolName: user.schoolName || 'School',
      userEmail: user.email,
      userName: user.name,
      schoolId: user.schoolId,
      studentCount: currentStudentCount,
      paymentType: 'renewal',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
      },
    });
  };

  const handleTopUp = () => {
    if (!user?.schoolId || !subscription) return;

    initiatePayment({
      subscriptionId: subscription.id,
      amount: topUpAmount,
      schoolName: user.schoolName || 'School',
      userEmail: user.email,
      userName: user.name,
      schoolId: user.schoolId,
      studentCount: currentStudentCount,
      paymentType: 'topup',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
      },
    });
  };

  if (subLoading) {
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

  if (!subscription) {
    return (
      <AdminLayout title="Subscription">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Your subscription is managed by the platform administrator. Please contact support for activation.
              </p>
            </CardContent>
          </Card>
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
              <p className="text-xs text-muted-foreground">Renew your plan to continue using all features.</p>
            </div>
          </div>
        )}

        {needsTopUp && (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm">
                Upgrade required — {extraStudents} additional student{extraStudents !== 1 ? 's' : ''} detected
              </p>
              <p className="text-xs text-muted-foreground">
                Pay ₹{topUpAmount.toLocaleString('en-IN')} ({extraStudents} × ₹{pricePerStudent}) to upgrade. Plan expiry remains unchanged.
              </p>
            </div>
          </div>
        )}

        {daysRemaining > 0 && daysRemaining <= 30 && !isExpired && (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Expiring in {daysRemaining} days</p>
              <p className="text-xs text-muted-foreground">Renew now to avoid interruption.</p>
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

              {!isTrial && (
                <>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">₹{dynamicTotal.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-muted-foreground">/year</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentStudentCount} student{currentStudentCount !== 1 ? 's' : ''} × ₹{pricePerStudent}/student
                  </p>
                  {needsTopUp && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                      {extraStudents} new student{extraStudents !== 1 ? 's' : ''} added · Additional ₹{topUpAmount.toLocaleString('en-IN')} due
                    </p>
                  )}
                  {liveStudentCount !== null && liveStudentCount !== paidStudentCount && !needsTopUp && isActive && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Student count changed: {paidStudentCount} → {liveStudentCount} (active)
                    </p>
                  )}
                </>
              )}

              {isTrial && (
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">Trial</span>
                </div>
              )}

              {/* Upgrade Button - only when active students > paid students on active plan */}
              {needsTopUp && (
                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleTopUp}
                  disabled={payLoading || isProcessing}
                >
                  {payLoading || isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing
                    ? 'Processing Payment...'
                    : payLoading
                    ? 'Preparing...'
                    : `Upgrade Plan — Pay ₹${topUpAmount.toLocaleString('en-IN')} for ${extraStudents} Student${extraStudents !== 1 ? 's' : ''}`}
                </Button>
              )}

              {/* Activate Button - only when expired, pending, or trial */}
              {(isExpired || isPending || isTrial) && pricePerStudent > 0 && (
                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handlePayPlan}
                  disabled={payLoading || isProcessing || currentStudentCount <= 0}
                >
                  {payLoading || isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing
                    ? 'Processing Payment...'
                    : payLoading
                    ? 'Preparing...'
                    : isTrial
                    ? `Activate — Pay ₹${dynamicTotal.toLocaleString('en-IN')}`
                    : `Activate Plan — ₹${dynamicTotal.toLocaleString('en-IN')}`}
                </Button>
              )}
            </div>

            <Separator />

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="p-4 text-center">
                <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">
                  {countLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : currentStudentCount}
                </p>
                <p className="text-[10px] text-muted-foreground">Active Students</p>
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
                { label: 'Current Active Students', value: countLoading ? '...' : String(currentStudentCount) },
                ...(needsTopUp ? [{ label: 'New Students (Unpaid)', value: String(extraStudents), highlight: true }] : []),
                { label: 'Price Per Student', value: `₹${pricePerStudent}` },
                ...(needsTopUp ? [{ label: 'Additional Amount Due', value: `₹${topUpAmount.toLocaleString('en-IN')}`, highlight: true }] : []),
                { label: 'Total Plan Amount', value: `₹${dynamicTotal.toLocaleString('en-IN')}` },
              ].map((item: any, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                  <span className={item.highlight ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-muted-foreground'}>{item.label}</span>
                  <span className={`font-medium capitalize ${item.highlight ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                          <p className="font-bold text-foreground text-sm">
                            ₹{payment.amount.toLocaleString('en-IN')}
                            {payment.payment_type === 'topup' && (
                              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 ml-1.5">Top-Up</span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {payment.paid_at
                              ? format(new Date(payment.paid_at), 'dd MMM yyyy, hh:mm a')
                              : format(new Date(payment.created_at), 'dd MMM yyyy')}
                            {payment.student_count ? ` · ${payment.student_count} students` : ''}
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
                              payment.student_count || paidStudentCount,
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
