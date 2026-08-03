import { useMutation } from '@tanstack/react-query';
import { invokeEdgeFunction } from '@/lib/api';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface AnalyticsAnswer {
  question: string;
  answer: string;
  tools: string[];
  at: string;
}

export interface InsightCard {
  question: string;
  answer: string;
  tools: string[];
}

export function useAiAnalytics() {
  const schoolId = useEffectiveSchoolId();

  const ask = useMutation({
    mutationFn: async (question: string) => {
      const res = await invokeEdgeFunction<{ answer: string; tools: string[] }>(
        'ai-analytics',
        { mode: 'ask', question, school_id: schoolId },
        { timeoutMs: 90_000, maxRetries: 0, skipDedupe: true },
      );
      return { question, answer: res.answer, tools: res.tools ?? [], at: new Date().toISOString() } as AnalyticsAnswer;
    },
    onError: (e: any) => toast.error(e?.message || 'Could not answer that question'),
  });

  const insights = useMutation({
    mutationFn: async () => {
      const res = await invokeEdgeFunction<{ cards: InsightCard[]; generated_at: string }>(
        'ai-analytics',
        { mode: 'insights', school_id: schoolId },
        { timeoutMs: 180_000, maxRetries: 0, skipDedupe: true },
      );
      return res;
    },
    onSuccess: () => toast.success('Weekly insights refreshed'),
    onError: (e: any) => toast.error(e?.message || 'Could not generate insights'),
  });

  return { schoolId, ask, insights };
}