import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PaymentConfig {
  onlineEnabled: boolean;
  manualEnabled: boolean;
  isConnected: boolean;
  extraChargePct: number;
}

export function usePaymentConfig(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['payment-config', schoolId],
    enabled: !!schoolId,
    queryFn: async (): Promise<PaymentConfig> => {
      // Get global settings
      const { data: globalSettings } = await (supabase
        .from('system_settings' as any)
        .select('value')
        .eq('key', 'payment_config')
        .single() as any);

      const globalConfig = (globalSettings?.value as any) ?? {
        online_enabled: true,
        manual_enabled: true,
        extra_charge_pct: 0,
      };

      // Get school-specific config
      const { data: schoolConfig } = await (supabase
        .from('school_payment_config' as any)
        .select('online_enabled, manual_enabled, is_connected, connection_status, extra_charge_override, super_admin_override_online, super_admin_override_manual, locked_by_super_admin')
        .eq('school_id', schoolId)
        .maybeSingle() as any);

      const sc = schoolConfig as any;

      // Resolve effective settings: super_admin overrides > school settings > global
      let onlineEnabled = globalConfig.online_enabled;
      let manualEnabled = globalConfig.manual_enabled;

      if (sc) {
        // Apply school-level settings
        onlineEnabled = onlineEnabled && sc.online_enabled;
        manualEnabled = manualEnabled && sc.manual_enabled;

        // Super admin overrides take precedence
        if (sc.super_admin_override_online !== null && sc.super_admin_override_online !== undefined) {
          onlineEnabled = sc.super_admin_override_online;
        }
        if (sc.super_admin_override_manual !== null && sc.super_admin_override_manual !== undefined) {
          manualEnabled = sc.super_admin_override_manual;
        }
      }

      const isConnected = sc?.is_connected ?? false;
      const extraChargePct = sc?.extra_charge_override ?? globalConfig.extra_charge_pct ?? 0;

      return {
        onlineEnabled: onlineEnabled && isConnected,
        manualEnabled,
        isConnected,
        extraChargePct,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
