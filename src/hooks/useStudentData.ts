import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentProfile {
  id: string;
  full_name: string;
  class_name: string;
  section: string;
  roll_number: number | null;
  admission_number: string;
  school_id: string;
  avatar_url: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  alternate_phone: string | null;
}

export interface StudentAttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export function useStudentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async (): Promise<StudentProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as StudentProfile | null;
    },
    enabled: !!user?.id,
  });
}

export function useStudentAttendanceStats(studentId?: string) {
  return useQuery({
    queryKey: ['student-attendance-stats', studentId],
    queryFn: async (): Promise<StudentAttendanceStats> => {
      if (!studentId) throw new Error('No student ID');

      // Get current month's attendance
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId)
        .gte('date', startOfMonthStr);

      if (error) throw error;

      const present = data?.filter(a => a.status === 'present').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      const late = data?.filter(a => a.status === 'late').length || 0;
      const total = data?.length || 0;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100 * 10) / 10 : 0;

      return { present, absent, late, total, percentage };
    },
    enabled: !!studentId,
  });
}

export function useStudentHomework(className?: string, section?: string) {
  return useQuery({
    queryKey: ['student-homework', className, section],
    queryFn: async () => {
      if (!className) return [];

      // Get class ID
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('name', className)
        .single();

      if (classError) return [];

      // Get homework for this class
      const { data, error } = await supabase
        .from('homework')
        .select(`
          *,
          class:classes(id, name),
          section:sections(id, name)
        `)
        .eq('class_id', classData.id)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Filter by section if specified
      return data?.filter(hw => !hw.section_id || hw.section?.name === section) || [];
    },
    enabled: !!className,
  });
}

export function useStudentResults(studentId?: string) {
  return useQuery({
    queryKey: ['student-results', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          exam:exams(id, name, subject, max_marks, exam_date)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}

export function useStudentAnnouncements(schoolId?: string, className?: string) {
  return useQuery({
    queryKey: ['student-announcements', schoolId, className],
    queryFn: async () => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Filter by target class if specified
      return data?.filter(a => 
        !a.target_classes || a.target_classes.length === 0 || a.target_classes.includes(className)
      ) || [];
    },
    enabled: !!schoolId,
  });
}
