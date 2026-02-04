import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChildInfo {
  id: string;
  full_name: string;
  class_name: string;
  section: string;
  roll_number: number | null;
  admission_number: string;
  parent_name: string | null;
  parent_email: string | null;
}

export interface ChildAttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export interface ChildFeeStats {
  pending: number;
  paid: number;
  overdue: number;
}

export function useParentChild() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['parent-child', user?.id],
    queryFn: async (): Promise<ChildInfo | null> => {
      if (!user?.id) return null;

      // Get parent's email from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.email) return null;

      // Find student linked to this parent's email
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_email', profile.email)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return student as ChildInfo | null;
    },
    enabled: !!user?.id,
  });
}

export function useChildAttendanceStats(studentId?: string) {
  return useQuery({
    queryKey: ['child-attendance-stats', studentId],
    queryFn: async (): Promise<ChildAttendanceStats> => {
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

export function useChildFeeStats(studentId?: string) {
  return useQuery({
    queryKey: ['child-fee-stats', studentId],
    queryFn: async (): Promise<ChildFeeStats> => {
      if (!studentId) throw new Error('No student ID');

      const { data, error } = await supabase
        .from('fees')
        .select('amount, status, due_date')
        .eq('student_id', studentId);

      if (error) throw error;

      const now = new Date();
      const pending = data?.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const paid = data?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const overdue = data?.filter(f => f.status === 'pending' && new Date(f.due_date) < now).reduce((sum, f) => sum + Number(f.amount), 0) || 0;

      return { pending, paid, overdue };
    },
    enabled: !!studentId,
  });
}

export function useChildHomework(studentId?: string, className?: string, section?: string) {
  return useQuery({
    queryKey: ['child-homework', studentId, className, section],
    queryFn: async () => {
      if (!className) throw new Error('No class name');

      // Get class ID
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('name', className)
        .single();

      if (classError) return [];

      // Get homework for this class
      let query = supabase
        .from('homework')
        .select(`
          *,
          class:classes(id, name),
          section:sections(id, name)
        `)
        .eq('class_id', classData.id)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter by section if specified
      return data?.filter(hw => !hw.section_id || hw.section?.name === section) || [];
    },
    enabled: !!className,
  });
}

export function useChildAnnouncements(schoolId?: string) {
  return useQuery({
    queryKey: ['child-announcements', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });
}
