import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
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

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, code, address, city, phone, email, logo, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const saveSchool = useCallback(async (
    formData: SchoolFormData,
    logoPreview: string | null,
    editingSchool: School | null
  ) => {
    setIsSubmitting(true);
    try {
      const schoolData = {
        name: formData.name,
        code: formData.code,
        address: formData.address,
        city: formData.city,
        phone: formData.phone || null,
        email: formData.email || null,
        logo: logoPreview || formData.logo || null,
      };

      if (editingSchool) {
        const { error } = await supabase
          .from('schools')
          .update(schoolData)
          .eq('id', editingSchool.id);

        if (error) throw error;
        toast.success('School updated successfully');
      } else {
        const { error } = await supabase
          .from('schools')
          .insert(schoolData);

        if (error) throw error;
        toast.success('School added successfully');
      }

      await fetchSchools();
      return true;
    } catch (error: any) {
      console.error('Error saving school:', error);
      toast.error(error.message || 'Failed to save school');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchSchools]);

  const deleteSchool = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return false;
    }

    try {
      const { error } = await supabase.from('schools').delete().eq('id', id);
      if (error) throw error;
      toast.success('School deleted successfully');
      await fetchSchools();
      return true;
    } catch (error: any) {
      console.error('Error deleting school:', error);
      toast.error(error.message || 'Failed to delete school');
      return false;
    }
  }, [fetchSchools]);

  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.code.toLowerCase().includes(query) ||
        school.city.toLowerCase().includes(query)
    );
  }, [schools, searchQuery]);

  return {
    schools: filteredSchools,
    loading,
    searchQuery,
    setSearchQuery,
    saveSchool,
    deleteSchool,
    isSubmitting,
  };
}
