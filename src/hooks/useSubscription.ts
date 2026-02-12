import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Subscription {
  id: string;
  school_id: string;
  razorpay_account_id: string | null;
  plan_type: string;
  student_count: number;
  price_per_student: number;
  total_amount: number;
  status: 'active' | 'expired' | 'pending' | 'trial';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  school_id: string;
  amount: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: 'pending' | 'success' | 'failed';
  paid_at: string | null;
  created_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('school_id', user.schoolId)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.schoolId,
  });
}

export function useAllSubscriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: async () => {
      // This is for super admin to see all subscriptions
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          school:schools(id, name, code, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: user?.role === 'super_admin',
  });
}

export function useSubscriptionPayments(schoolId?: string) {
  const { user } = useAuth();
  const targetSchoolId = schoolId || user?.schoolId;

  return useQuery({
    queryKey: ['subscription-payments', targetSchoolId],
    queryFn: async () => {
      if (!targetSchoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('school_id', targetSchoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubscriptionPayment[];
    },
    enabled: !!targetSchoolId,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      schoolId, 
      razorpayAccountId,
      studentCount,
    }: { 
      schoolId: string;
      razorpayAccountId?: string;
      studentCount?: number;
    }) => {
      // Fetch actual student count from DB for accuracy
      let count = studentCount || 0;
      if (!studentCount) {
        const { count: dbCount } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('status', 'active');
        count = dbCount || 0;
      }

      const pricePerStudent = 250;
      const totalAmount = count * pricePerStudent;

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          school_id: schoolId,
          razorpay_account_id: razorpayAccountId || null,
          plan_type: 'yearly',
          student_count: count,
          price_per_student: pricePerStudent,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      toast.success('Subscription created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create subscription');
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<Subscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      toast.success('Subscription updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update subscription');
    },
  });
}

export function useSubscriptionStatus() {
  const { data: subscription, isLoading } = useSubscription();

  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';
  const daysRemaining = subscription?.end_date 
    ? Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    subscription,
    isLoading,
    isActive,
    isExpired,
    daysRemaining,
    isNearExpiry: daysRemaining > 0 && daysRemaining <= 30,
  };
}
