import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PaymentSubmission {
  id: string;
  school_id: string;
  invoice_id: string;
  student_id: string;
  submitted_by: string;
  amount: number;
  payment_method: string | null;
  transaction_id: string;
  screenshot_url: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  notes: string | null;
  // joined
  student?: { full_name: string; admission_number: string; class_name: string; section: string };
  invoice?: { total_amount: number; balance: number; due_date: string; term?: { name: string } };
}

/** Admin: fetch pending submissions for their school */
export function usePaymentSubmissions(status?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payment-submissions', status],
    queryFn: async (): Promise<PaymentSubmission[]> => {
      let q = supabase
        .from('payment_submissions')
        .select(`
          *,
          student:students(full_name, admission_number, class_name, section),
          invoice:fee_invoices(total_amount, balance, due_date, term:fee_terms(name))
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        q = q.eq('status', status);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as PaymentSubmission[];
    },
    enabled: !!user,
  });
}

/** Parent: fetch own submissions for a student */
export function useParentPaymentSubmissions(studentId?: string) {
  return useQuery({
    queryKey: ['parent-payment-submissions', studentId],
    queryFn: async (): Promise<PaymentSubmission[]> => {
      const { data, error } = await supabase
        .from('payment_submissions')
        .select('*')
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PaymentSubmission[];
    },
    enabled: !!studentId,
  });
}

/** Parent: submit payment proof */
export function useSubmitPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      school_id: string;
      invoice_id: string;
      student_id: string;
      amount: number;
      payment_method: string;
      transaction_id: string;
      screenshot_url?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('payment_submissions').insert({
        ...params,
        submitted_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payment proof submitted! Admin will verify shortly.');
      qc.invalidateQueries({ queryKey: ['parent-payment-submissions'] });
      qc.invalidateQueries({ queryKey: ['parent-invoices'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Admin: approve a submission (calls record_fee_payment RPC) */
export function useApproveSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submission: PaymentSubmission) => {
      // 1. Record the payment via existing RPC
      const { error: rpcError } = await supabase.rpc('record_fee_payment', {
        _school_id: submission.school_id,
        _invoice_id: submission.invoice_id,
        _student_id: submission.student_id,
        _amount: submission.amount,
        _payment_method: submission.payment_method || 'upi',
        _transaction_id: submission.transaction_id,
        _notes: `Verified from parent submission. ${submission.notes || ''}`.trim(),
      });
      if (rpcError) throw rpcError;

      // 2. Update submission status
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('payment_submissions')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payment approved and receipt generated!');
      qc.invalidateQueries({ queryKey: ['payment-submissions'] });
      qc.invalidateQueries({ queryKey: ['fee-invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice-stats'] });
    },
    onError: (e: Error) => toast.error(`Approval failed: ${e.message}`),
  });
}

/** Admin: reject a submission with reason */
export function useRejectSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('payment_submissions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Submission rejected.');
      qc.invalidateQueries({ queryKey: ['payment-submissions'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
