import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/api';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { sendNotification } from '@/lib/send-notification';

export type PredictionType = 'fee_default' | 'attendance' | 'performance';

export interface AiPrediction {
  id: string;
  student_id: string;
  prediction_type: PredictionType;
  risk_score: number;
  risk_band: 'low' | 'medium' | 'high';
  reasons: string[];
  metrics: Record<string, any>;
  recommendation: string | null;
  computed_at: string;
  student?: { full_name: string; class_name: string; section: string; parent_user_id: string | null } | null;
}

export interface AiUsageSummary {
  total_calls: number;
  total_tokens_in: number;
  total_tokens_out: number;
  estimated_cost: number;
  by_feature: { feature: string; calls: number; tokens: number }[];
}

export function useAiInsights(type: PredictionType) {
  const schoolId = useEffectiveSchoolId();
  const qc = useQueryClient();

  const predictions = useQuery({
    queryKey: ['ai-predictions', schoolId, type],
    enabled: !!schoolId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_predictions' as any)
        .select('id, student_id, prediction_type, risk_score, risk_band, reasons, metrics, recommendation, computed_at, students(full_name, class_name, section, parent_user_id)')
        .eq('school_id', schoolId)
        .eq('prediction_type', type)
        .order('risk_score', { ascending: false })
        .limit(100);
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({ ...r, student: r.students })) as AiPrediction[];
    },
  });

  const usage = useQuery({
    queryKey: ['ai-usage-summary', schoolId],
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ai_usage_summary' as any, { _school_id: schoolId, _days: 30 });
      if (error) throw error;
      return data as unknown as AiUsageSummary;
    },
  });

  const runPredictions = useMutation({
    mutationFn: async () =>
      invokeEdgeFunction<{ computed: number; breakdown?: Record<string, number> }>(
        'ai-predict',
        { school_id: schoolId },
        { timeoutMs: 120_000, maxRetries: 0, skipDedupe: true },
      ),
    onSuccess: (res) => {
      toast.success(`Scored ${res?.computed ?? 0} risk records`);
      qc.invalidateQueries({ queryKey: ['ai-predictions', schoolId] });
      qc.invalidateQueries({ queryKey: ['ai-usage-summary', schoolId] });
    },
    onError: (e: any) => toast.error(e?.message || 'Prediction run failed'),
  });

  const notifyParent = useMutation({
    mutationFn: async (p: AiPrediction) => {
      const parentId = p.student?.parent_user_id;
      if (!parentId) throw new Error('No parent account linked to this student.');
      const name = p.student?.full_name || 'your child';
      const title =
        p.prediction_type === 'fee_default'
          ? 'Fee payment reminder'
          : p.prediction_type === 'attendance'
            ? 'Attendance concern'
            : 'Academic progress update';
      const body =
        p.prediction_type === 'fee_default'
          ? `A fee balance is pending for ${name}. Please clear it at the earliest to avoid late charges.`
          : p.prediction_type === 'attendance'
            ? `${name}'s attendance has dropped recently. Please ensure regular attendance.`
            : `${name} may need extra academic support. Please connect with the class teacher.`;
      await sendNotification({
        userIds: [parentId],
        title,
        body,
        type: p.prediction_type === 'fee_default' ? 'fee' : 'general',
        schoolId: schoolId || undefined,
      });
    },
    onSuccess: () => toast.success('Parent notified'),
    onError: (e: any) => toast.error(e?.message || 'Could not notify parent'),
  });

  return {
    schoolId,
    predictions: predictions.data ?? [],
    isLoading: predictions.isLoading,
    lastComputedAt: predictions.data?.[0]?.computed_at ?? null,
    usage: usage.data,
    runPredictions,
    notifyParent,
  };
}
