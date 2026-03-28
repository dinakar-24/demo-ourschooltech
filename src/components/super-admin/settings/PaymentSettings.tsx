import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Wifi, WifiOff, IndianRupee } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function PaymentSettings() {
  const { getSetting, updateSetting } = useSystemSettings();
  const queryClient = useQueryClient();

  const paymentConfig = getSetting('payment_config', {
    online_enabled: true,
    manual_enabled: true,
    extra_charge_pct: 2.0,
  });

  const [onlineEnabled, setOnlineEnabled] = useState(paymentConfig.online_enabled);
  const [manualEnabled, setManualEnabled] = useState(paymentConfig.manual_enabled);
  const [extraCharge, setExtraCharge] = useState(String(paymentConfig.extra_charge_pct));

  // Fetch all school payment configs
  const { data: schoolConfigs = [], isLoading: loadingSchools } = useQuery({
    queryKey: ['all-school-payment-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_payment_config' as any)
        .select('*, school:schools(name, code)');
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch all schools for the ones without config
  const { data: allSchools = [] } = useQuery({
    queryKey: ['all-schools-for-payment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const handleSaveGlobal = () => {
    const pct = parseFloat(extraCharge);
    if (isNaN(pct) || pct < 0 || pct > 10) {
      toast.error('Extra charge must be between 0% and 10%');
      return;
    }
    updateSetting.mutate({
      key: 'payment_config',
      value: {
        online_enabled: onlineEnabled,
        manual_enabled: manualEnabled,
        extra_charge_pct: pct,
      },
    });
  };

  const overrideMutation = useMutation({
    mutationFn: async ({ schoolId, field, value }: { schoolId: string; field: string; value: boolean | null }) => {
      const { error } = await supabase
        .from('school_payment_config' as any)
        .upsert({
          school_id: schoolId,
          [field]: value,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'school_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-school-payment-configs'] });
      toast.success('Override updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const schoolsWithConfig = allSchools.map(school => {
    const cfg = schoolConfigs.find((c: any) => c.school_id === school.id);
    return { ...school, config: cfg };
  });

  return (
    <div className="space-y-5">
      {/* Global Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4" />
            Global Payment Settings
          </CardTitle>
          <CardDescription className="text-xs">
            Control payment methods across all schools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Online Payments (Cashfree)</p>
              <p className="text-xs text-muted-foreground">Enable online payment gateway for schools</p>
            </div>
            <Switch checked={onlineEnabled} onCheckedChange={setOnlineEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manual Payments</p>
              <p className="text-xs text-muted-foreground">Allow UTR/transaction ID submissions</p>
            </div>
            <Switch checked={manualEnabled} onCheckedChange={setManualEnabled} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <IndianRupee className="w-3 h-3" /> Extra Charge % (Online)
            </Label>
            <Input
              type="number"
              value={extraCharge}
              onChange={(e) => setExtraCharge(e.target.value)}
              min={0}
              max={10}
              step={0.1}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Additional charge on online payments (0-10%)</p>
          </div>
          <Button size="sm" onClick={handleSaveGlobal} disabled={updateSetting.isPending}>
            {updateSetting.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save Global Settings
          </Button>
        </CardContent>
      </Card>

      {/* Per-School Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">School Payment Status</CardTitle>
          <CardDescription className="text-xs">View connection status and override settings per school.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSchools ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {schoolsWithConfig.map(school => (
                <div key={school.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {school.config?.is_connected ? (
                        <Wifi className="w-4 h-4 text-success" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{school.name}</p>
                      <p className="text-xs text-muted-foreground">{school.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {school.config?.is_connected ? (
                      <Badge className="bg-success text-success-foreground text-[10px]">Connected</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Not Set Up</Badge>
                    )}
                    {school.config?.online_enabled && (
                      <Badge variant="outline" className="text-[10px]">Online On</Badge>
                    )}
                  </div>
                </div>
              ))}
              {schoolsWithConfig.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No schools found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
