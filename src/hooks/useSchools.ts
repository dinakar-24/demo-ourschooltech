import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  is_active: boolean | null;
  student_limit: number | null;
  subscription_status: string | null;
  created_at: string;
}

export interface SchoolFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo: string;
}

interface SchoolFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  city?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSchools {
  data: School[];
  totalCount: number;
}

export function useSchools(filters?: SchoolFilters) {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: ['schools', filters],
    queryFn: async (): Promise<PaginatedSchools> => {
      let query = supabase
        .from('schools')
        .select('id, name, code, address, city, phone, email, logo, is_active, student_limit, subscription_status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }

      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (filters?.city && filters.city !== 'All Cities') {
        query = query.eq('city', filters.city);
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data || []) as School[], totalCount: count || 0 };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchoolStats() {
  return useQuery({
    queryKey: ['school-stats'],
    queryFn: async () => {
      const [totalResult, activeResult] = await Promise.all([
        supabase.from('schools').select('*', { count: 'exact', head: true }),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: (totalResult.count || 0) - (activeResult.count || 0),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchoolCities() {
  return useQuery({
    queryKey: ['school-cities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('city');

      if (error) throw error;

      const cities = new Set<string>();
      data?.forEach(s => {
        if (s.city) cities.add(s.city);
      });

      return ['All Cities', ...Array.from(cities).sort()];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: SchoolFormData & { logoPreview?: string | null }) => {
      const schoolData = {
        name: formData.name,
        code: formData.code,
        address: formData.address,
        city: formData.city,
        phone: formData.phone || null,
        email: formData.email || null,
        logo: formData.logoPreview || formData.logo || null,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('schools')
        .insert(schoolData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      queryClient.invalidateQueries({ queryKey: ['school-cities'] });
      toast.success('School added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add school');
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, logoPreview, ...formData }: Partial<SchoolFormData> & { id: string; logoPreview?: string | null }) => {
      const updateData: Record<string, unknown> = { ...formData };
      if (logoPreview !== undefined) {
        updateData.logo = logoPreview || formData.logo || null;
      }

      const { data, error } = await supabase
        .from('schools')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-cities'] });
      toast.success('School updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school');
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schoolId: string) => {
      const { error } = await supabase.from('schools').delete().eq('id', schoolId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      queryClient.invalidateQueries({ queryKey: ['school-cities'] });
      toast.success('School deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete school');
    },
  });
}

// Legacy hook for backward compatibility
export function useSchoolsLegacy() {
  const { data: result, isLoading: loading } = useSchools();
  const schools = result?.data || [];
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();
  const deleteSchoolMutation = useDeleteSchool();

  const saveSchool = async (
    formData: SchoolFormData,
    logoPreview: string | null,
    editingSchool: School | null
  ) => {
    try {
      if (editingSchool) {
        await updateSchool.mutateAsync({ id: editingSchool.id, ...formData, logoPreview });
      } else {
        await createSchool.mutateAsync({ ...formData, logoPreview });
      }
      return true;
    } catch {
      return false;
    }
  };

  const deleteSchool = async (id: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return false;
    }
    try {
      await deleteSchoolMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    schools,
    loading,
    searchQuery: '',
    setSearchQuery: () => {},
    saveSchool,
    deleteSchool,
    isSubmitting: createSchool.isPending || updateSchool.isPending,
  };
}
