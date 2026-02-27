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
    ? format(new Date(payment.paid_at), 'dd-MMMM-yy')
    : format(new Date(payment.created_at), 'dd-MMMM-yy');
  const receiptId = (payment.razorpay_payment_id || payment.id.slice(0, 8)).toUpperCase();
  const billNo = receiptId.replace('PAY_', '').slice(0, 8);
  const amountWords = numberToIndianWords(payment.amount);
  const paymentType = (payment as any).payment_type === 'topup' ? 'Top-Up' : 'Renewal';

  const logoBase64 = await getLogoBase64();

  const receiptHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Invoice ${billNo} — Our School Tech</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{max-width:780px;margin:0 auto;border:1px solid #e0e0e0;}

  /* HEADER */
  .hdr{background:#111;padding:28px 36px;display:flex;justify-content:space-between;align-items:center;}
  .hdr-left{display:flex;align-items:center;gap:16px;}
  .hdr-left img{height:44px;width:auto;}
  .hdr-info{}
  .hdr-name{color:#fff;font-size:18px;font-weight:900;letter-spacing:.5px;text-transform:uppercase;}
  .hdr-sub{color:#777;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin-top:3px;}
  .hdr-right{}
  .hdr-inv{color:#fff;font-size:32px;font-weight:900;letter-spacing:3px;text-transform:uppercase;}

  /* META */
  .meta{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:2px solid #111;margin:0;}
  .meta-c{padding:16px 20px;border-right:1px solid #ddd;}
  .meta-c:last-child{border-right:none;}
  .meta-c .lbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-weight:700;}
  .meta-c .val{font-size:15px;font-weight:800;color:#111;margin-top:5px;}

  .content{padding:28px 36px;}

  /* BILLED */
  .billed .lbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;font-weight:700;}
  .billed .name{font-size:22px;font-weight:900;color:#111;margin-top:4px;}
  .billed .desc{font-size:12px;color:#777;margin-top:4px;}

  .sep{height:1px;background:#e5e5e5;margin:24px 0;}

  /* TABLE */
  table{width:100%;border-collapse:collapse;}
  thead{background:#111;}
  thead th{color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;padding:12px 16px;text-align:left;}
  thead th.cen{text-align:center;}
  thead th.rt{text-align:right;}
  tbody td{padding:16px;font-size:13px;border-bottom:1px solid #eee;vertical-align:top;}
  tbody td.cen{text-align:center;}
  tbody td.rt{text-align:right;}
  .svc-name{font-weight:800;font-size:14px;color:#111;}
  .svc-sub{font-size:11px;color:#999;margin-top:3px;}
  .amt{font-weight:900;font-size:16px;color:#111;}

  /* TOTALS */
  .totals{display:flex;justify-content:flex-end;margin-top:0;}
  .totals-box{width:300px;}
  .trow{display:flex;justify-content:space-between;padding:9px 16px;font-size:12px;color:#777;border-bottom:1px solid #f0f0f0;}
  .trow .tv{font-weight:700;color:#333;}
  .grand{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#111;color:#fff;margin-top:4px;}
  .grand .gl{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;}
  .grand .gv{font-size:24px;font-weight:900;letter-spacing:.5px;}

  /* WORDS */
  .words-bar{margin:24px 0;padding:14px 18px;background:#f7f7f7;border-left:4px solid #111;font-size:12px;color:#555;}
  .words-bar strong{color:#111;font-weight:800;}

  /* INFO GRID */
  .info{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e0e0e0;margin-bottom:0;}
  .info-cell{padding:20px 24px;}
  .info-cell+.info-cell{border-left:1px solid #e0e0e0;}
  .info-cell .sec-lbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;font-weight:800;margin-bottom:10px;}
  .info-cell .row{font-size:11px;line-height:2.2;display:flex;}
  .info-cell .row .k{color:#999;width:100px;flex-shrink:0;}
  .info-cell .row .v{color:#222;font-weight:600;}
  .info-cell .terms{font-size:10px;color:#888;line-height:1.8;}

  /* FOOTER */
  .ftr{background:#111;padding:24px 36px;display:flex;justify-content:space-between;align-items:flex-end;}
  .ftr-l .fn{color:#fff;font-size:14px;font-weight:800;}
  .ftr-l .fd{color:#666;font-size:9px;line-height:1.8;margin-top:4px;}
  .ftr-r{text-align:right;}
  .ftr-r .fl{color:#666;font-size:8px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;}
  .ftr-r .fsig{color:#fff;font-size:17px;font-weight:900;margin-top:6px;font-style:italic;}
  .ftr-r .frole{color:#888;font-size:9px;margin-top:3px;}

  .ref{padding:8px 36px;background:#f5f5f5;display:flex;justify-content:space-between;font-size:8px;color:#bbb;font-family:monospace;letter-spacing:.5px;border-top:1px solid #e0e0e0;}

  @media print{.page{border:none;max-width:100%;}}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div class="hdr-left">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo"/>` : ''}
      <div class="hdr-info">
        <div class="hdr-name">Our School Tech</div>
        <div class="hdr-sub">ourschooltech.com</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="hdr-inv">Invoice</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-c"><div class="lbl">Invoice No.</div><div class="val">${billNo}</div></div>
    <div class="meta-c"><div class="lbl">Date</div><div class="val">${paymentDate}</div></div>
    <div class="meta-c"><div class="lbl">Payment</div><div class="val">✓ PAID</div></div>
    <div class="meta-c"><div class="lbl">Students</div><div class="val">${studentCount}</div></div>
  </div>

  <div class="content">
    <div class="billed">
      <div class="lbl">Billed To</div>
      <div class="name">${schoolName}</div>
      <div class="desc">School ERP Platform — Annual ${paymentType} Subscription</div>
    </div>

    <div class="sep"></div>

    <table>
      <thead><tr>
        <th style="width:36px">#</th>
        <th>Service Description</th>
        <th class="cen" style="width:60px">Qty</th>
        <th class="rt" style="width:100px">Rate (₹)</th>
        <th class="rt" style="width:120px">Amount (₹)</th>
      </tr></thead>
      <tbody><tr>
        <td>1</td>
        <td>
          <div class="svc-name">School ERP Platform — Annual ${paymentType}</div>
          <div class="svc-sub">Cloud-based school management system · ${studentCount} student${studentCount !== 1 ? 's' : ''}</div>
        </td>
        <td class="cen">${studentCount}</td>
        <td class="rt">${pricePerStudent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="rt amt">${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr></tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="grand">
          <span class="gl">Total</span>
          <span class="gv">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <div class="words-bar">
      <strong>Amount in words:</strong>&nbsp; INR ${amountWords}
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
      <div class="fd">ourschooltech.com<br/>support@ourschooltech.com</div>
    </div>
    <div class="ftr-r">
      <div class="fl">Authorized Signatory</div>
      <div class="fsig">Dinakar Sai Reddy Lingala</div>
      <div class="frole">CEO & Founder</div>
    </div>
  </div>

  ${payment.razorpay_payment_id ? `
  <div class="ref">
    <span>PAYMENT : ${payment.razorpay_payment_id}</span>
    <span>ORDER : ${payment.razorpay_order_id || '—'}</span>
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
