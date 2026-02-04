import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Teacher {
  id: string;
  user_id: string | null;
  school_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  employee_id: string;
  subjects: string[] | null;
  classes: string[] | null;
  qualification: string | null;
  joining_date: string | null;
  created_at: string;
}

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');

  const fetchTeachers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const deleteTeacher = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) {
      return false;
    }

    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Teacher deleted successfully');
      await fetchTeachers();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete teacher';
      toast.error(errorMessage);
      return false;
    }
  }, [fetchTeachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch = !searchQuery || 
        teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSubject = selectedSubject === 'All Subjects' || 
        (teacher.subjects && teacher.subjects.includes(selectedSubject));
      
      return matchesSearch && matchesSubject;
    });
  }, [teachers, searchQuery, selectedSubject]);

  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    teachers.forEach(t => {
      t.subjects?.forEach(s => allSubjects.add(s));
    });
    return ['All Subjects', ...Array.from(allSubjects).sort()];
  }, [teachers]);

  return {
    teachers: filteredTeachers,
    allTeachers: teachers,
    loading,
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    subjects,
    deleteTeacher,
    refetch: fetchTeachers,
  };
}
