import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useExams() {
  const { school } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    thisMonth: 0,
  });

  const fetchExams = useCallback(async () => {
    if (!school?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('exam_date', { ascending: false });

      if (error) throw error;

      setExams(data || []);

      // Calculate stats
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const upcoming = (data || []).filter(e => new Date(e.exam_date) > today).length;
      const completed = (data || []).filter(e => new Date(e.exam_date) < today).length;
      const thisMonth = (data || []).filter(e => new Date(e.exam_date) >= monthStart).length;

      setStats({
        total: data?.length || 0,
        upcoming,
        completed,
        thisMonth,
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [school?.id]);

  const createExam = async (formData: ExamFormData) => {
    if (!school?.id) {
      toast.error('No school selected');
      return false;
    }

    try {
      const { error } = await supabase
        .from('exams')
        .insert({
          ...formData,
          school_id: school.id,
        });

      if (error) throw error;

      toast.success('Exam created successfully');
      await fetchExams();
      return true;
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam');
      return false;
    }
  };

  const updateExam = async (id: string, formData: Partial<ExamFormData>) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Exam updated successfully');
      await fetchExams();
      return true;
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('Failed to update exam');
      return false;
    }
  };

  const deleteExam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Exam deleted successfully');
      await fetchExams();
      return true;
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
      return false;
    }
  };

  const getExamResults = async (examId: string): Promise<ExamResult[]> => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          student:students(full_name, admission_number)
        `)
        .eq('exam_id', examId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
      return [];
    }
  };

  const saveResult = async (examId: string, studentId: string, marksObtained: number, grade?: string, remarks?: string) => {
    try {
      // Check if result exists
      const { data: existing } = await supabase
        .from('results')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('results')
          .update({
            marks_obtained: marksObtained,
            grade,
            remarks,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('results')
          .insert({
            exam_id: examId,
            student_id: studentId,
            marks_obtained: marksObtained,
            grade,
            remarks,
          });

        if (error) throw error;
      }

      toast.success('Result saved');
      return true;
    } catch (error) {
      console.error('Error saving result:', error);
      toast.error('Failed to save result');
      return false;
    }
  };

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return {
    exams,
    loading,
    stats,
    fetchExams,
    createExam,
    updateExam,
    deleteExam,
    getExamResults,
    saveResult,
  };
}
