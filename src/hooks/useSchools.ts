import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';

export interface School {
  id: string;
  name: string;
  code: string;
  subdomain: string;
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
  subdomain: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo: string;
  primary_color: string;
  accent_color: string;
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
        .select('id, name, code, subdomain, address, city, phone, email, logo, is_active, student_limit, subscription_status, primary_color, accent_color, created_at', { count: 'exact' })
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
      const { data, error } = await supabase.rpc('get_distinct_cities' as any);

      if (error) throw error;

      const cities = (data as unknown as string[]) || [];
      return ['All Cities', ...cities];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: SchoolFormData & { logoPreview?: string | null }) => {
      const schoolData: Record<string, unknown> = {
        name: formData.name,
        code: formData.code,
        subdomain: formData.subdomain,
        address: formData.address,
        city: formData.city,
        phone: formData.phone || null,
        email: formData.email || null,
        logo: formData.logoPreview || formData.logo || null,
        primary_color: formData.primary_color || '#0F766E',
        accent_color: formData.accent_color || '#E69500',
        is_active: true,
      };

      const { data, error } = await supabase
        .from('schools')
        .insert(schoolData as any)
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
      const { data, error } = await supabase.functions.invoke('delete-school', {
        body: { school_id: schoolId },
      });
      if (error) throw new Error(error.message || 'Failed to delete school');
      if (data && !data.success) throw new Error(data.error || 'Failed to delete school');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      queryClient.invalidateQueries({ queryKey: ['school-cities'] });
      toast.success(data?.message || 'School and all associated data deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete school');
    },
  });
}

export function useToggleSchoolStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, isActive }: { schoolId: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('toggle-school-status', {
        body: { school_id: schoolId, is_active: isActive },
      });
      if (error) throw new Error(error.message || 'Failed to update school status');
      if (data && !data.success) throw new Error(data.error || 'Failed to update school status');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      toast.success(data?.message || 'School status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school status');
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
