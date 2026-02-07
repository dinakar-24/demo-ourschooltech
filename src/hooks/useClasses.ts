import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface Section {
  id: string;
  class_id: string;
  school_id: string;
  name: string;
  class_teacher_id: string | null;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    full_name: string;
  } | null;
  student_count?: number;
}

export interface ClassWithSections {
  id: string;
  school_id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  sections: Section[];
}

export function useClasses() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .order('display_order', { ascending: true });

      if (classesError) throw classesError;

      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select(`
          *,
          teacher:teachers(id, full_name)
        `)
        .eq('school_id', schoolId);

      if (sectionsError) throw sectionsError;

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('class_name, section')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;

      const studentCounts: Record<string, number> = {};
      students?.forEach(s => {
        const key = `${s.class_name}-${s.section}`;
        studentCounts[key] = (studentCounts[key] || 0) + 1;
      });

      const classesWithSections: ClassWithSections[] = (classes || []).map(cls => ({
        ...cls,
        sections: (sections || [])
          .filter(sec => sec.class_id === cls.id)
          .map(sec => ({
            ...sec,
            student_count: studentCounts[`${cls.name}-${sec.name}`] || 0,
          })),
      }));

      return classesWithSections;
    },
    enabled: !!schoolId,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async ({ name, displayOrder, sections }: { 
      name: string; 
      displayOrder?: number;
      sections?: string[];
    }) => {
      if (!schoolId) throw new Error('No school ID');

      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          school_id: schoolId,
          name,
          display_order: displayOrder || 0,
        })
        .select()
        .single();

      if (classError) throw classError;

      if (sections && sections.length > 0) {
        const sectionsToInsert = sections.map(sectionName => ({
          class_id: newClass.id,
          school_id: schoolId,
          name: sectionName,
        }));

        const { error: sectionsError } = await supabase
          .from('sections')
          .insert(sectionsToInsert);

        if (sectionsError) throw sectionsError;
      }

      return newClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create class');
    },
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async ({ classId, name, classTeacherId }: { 
      classId: string; 
      name: string;
      classTeacherId?: string;
    }) => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('sections')
        .insert({
          class_id: classId,
          school_id: schoolId,
          name,
          class_teacher_id: classTeacherId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Section added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add section');
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, classTeacherId }: { 
      id: string; 
      classTeacherId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('sections')
        .update({ class_teacher_id: classTeacherId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Section updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update section');
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete class');
    },
  });
}
