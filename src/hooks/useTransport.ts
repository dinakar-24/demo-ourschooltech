import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from './useEffectiveSchoolId';
import { toast } from 'sonner';

export interface TransportRoute {
  id: string;
  school_id: string;
  route_name: string;
  route_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
  capacity: number;
  start_location: string | null;
  end_location: string | null;
  stops: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentTransport {
  id: string;
  student_id: string;
  route_id: string;
  school_id: string;
  pickup_stop: string | null;
  drop_stop: string | null;
  boarding_type: string;
  created_at: string;
  student?: { full_name: string; class_name: string; section: string; admission_number: string };
  route?: TransportRoute;
}

export function useTransportRoutes() {
  const schoolId = useEffectiveSchoolId();
  return useQuery({
    queryKey: ['transport-routes', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('school_id', schoolId)
        .order('route_name');
      if (error) throw error;
      return data as TransportRoute[];
    },
    enabled: !!schoolId,
  });
}

export function useStudentTransport(routeId?: string) {
  const schoolId = useEffectiveSchoolId();
  return useQuery({
    queryKey: ['student-transport', schoolId, routeId],
    queryFn: async () => {
      if (!schoolId) return [];
      let query = supabase
        .from('student_transport')
        .select('*, student:students(full_name, class_name, section, admission_number), route:transport_routes(route_name, route_number, vehicle_number, driver_name, driver_phone)')
        .eq('school_id', schoolId);
      if (routeId) query = query.eq('route_id', routeId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as StudentTransport[];
    },
    enabled: !!schoolId,
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (route: Partial<TransportRoute>) => {
      const { data, error } = await supabase.from('transport_routes').insert(route as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }); toast.success('Route created'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<TransportRoute> & { id: string }) => {
      const { data, error } = await supabase.from('transport_routes').update(rest as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }); toast.success('Route updated'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transport_routes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }); toast.success('Route deleted'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAssignStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { student_id: string; route_id: string; school_id: string; pickup_stop?: string; drop_stop?: string; boarding_type?: string }) => {
      const { error } = await supabase.from('student_transport').insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student-transport'] }); toast.success('Student assigned to route'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRemoveStudentTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('student_transport').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student-transport'] }); toast.success('Student removed from route'); },
    onError: (e: any) => toast.error(e.message),
  });
}
