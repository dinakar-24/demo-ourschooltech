import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SettingsMap = Record<string, Record<string, any>>;

export function useSystemSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('key, value');
      if (error) throw error;
      const map: SettingsMap = {};
      (data as any[])?.forEach((row: { key: string; value: any }) => {
        map[row.key] = row.value;
      });
      return map;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { error } = await supabase
        .from('system_settings' as any)
        .update({ value, updated_by: (await supabase.auth.getUser()).data.user?.id } as any)
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const getSetting = <T extends Record<string, any>>(key: string, fallback: T): T => {
    return (settings?.[key] as T) ?? fallback;
  };

  return {
    settings,
    isLoading,
    getSetting,
    updateSetting,
  };
}
