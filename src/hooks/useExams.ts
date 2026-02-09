import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';

export interface Exam {
  id: string;
  name: string;
  subject: string;
  class_name: string;
  exam_date: string;
  max_marks: number;
  school_id: string;
  created_at: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  grade: string | null;
  remarks: string | null;
  created_at: string;
  student?: {
    full_name: string;
    admission_number: string;
  };
}

export interface ExamFormData {
  name: string;
  subject: string;
  class_name: string;
  exam_date: string;
  max_marks: number;
}

interface ExamFilters {
  className?: string;
  subject?: string;
  search?: string;
  status?: 'upcoming' | 'completed' | 'all';
  page?: number;
  pageSize?: number;
}

export interface PaginatedExams {
  data: Exam[];
  totalCount: number;
}

export function useExams(filters?: ExamFilters) {
  const schoolId = useEffectiveSchoolId();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: ['exams', schoolId, filters],
    queryFn: async (): Promise<PaginatedExams> => {
      if (!schoolId) throw new Error('No school ID');

      let query = supabase
        .from('exams')
        .select('*', { count: 'exact' })
        .eq('school_id', schoolId)
        .order('exam_date', { ascending: false });

      if (filters?.className && filters.className !== 'All Classes') {
        query = query.eq('class_name', filters.className);
      }

      if (filters?.subject && filters.subject !== 'All Subjects') {
        query = query.eq('subject', filters.subject);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      const today = new Date().toISOString().split('T')[0];
      if (filters?.status === 'upcoming') {
        query = query.gte('exam_date', today);
      } else if (filters?.status === 'completed') {
        query = query.lt('exam_date', today);
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data || []) as Exam[], totalCount: count || 0 };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExamStats() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['exam-stats', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const [totalResult, upcomingResult, thisMonthResult] = await Promise.all([
        supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId),
        supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .gte('exam_date', today),
        supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .gte('exam_date', monthStartStr),
      ]);

      return {
        total: totalResult.count || 0,
        upcoming: upcomingResult.count || 0,
        completed: (totalResult.count || 0) - (upcomingResult.count || 0),
        thisMonth: thisMonthResult.count || 0,
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (formData: ExamFormData) => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('exams')
        .insert({ ...formData, school_id: schoolId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
      toast.success('Exam created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create exam');
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: Partial<ExamFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('exams')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
      toast.success('Exam updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update exam');
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
      toast.success('Exam deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete exam');
    },
  });
}

export function useExamResults(examId: string) {
  return useQuery({
    queryKey: ['exam-results', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`*, student:students(full_name, admission_number)`)
        .eq('exam_id', examId);

      if (error) throw error;
      return data as ExamResult[];
    },
    enabled: !!examId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      examId,
      studentId,
      marksObtained,
      grade,
      remarks,
    }: {
      examId: string;
      studentId: string;
      marksObtained: number;
      grade?: string;
      remarks?: string;
    }) => {
      const { data: existing } = await supabase
        .from('results')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('results')
          .update({ marks_obtained: marksObtained, grade, remarks })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('results')
          .insert({ exam_id: examId, student_id: studentId, marks_obtained: marksObtained, grade, remarks });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-results', variables.examId] });
      toast.success('Result saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save result');
    },
  });
}
