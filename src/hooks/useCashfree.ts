import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { invokeEdgeFunction } from '@/lib/api';

interface InitiatePaymentParams {
  invoiceId: string;
  studentId: string;
  schoolId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface CreateCashfreeOrderResponse {
  payment_session_id: string;
  cf_order_id: string;
  order_amount: number;
  extra_charge: number;
  base_amount: number;
  cashfree_mode?: 'sandbox' | 'production';
  error?: string;
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

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;
  };

  const initiatePayment = useCallback(async (params: InitiatePaymentParams) => {
    setLoading(true);
    try {
      const sessionData = await invokeEdgeFunction<CreateCashfreeOrderResponse>(
        'create-cashfree-order',
        {
          invoice_id: params.invoiceId,
          student_id: params.studentId,
          school_id: params.schoolId,
          amount: params.amount,
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          customer_phone: params.customerPhone,
        },
        { skipDedupe: true }
      );

      if (!sessionData?.payment_session_id) {
        const errorMsg = sessionData?.error || 'Failed to create payment order';
        const alreadyPaid = errorMsg.toLowerCase().includes('already paid');
        toast.error(errorMsg);
        setLoading(false);
        return { success: false, alreadyPaid };
      }

      const Cashfree = await loadCashfreeSDK();
      const cashfree = Cashfree({
        mode: sessionData.cashfree_mode === 'sandbox' ? 'sandbox' : 'production',
      });

      // Always use full-page redirect ('_self'). The Cashfree modal/iframe
      // renders a fixed desktop-width card on mobile browsers/Custom Tabs,
      // whereas the hosted checkout page is fully responsive.
      const result = await cashfree.checkout({
        paymentSessionId: sessionData.payment_session_id,
        redirectTarget: '_self',
      });

      // If redirectTarget is '_self', the page navigates away — this code won't run.
      // It only runs for '_modal' (desktop).
      if (result?.error) {
        toast.error(result.error.message || 'Payment was not completed. Please try again.');
        setLoading(false);
        return { success: false, alreadyPaid: false };
      }

      if (!result?.error) {
        toast.success('Payment submitted. Status will update shortly after confirmation.');
        queryClient.invalidateQueries({ queryKey: ['parent-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['fee-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['parent-data'] });
        setLoading(false);
        return { success: true, orderId: sessionData.cf_order_id };
      }

      setLoading(false);
      return { success: false, alreadyPaid: false };
    } catch (err: any) {
      console.error('Cashfree payment error:', err);
      toast.error('Payment failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
      return { success: false, alreadyPaid: false };
    }
  }, [queryClient]);

  return { initiatePayment, loading };
}
