import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface SupportQuery {
  id: string;
  school_id: string;
  submitted_by: string;
  submitter_name: string | null;
  submitter_role: string | null;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueryResponse {
  id: string;
  query_id: string;
  responded_by: string;
  responder_name: string | null;
  response: string;
  created_at: string;
}

export function useSupportQueryList(isAdmin = false) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['support-queries', schoolId, isAdmin],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');
      let query = supabase
        .from('support_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (isAdmin) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupportQuery[];
    },
    enabled: !!schoolId,
  });
}

export function useQueryResponses(queryId?: string) {
  return useQuery({
    queryKey: ['query-responses', queryId],
    queryFn: async () => {
      if (!queryId) return [];
      const { data, error } = await supabase
        .from('query_responses')
        .select('*')
        .eq('query_id', queryId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as QueryResponse[];
    },
    enabled: !!queryId,
  });
}

export function useSubmitQuery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (data: { subject: string; description: string; category: string; priority: string }) => {
      if (!schoolId || !user) throw new Error('Not authenticated');

      // Generate ticket number
      const { data: ticketNum, error: ticketErr } = await supabase.rpc('generate_ticket_number', { _school_id: schoolId });
      if (ticketErr) throw ticketErr;

      const { error } = await supabase.from('support_queries').insert({
        school_id: schoolId,
        submitted_by: user.id,
        submitter_name: user.name,
        submitter_role: user.role,
        ticket_number: ticketNum,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-queries'] });
      toast.success('Query submitted successfully');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRespondToQuery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ queryId, response }: { queryId: string; response: string }) => {
      const { error: respErr } = await supabase.from('query_responses').insert({
        query_id: queryId,
        responded_by: user?.id || '',
        responder_name: user?.name || null,
        response,
      });
      if (respErr) throw respErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['query-responses'] });
      toast.success('Response sent');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateQueryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('support_queries').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-queries'] });
      toast.success('Status updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
