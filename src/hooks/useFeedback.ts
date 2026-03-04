import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface Feedback {
  id: string;
  school_id: string;
  submitted_by: string | null;
  submitter_name: string | null;
  submitter_role: string | null;
  rating: number;
  message: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackResponse {
  id: string;
  feedback_id: string;
  responded_by: string | null;
  response: string;
  created_at: string;
}

export function useFeedbackList(isAdmin = false) {
  const schoolId = useEffectiveSchoolId();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feedback', schoolId, isAdmin, user?.id],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (isAdmin) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.limit(30);
      if (error) throw error;
      return data as Feedback[];
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFeedbackResponses(feedbackId?: string) {
  return useQuery({
    queryKey: ['feedback-responses', feedbackId],
    queryFn: async () => {
      if (!feedbackId) return [];
      const { data, error } = await supabase
        .from('feedback_responses')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as FeedbackResponse[];
    },
    enabled: !!feedbackId,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (data: { rating: number; message: string; is_anonymous: boolean }) => {
      if (!schoolId || !user) throw new Error('Not authenticated');
      const { error } = await supabase.from('feedback').insert({
        school_id: schoolId,
        submitted_by: user.id,
        submitter_name: data.is_anonymous ? null : user.name,
        submitter_role: user.role,
        rating: data.rating,
        message: data.message,
        is_anonymous: data.is_anonymous,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Feedback submitted successfully');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRespondToFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ feedbackId, response }: { feedbackId: string; response: string }) => {
      const { error: respError } = await supabase.from('feedback_responses').insert({
        feedback_id: feedbackId,
        responded_by: user?.id,
        response,
      });
      if (respError) throw respError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-responses'] });
      toast.success('Response sent');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkFeedbackRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedback').update({ status: 'read' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}
