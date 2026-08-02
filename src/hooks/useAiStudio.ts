import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/api';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export type GenerationType =
  | 'homework'
  | 'circular'
  | 'notice'
  | 'report_card_remarks'
  | 'timetable'
  | 'lesson_plan';

export interface AiGeneration {
  id: string;
  school_id: string;
  generation_type: GenerationType;
  title: string;
  content: string;
  status: 'draft' | 'approved' | 'published' | 'discarded';
  class_name: string | null;
  section: string | null;
  subject: string | null;
  model: string | null;
  metadata: any;
  created_at: string;
}

export const GENERATION_LABELS: Record<GenerationType, string> = {
  homework: 'Homework',
  circular: 'Circular',
  notice: 'Notice',
  report_card_remarks: 'Report Card Remarks',
  timetable: 'Timetable Draft',
  lesson_plan: 'Lesson Plan',
};

export function useAiStudio(typeFilter?: GenerationType | 'all') {
  const schoolId = useEffectiveSchoolId();
  const qc = useQueryClient();
  const key = ['ai-generations', schoolId, typeFilter ?? 'all'];

  const list = useQuery({
    queryKey: key,
    enabled: !!schoolId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('ai_generations' as any)
        .select('id, school_id, generation_type, title, content, status, class_name, section, subject, model, metadata, created_at')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (typeFilter && typeFilter !== 'all') q = q.eq('generation_type', typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as AiGeneration[];
    },
  });

  const generate = useMutation({
    mutationFn: async (vars: { generationType: GenerationType; params: Record<string, any> }) => {
      const res = await invokeEdgeFunction<{ generation: AiGeneration }>(
        'ai-generate',
        { generationType: vars.generationType, params: { ...vars.params, school_id: schoolId } },
        { timeoutMs: 60_000, maxRetries: 0, skipDedupe: true },
      );
      return res.generation;
    },
    onSuccess: () => {
      toast.success('Draft ready');
      qc.invalidateQueries({ queryKey: ['ai-generations', schoolId] });
    },
    onError: (e: any) => toast.error(e?.message || 'Generation failed'),
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: AiGeneration['status'] }) => {
      const { error } = await supabase
        .from('ai_generations' as any)
        .update({ status: vars.status })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-generations', schoolId] }),
    onError: (e: any) => toast.error(e?.message || 'Update failed'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_generations' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Draft deleted');
      qc.invalidateQueries({ queryKey: ['ai-generations', schoolId] });
    },
    onError: (e: any) => toast.error(e?.message || 'Delete failed'),
  });

  return { schoolId, generations: list.data ?? [], isLoading: list.isLoading, generate, setStatus, remove };
}
