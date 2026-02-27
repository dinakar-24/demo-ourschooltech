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
<title>Invoice - ${schoolName} | Nimblix Technologies</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; padding: 0; background: #fff; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 780px; margin: 0 auto; padding: 40px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .brand { }
  .brand-name { font-size: 20px; font-weight: 800; color: #0d1b2a; letter-spacing: -0.3px; }
  .brand-sub { font-size: 10px; color: #64748b; margin-top: 3px; letter-spacing: 0.3px; text-transform: uppercase; font-weight: 500; }
  .brand-reg { font-size: 9px; color: #94a3b8; margin-top: 6px; }
  .invoice-badge { text-align: right; }
  .invoice-badge h1 { font-size: 28px; font-weight: 800; color: #0d1b2a; letter-spacing: -0.5px; }
  .invoice-badge .inv-no { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 4px; }

  /* Divider */
  .divider { height: 2px; background: linear-gradient(90deg, #0f766e, #0ea5e9, #8b5cf6); border-radius: 2px; margin-bottom: 28px; }

  /* Meta grid */
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .meta-box { }
  .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
  .meta-val { font-size: 14px; font-weight: 700; color: #0d1b2a; }
  .meta-val-sm { font-size: 12px; font-weight: 500; color: #475569; margin-top: 1px; }

  /* Table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .items-table thead th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #fff; font-weight: 600; padding: 10px 16px; background: #0f766e; }
  .items-table thead th:first-child { border-radius: 6px 0 0 0; text-align: center; width: 48px; }
  .items-table thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
  .items-table tbody td { padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .items-table tbody td:first-child { text-align: center; color: #94a3b8; font-weight: 600; }
  .items-table tbody td:last-child { text-align: right; font-weight: 700; font-size: 14px; white-space: nowrap; }
  .item-title { font-weight: 600; color: #0d1b2a; margin-bottom: 4px; }
  .item-desc { font-size: 11px; color: #64748b; line-height: 1.5; }

  /* Totals */
  .totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 12px; }
  .totals-row.sub { color: #64748b; }
  .totals-row.grand { background: #0f766e; color: #fff; border-radius: 6px; padding: 12px 16px; font-size: 15px; font-weight: 800; margin-top: 4px; }
  .totals-row .t-label { }
  .totals-row .t-val { font-weight: 700; }

  /* Amount words */
  .amount-words { background: #f8fafc; border-radius: 6px; padding: 12px 16px; margin-bottom: 28px; font-size: 11px; color: #475569; }
  .amount-words strong { color: #0d1b2a; font-weight: 600; }

  /* Paid stamp */
  .paid-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; font-weight: 900; color: rgba(16, 185, 129, 0.06); letter-spacing: 20px; pointer-events: none; z-index: 0; }

  /* Info grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .info-card { background: #f8fafc; border-radius: 8px; padding: 16px; }
  .info-card h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 10px; }
  .info-card p { font-size: 11px; color: #334155; line-height: 1.7; }
  .info-card .info-row { display: flex; gap: 4px; font-size: 11px; line-height: 1.8; }
  .info-card .info-row .il { color: #94a3b8; min-width: 110px; }
  .info-card .info-row .iv { color: #334155; font-weight: 500; }

  /* Footer */
  .footer-bar { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 9px; color: #94a3b8; line-height: 1.6; }
  .footer-right { text-align: right; }
  .footer-right .sig-name { font-size: 13px; font-weight: 700; color: #0d1b2a; }
  .footer-right .sig-title { font-size: 10px; color: #64748b; margin-top: 2px; }
  .footer-right .sig-co { font-size: 9px; color: #94a3b8; margin-top: 1px; }

  .ref-bar { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #cbd5e1; }

  @media print { 
    body { padding: 0; }
    .page { padding: 24px; }
    .paid-watermark { position: absolute; }
  }
</style></head><body>
<div class="paid-watermark">PAID</div>
<div class="page">
  <div class="header">
    <div class="brand">
      <div class="brand-name">NIMBLIX TECHNOLOGIES</div>
      <div class="brand-sub">OPC Private Limited</div>
      <div class="brand-reg">CIN: U62099KA2025OPC203124 &nbsp;|&nbsp; MSME Registered</div>
    </div>
    <div class="invoice-badge">
      <h1>INVOICE</h1>
      <div class="inv-no">#${billNo}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Billed To</div>
      <div class="meta-val">${schoolName}</div>
      <div class="meta-val-sm">School ERP Subscription</div>
    </div>
    <div class="meta-box" style="text-align: right;">
      <div class="meta-label">Invoice Date</div>
      <div class="meta-val">${paymentDate}</div>
      <div class="meta-val-sm" style="color: #10b981; font-weight: 600;">● Paid</div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Service Description</th>
        <th>Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <div class="item-title">School ERP Platform — Annual ${paymentType}</div>
          <div class="item-desc">
            Cloud-based School Management System<br/>
            ${studentCount} active student${studentCount !== 1 ? 's' : ''} × ₹${pricePerStudent.toLocaleString('en-IN')} per student per year
          </div>
        </td>
        <td>${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row sub">
        <span class="t-label">Subtotal</span>
        <span class="t-val">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="totals-row sub">
        <span class="t-label">Tax</span>
        <span class="t-val">₹0.00</span>
      </div>
      <div class="totals-row grand">
        <span class="t-label">Total Paid</span>
        <span class="t-val">₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>

  <div class="amount-words">
    <strong>Amount in words:</strong>&nbsp; INR ${amountWords}
  </div>

  <div class="info-grid">
    <div class="info-card">
      <h4>Bank Details</h4>
      <div class="info-row"><span class="il">Account Name</span><span class="iv">Nimblix Technologies OPC Pvt Ltd</span></div>
      <div class="info-row"><span class="il">Bank</span><span class="iv">HDFC Bank — Current A/c</span></div>
      <div class="info-row"><span class="il">Account No.</span><span class="iv">50200114739507</span></div>
      <div class="info-row"><span class="il">IFSC Code</span><span class="iv">HDFC0000041</span></div>
      <div class="info-row"><span class="il">Branch</span><span class="iv">Malleshwaram</span></div>
    </div>
    <div class="info-card">
      <h4>Terms & Conditions</h4>
      <p>
        • Subscription fees are non-refundable once activated.<br/>
        • Payment is due within 15 days from invoice date per MSME rules under Section 43B(h) of the Income Tax Act.<br/>
        • This is a computer-generated invoice.
      </p>
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-left">
      Nimblix Technologies OPC Pvt Ltd<br/>
      info@nimblix.in &nbsp;|&nbsp; +91 81234-02974<br/>
      CIN: U62099KA2025OPC203124
    </div>
    <div class="footer-right">
      <div class="sig-name">Suresh Chandra</div>
      <div class="sig-title">Director</div>
      <div class="sig-co">Nimblix Technologies OPC Pvt Ltd</div>
    </div>
  </div>

  ${payment.razorpay_payment_id ? `
  <div class="ref-bar">
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
