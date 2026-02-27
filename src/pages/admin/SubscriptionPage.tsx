import { useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Receipt,
  Shield,
  Sparkles,
  FileText,
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
  const receiptHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Subscription Receipt</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
  .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #0f766e; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0f766e, #14b8a6); color: white; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; opacity: 0.85; font-size: 13px; }
  .body { padding: 28px 32px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #6b7280; font-size: 13px; }
  .row .value { font-weight: 600; font-size: 14px; }
  .total-row { background: #f0fdfa; padding: 14px 16px; border-radius: 8px; margin: 16px 0; display: flex; justify-content: space-between; align-items: center; }
  .total-row .amount { font-size: 22px; font-weight: 700; color: #0f766e; }
  .words { font-size: 12px; color: #6b7280; font-style: italic; margin-bottom: 16px; }
  .footer { text-align: center; padding: 16px 32px; background: #f9fafb; font-size: 11px; color: #9ca3af; }
  .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
  @media print { body { padding: 0; } .receipt { border: 1px solid #ccc; } }
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>Subscription Receipt</h1>
    <p>${schoolName}</p>
  </div>
  <div class="body">
    <div class="row"><span class="label">Receipt ID</span><span class="value">${payment.razorpay_payment_id || payment.id.slice(0, 12).toUpperCase()}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${payment.paid_at ? format(new Date(payment.paid_at), 'dd MMM yyyy, hh:mm a') : format(new Date(payment.created_at), 'dd MMM yyyy')}</span></div>
    <div class="row"><span class="label">Status</span><span class="badge">${payment.status === 'success' ? '✓ Paid' : payment.status}</span></div>
    <div class="row"><span class="label">Plan</span><span class="value">Annual Subscription</span></div>
    <div class="row"><span class="label">Students</span><span class="value">${studentCount}</span></div>
    <div class="row"><span class="label">Rate</span><span class="value">₹${pricePerStudent}/student/year</span></div>
    <div class="total-row"><span class="label" style="font-weight:600;color:#1a1a1a;">Total Amount</span><span class="amount">₹${payment.amount.toLocaleString('en-IN')}</span></div>
    <p class="words">${numberToIndianWords(payment.amount)}</p>
    ${payment.razorpay_order_id ? `<div class="row"><span class="label">Order ID</span><span class="value" style="font-size:12px;">${payment.razorpay_order_id}</span></div>` : ''}
  </div>
  <div class="footer">This is a computer-generated receipt and does not require a signature.<br/>For any queries, contact your school administrator.</div>
</div></body></html>`;

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

  // Calculate new (unpaid) students
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
        <div className="max-w-2xl mx-auto space-y-5">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Subscription">
      <div className="max-w-2xl mx-auto space-y-5 pb-8">

        {/* Alerts */}
        {isExpired && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive text-sm">Subscription Expired</p>
                <p className="text-xs text-muted-foreground">Renew now to continue using all features.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {daysRemaining > 0 && daysRemaining <= 30 && !isExpired && (
          <Card className="border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-400/10">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Expiring in {daysRemaining} days</p>
                <p className="text-xs text-muted-foreground">Renew to avoid service interruption.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Card - Hero */}
        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground">
            <div className="absolute top-3 right-3">
              {isActive ? (
                <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 backdrop-blur-sm">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                </Badge>
              ) : isTrial ? (
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Trial
                </Badge>
              ) : isExpired ? (
                <Badge className="bg-red-500/20 text-red-100 border-red-400/30 backdrop-blur-sm">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Expired
                </Badge>
              ) : (
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 opacity-80" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">Annual Plan</span>
            </div>
            <h2 className="text-3xl font-bold">
              ₹{totalAmount.toLocaleString('en-IN')}
              <span className="text-base font-normal opacity-70">/year</span>
            </h2>
             <p className="text-sm opacity-70 mt-1">
              {dbStudentCount} students × ₹{pricePerStudent} per student
            </p>
          </div>

          <CardContent className="p-0">
            {/* Stats Row */}
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs">Active Students</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{dbStudentCount}</p>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">Valid Until</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {subscription?.end_date
                    ? format(new Date(subscription.end_date), 'dd MMM yyyy')
                    : '—'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan Type</span>
                <span className="font-medium capitalize">{subscription?.plan_type || 'Yearly'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">₹{pricePerStudent}/student/year</span>
              </div>
              {subscription?.start_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{format(new Date(subscription.start_date), 'dd MMM yyyy')}</span>
                </div>
              )}
              {subscription?.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">{format(new Date(subscription.end_date), 'dd MMM yyyy')}</span>
                </div>
              )}
              {daysRemaining > 0 && !isExpired && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Days Remaining</span>
                  <span className="font-medium text-primary">{daysRemaining} days</span>
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <Button
                className="w-full h-12 text-base font-semibold"
                size="lg"
                onClick={handlePayment}
                disabled={paymentLoading || isProcessing || totalAmount <= 0}
              >
                {(paymentLoading || isProcessing) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : isActive ? (
                  <><CreditCard className="w-4 h-4 mr-2" /> Renew Subscription</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" /> Pay ₹{totalAmount.toLocaleString('en-IN')}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top-Up Alert for New Students */}
        {newStudents > 0 && (
          <Card className="border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-400/10 shrink-0">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                    {newStudents} New Student{newStudents > 1 ? 's' : ''} Added
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have {newStudents} student{newStudents > 1 ? 's' : ''} beyond your paid count of {paidStudentCount}. 
                    Immediate payment of ₹{pricePerStudent}/student is required.
                  </p>
                </div>
              </div>

              <div className="bg-background rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid Students</span>
                  <span className="font-medium">{paidStudentCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Active Students</span>
                  <span className="font-medium">{dbStudentCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New Students</span>
                  <span className="font-semibold text-amber-600">{newStudents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">₹{pricePerStudent} × {newStudents}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Top-Up Amount</span>
                  <span className="text-primary">₹{topUpAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button
                className="w-full h-11 font-semibold"
                onClick={handleTopUp}
                disabled={paymentLoading || isProcessing}
              >
                {(paymentLoading || isProcessing) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><IndianRupee className="w-4 h-4 mr-1" /> Pay ₹{topUpAmount.toLocaleString('en-IN')} for {newStudents} New Student{newStudents > 1 ? 's' : ''}</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Receipt className="w-4 h-4 text-primary" />
              </div>
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {paymentsLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="divide-y divide-border">
                {payments.map((payment) => (
                  <div key={payment.id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        payment.status === 'success' ? 'bg-emerald-500/10' :
                        payment.status === 'failed' ? 'bg-destructive/10' : 'bg-muted'
                      }`}>
                        {payment.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : payment.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          ₹{payment.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {payment.paid_at
                            ? format(new Date(payment.paid_at), 'dd MMM yyyy, hh:mm a')
                            : format(new Date(payment.created_at), 'dd MMM yyyy')}
                        </p>
                        {payment.razorpay_payment_id && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                            {payment.razorpay_payment_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          payment.status === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                            : payment.status === 'failed'
                            ? 'border-destructive/30 bg-destructive/5 text-destructive'
                            : 'text-muted-foreground'
                        }
                      >
                        {payment.status === 'success' ? 'Paid' : payment.status === 'failed' ? 'Failed' : 'Pending'}
                      </Badge>
                      {payment.status === 'success' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Download Receipt"
                          onClick={() => downloadSubscriptionReceipt(
                            payment,
                            user?.schoolName || 'School',
                            dbStudentCount,
                            pricePerStudent
                          )}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-5">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-muted-foreground text-sm">No payment history</p>
                <p className="text-xs text-muted-foreground mt-1">Your payment records will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
