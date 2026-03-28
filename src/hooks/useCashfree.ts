import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface InitiatePaymentParams {
  invoiceId: string;
  studentId: string;
  schoolId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

// Load Cashfree JS SDK
function loadCashfreeSDK(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Cashfree) {
      resolve((window as any).Cashfree);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve((window as any).Cashfree);
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

export function useCashfree() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const initiatePayment = useCallback(async (params: InitiatePaymentParams) => {
    setLoading(true);
    try {
      // Create order via edge function
      const { data: sessionData, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          invoice_id: params.invoiceId,
          student_id: params.studentId,
          school_id: params.schoolId,
          amount: params.amount,
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          customer_phone: params.customerPhone,
        },
      });

      if (error || !sessionData?.payment_session_id) {
        toast.error(sessionData?.error || 'Failed to create payment order');
        setLoading(false);
        return { success: false };
      }

      // Load SDK and open checkout
      const Cashfree = await loadCashfreeSDK();
      const cashfree = Cashfree({ mode: 'production' });

      const result = await cashfree.checkout({
        paymentSessionId: sessionData.payment_session_id,
        redirectTarget: '_modal',
      });

      // After modal closes, verify status
      if (result?.paymentDetails?.paymentMessage === 'Payment Successful' || result?.error === undefined) {
        toast.success('Payment successful! Receipt will be generated shortly.');
        // Invalidate fee queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['parent-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['fee-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['parent-data'] });
        setLoading(false);
        return { success: true, orderId: sessionData.cf_order_id };
      } else {
        toast.error('Payment was not completed. Please try again.');
        setLoading(false);
        return { success: false };
      }
    } catch (err: any) {
      console.error('Cashfree payment error:', err);
      toast.error('Payment failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
      return { success: false };
    }
  }, [queryClient]);

  return { initiatePayment, loading };
}
