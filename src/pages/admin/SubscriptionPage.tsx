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
<title>Bill Of Service - ${schoolName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 24px; background: #fff; font-size: 13px; }
  .invoice { max-width: 700px; margin: 0 auto; border: 1px solid #000; padding: 0; }
  
  .header { text-align: center; padding: 20px 24px 16px; border-bottom: 1px solid #000; }
  .company-name { font-size: 24px; font-weight: 700; color: #1a3a6b; margin-bottom: 8px; }
  .company-details { font-size: 11px; color: #333; line-height: 1.6; }
  .company-details a { color: #1a3a6b; }
  
  .bill-title { text-align: center; padding: 10px 0; border-bottom: 1px solid #000; }
  .bill-title h2 { font-size: 16px; text-decoration: underline; font-weight: 700; }
  
  .meta-section { display: flex; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid #000; }
  .meta-left, .meta-right { font-size: 13px; }
  .meta-right { text-align: right; }
  .meta-label { font-weight: 400; }
  .meta-value { font-weight: 700; }
  
  .to-section { padding: 8px 24px 12px; border-bottom: 1px solid #000; }
  .to-section .to-label { font-size: 12px; color: #555; }
  .to-section .to-name { font-size: 14px; font-weight: 700; }
  
  .terms { padding: 8px 24px; border-bottom: 1px solid #000; font-size: 12px; color: #c00; font-weight: 600; text-align: center; }
  
  table { width: 100%; border-collapse: collapse; }
  table th { background: #fff; font-size: 12px; font-weight: 700; padding: 8px 12px; text-align: left; border: 1px solid #000; }
  table th:last-child { text-align: right; }
  table td { padding: 10px 12px; font-size: 13px; border: 1px solid #000; vertical-align: top; }
  table td:last-child { text-align: right; font-weight: 600; }
  table td:first-child { text-align: center; width: 50px; }
  .desc-cell { min-height: 80px; }
  .desc-cell .balance { margin-top: 12px; font-weight: 400; }
  
  .total-row td { font-weight: 700; font-size: 14px; }
  .total-row td:last-child { color: #000; }
  
  .footer-section { display: flex; border-top: 1px solid #000; }
  .footer-left { flex: 1; padding: 12px 16px; border-right: 1px solid #000; font-size: 11px; }
  .footer-right { flex: 1; padding: 12px 16px; font-size: 11px; }
  
  .amount-words { font-size: 12px; padding: 8px 16px; border-top: 1px solid #000; }
  .amount-words strong { font-weight: 700; }
  .oe-row { display: flex; justify-content: space-between; }
  
  .bank-details { line-height: 1.7; }
  .bank-details .bank-label { display: inline-block; min-width: 130px; }
  
  .declaration { border-top: 1px solid #000; padding: 10px 16px; font-size: 10px; line-height: 1.5; }
  .declaration u { font-weight: 700; }
  
  .signature { text-align: right; padding: 8px 24px 16px; font-weight: 700; font-size: 13px; }
  
  @media print { 
    body { padding: 0; } 
    .invoice { border: 1px solid #000; }
  }
</style></head><body>
<div class="invoice">
  <div class="header">
    <div class="company-name">Nimblix Technologies OPC Pvt Ltd</div>
    <div class="company-details">
      MSME Reg. No. : U62099KA2025OPC203124<br/>
      Phone: 81234-02974, E-mail: <a href="mailto:info@nimblix.in">info@nimblix.in</a>
    </div>
  </div>
  
  <div class="bill-title">
    <h2>Bill Of Service</h2>
  </div>
  
  <div class="meta-section">
    <div class="meta-left">
      <span class="meta-label">Bill No. : </span>
      <span class="meta-value">${billNo}</span>
    </div>
    <div class="meta-right">
      <span class="meta-label">Date : </span>
      <span class="meta-value">${paymentDate}</span>
    </div>
  </div>
  
  <div class="to-section">
    <div class="to-label">To</div>
    <div class="to-name">${schoolName}</div>
  </div>
  
  <div class="terms">
    Terms & conditions : The Subscription Fees will not be refunded under any circumstances.
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Sl No</th>
        <th>Description & Service Details</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="desc-cell">
          <strong>School ERP Platform - Annual ${paymentType} Subscription</strong><br/><br/>
          ${studentCount} Students × ₹${pricePerStudent.toLocaleString('en-IN')}/student/year
        </td>
        <td>${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2" style="text-align:right; padding-right: 16px;">Total</td>
        <td>₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="amount-words">
    <div class="oe-row">
      <div>
        <strong>Amount Chargeable (in words)</strong><br/>
        INR&nbsp; ${amountWords}
      </div>
      <div style="text-align:right; font-weight: 700; font-size: 12px;">E. &amp; O.E</div>
    </div>
  </div>
  
  <div class="footer-section">
    <div class="footer-left">
      <u><strong>Declaration</strong></u><br/>
      Payment against the invoice should be done within 15 days from the date of the invoice as per the new MSME rule incorporated under Section 43B(h) of the Income Tax Act.
    </div>
    <div class="footer-right">
      <strong>Company's Bank Details</strong><br/>
      <div class="bank-details">
        <span class="bank-label">A/c Holder's Name</span> : Nimblix Technologies OPC Private Limited<br/>
        <span class="bank-label">Bank Name</span> : HDFC Current Account<br/>
        <span class="bank-label">A/c No.</span> : 50200114739507<br/>
        <span class="bank-label">Branch & IFS Code</span> : Malleshwaram & HDFC0000041
      </div>
    </div>
  </div>
  
  <div class="signature">
    <br/>Suresh Chandra
  </div>
  
  ${payment.razorpay_payment_id ? `
  <div style="padding: 8px 16px; border-top: 1px solid #ccc; font-size: 10px; color: #666; display: flex; justify-content: space-between;">
    <span>Payment ID: ${payment.razorpay_payment_id}</span>
    <span>Order ID: ${payment.razorpay_order_id || 'N/A'}</span>
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
