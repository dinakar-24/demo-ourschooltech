import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  History
} from 'lucide-react';
import { useSubscription, useSubscriptionPayments, useCreateSubscription } from '@/hooks/useSubscription';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useSubscriptionPricing } from '@/hooks/useSubscriptionPricing';
import { format, differenceInDays } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: payments, isLoading: paymentsLoading } = useSubscriptionPayments();
  const { data: studentsResult, isLoading: studentsLoading } = useStudents();
  const createSubscription = useCreateSubscription();
  const { initiatePayment, isLoading: paymentLoading, isProcessing } = useRazorpay();
  const { pricePerStudent } = useSubscriptionPricing();
  const studentCount = studentsResult?.totalCount || 0;
  const totalAmount = studentCount * pricePerStudent;
 
   const isActive = subscription?.status === 'active';
   const isTrial = subscription?.status === 'trial';
   const isExpired = subscription?.status === 'expired';
   const isPending = subscription?.status === 'pending' || !subscription;
 
   const daysRemaining = subscription?.end_date 
     ? differenceInDays(new Date(subscription.end_date), new Date())
     : 0;
 
   const handlePayment = async () => {
     let subscriptionId = subscription?.id;
 
     // Create subscription if doesn't exist
     if (!subscriptionId) {
       const result = await createSubscription.mutateAsync({
         schoolId: user?.schoolId || '',
         studentCount,
       });
       subscriptionId = result.id;
     }
 
     initiatePayment({
       subscriptionId,
       amount: totalAmount,
       schoolName: user?.schoolName || 'School',
       userEmail: user?.email,
       userName: user?.name,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['subscription'] });
         queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
       },
     });
   };
 
   const getStatusBadge = () => {
     if (isActive) {
       return (
         <Badge className="bg-success/10 text-success border-success/20 px-3 py-1">
           <CheckCircle className="w-4 h-4 mr-1" />
           Active
         </Badge>
       );
     }
     if (isTrial) {
       return (
         <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
           <Clock className="w-4 h-4 mr-1" />
           Trial
         </Badge>
       );
     }
     if (isExpired) {
       return (
         <Badge variant="destructive" className="px-3 py-1">
           <XCircle className="w-4 h-4 mr-1" />
           Expired
         </Badge>
       );
     }
     return (
       <Badge variant="secondary" className="px-3 py-1">
         <Clock className="w-4 h-4 mr-1" />
         Pending
       </Badge>
     );
   };
 
   if (subLoading || studentsLoading) {
     return (
       <AdminLayout title="Subscription">
         <div className="space-y-6">
           <Skeleton className="h-48 w-full" />
           <Skeleton className="h-64 w-full" />
         </div>
       </AdminLayout>
     );
   }
 
   return (
     <AdminLayout title="Subscription">
       <div className="space-y-6 animate-fade-up">
         {/* Status Alert */}
         {isExpired && (
           <Card className="border-destructive bg-destructive/5">
             <CardContent className="pt-6">
               <div className="flex items-center gap-3">
                 <AlertTriangle className="w-6 h-6 text-destructive" />
                 <div>
                   <p className="font-medium text-destructive">Subscription Expired</p>
                   <p className="text-sm text-muted-foreground">
                     Your subscription has expired. Please renew to continue using all features.
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}
 
         {daysRemaining > 0 && daysRemaining <= 30 && !isExpired && (
           <Card className="border-warning bg-warning/5">
             <CardContent className="pt-6">
               <div className="flex items-center gap-3">
                 <AlertTriangle className="w-6 h-6 text-warning" />
                 <div>
                   <p className="font-medium text-warning">Subscription Expiring Soon</p>
                   <p className="text-sm text-muted-foreground">
                     Your subscription will expire in {daysRemaining} days. Renew now to avoid interruption.
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Subscription Card */}
         <Card>
           <CardHeader>
             <div className="flex items-center justify-between">
               <div>
                 <CardTitle className="flex items-center gap-2">
                   <CreditCard className="w-5 h-5 text-primary" />
                   Annual Subscription
                 </CardTitle>
              <CardDescription>
                  ₹{pricePerStudent} per student per year
                 </CardDescription>
               </div>
               {getStatusBadge()}
             </div>
           </CardHeader>
           <CardContent className="space-y-6">
             {/* Stats Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="p-4 rounded-xl bg-muted/50">
                 <div className="flex items-center gap-2 text-muted-foreground mb-1">
                   <Users className="w-4 h-4" />
                   <span className="text-sm">Students</span>
                 </div>
                 <p className="text-2xl font-bold">{studentCount}</p>
               </div>
 
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <IndianRupee className="w-4 h-4" />
                    <span className="text-sm">Per Student</span>
                  </div>
                  <p className="text-2xl font-bold">₹{pricePerStudent}</p>
                </div>
 
               <div className="p-4 rounded-xl bg-primary/10">
                 <div className="flex items-center gap-2 text-primary mb-1">
                   <IndianRupee className="w-4 h-4" />
                   <span className="text-sm">Total Amount</span>
                 </div>
                 <p className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString()}</p>
               </div>
 
               <div className="p-4 rounded-xl bg-muted/50">
                 <div className="flex items-center gap-2 text-muted-foreground mb-1">
                   <Calendar className="w-4 h-4" />
                   <span className="text-sm">Valid Until</span>
                 </div>
                 <p className="text-lg font-bold">
                   {subscription?.end_date 
                     ? format(new Date(subscription.end_date), 'MMM d, yyyy')
                     : 'Not activated'}
                 </p>
               </div>
             </div>
 
             {/* Subscription Details */}
             {subscription && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="text-sm text-muted-foreground">Plan Type</p>
                  <p className="font-medium capitalize">{subscription.plan_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per Student</p>
                  <p className="font-medium">₹{pricePerStudent}/year</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                   <p className="font-medium">
                     {subscription.start_date 
                       ? format(new Date(subscription.start_date), 'MMM d, yyyy')
                       : 'Not started'}
                   </p>
                 </div>
               </div>
             )}
 
             {/* Payment Button */}
             <div className="flex justify-center pt-4">
               <Button 
                 size="lg" 
                 onClick={handlePayment}
                 disabled={paymentLoading || isProcessing || createSubscription.isPending}
                 className="min-w-48"
               >
                 {(paymentLoading || isProcessing || createSubscription.isPending) ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Processing...
                   </>
                 ) : isActive ? (
                   <>
                     <CreditCard className="w-4 h-4 mr-2" />
                     Renew Subscription
                   </>
                 ) : (
                   <>
                     <CreditCard className="w-4 h-4 mr-2" />
                     Pay ₹{totalAmount.toLocaleString()}
                   </>
                 )}
               </Button>
             </div>
           </CardContent>
         </Card>
 
         {/* Payment History */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <History className="w-5 h-5 text-primary" />
               Payment History
             </CardTitle>
           </CardHeader>
           <CardContent>
             {paymentsLoading ? (
               <div className="space-y-3">
                 {[...Array(3)].map((_, i) => (
                   <Skeleton key={i} className="h-16 w-full" />
                 ))}
               </div>
             ) : payments && payments.length > 0 ? (
               <div className="space-y-3">
                 {payments.map((payment) => (
                   <div 
                     key={payment.id}
                     className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                   >
                     <div>
                       <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                       <p className="text-sm text-muted-foreground">
                         {payment.paid_at 
                           ? format(new Date(payment.paid_at), 'MMM d, yyyy • h:mm a')
                           : format(new Date(payment.created_at), 'MMM d, yyyy')}
                       </p>
                       {payment.razorpay_payment_id && (
                         <p className="text-xs text-muted-foreground mt-1">
                           ID: {payment.razorpay_payment_id}
                         </p>
                       )}
                     </div>
                     <Badge 
                       variant={payment.status === 'success' ? 'default' : 
                                payment.status === 'failed' ? 'destructive' : 'secondary'}
                     >
                       {payment.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                       {payment.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                       {payment.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                       {payment.status}
                     </Badge>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-8 text-muted-foreground">
                 <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p>No payment history</p>
                 <p className="text-sm mt-1">Your payment records will appear here</p>
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </AdminLayout>
   );
 }