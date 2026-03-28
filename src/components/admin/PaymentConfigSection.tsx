import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  schoolId: string;
  globalOnlineEnabled: boolean;
  globalManualEnabled: boolean;
}

export function PaymentConfigSection({ schoolId, globalOnlineEnabled, globalManualEnabled }: Props) {
  const queryClient = useQueryClient();
  const [appId, setAppId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['school-payment-config', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_payment_config' as any)
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [manualEnabled, setManualEnabled] = useState(true);

  useEffect(() => {
    if (config) {
      setOnlineEnabled(config.online_enabled ?? false);
      setManualEnabled(config.manual_enabled ?? true);
      setAppId(config.cashfree_app_id ? '••••••••' : '');
      setSecretKey(config.cashfree_secret_key ? '••••••••' : '');
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase
        .from('school_payment_config' as any)
        .upsert({
          school_id: schoolId,
          ...payload,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'school_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-payment-config', schoolId] });
      toast.success('Payment settings saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSaveCredentials = () => {
    if (appId === '••••••••' && secretKey === '••••••••') {
      toast.info('No changes to credentials');
      return;
    }
    const payload: any = { is_connected: true };
    if (appId !== '••••••••') payload.cashfree_app_id = appId;
    if (secretKey !== '••••••••') payload.cashfree_secret_key = secretKey;
    saveMutation.mutate(payload);
  };

  const handleDisconnect = () => {
    saveMutation.mutate({
      cashfree_app_id: null,
      cashfree_secret_key: null,
      is_connected: false,
      online_enabled: false,
    });
  };

  const handleToggle = (field: string, value: boolean) => {
    saveMutation.mutate({ [field]: value });
    if (field === 'online_enabled') setOnlineEnabled(value);
    if (field === 'manual_enabled') setManualEnabled(value);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  const isConnected = config?.is_connected ?? false;

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4" />
            Cashfree Payment Gateway
          </CardTitle>
          <CardDescription className="text-xs">
            Connect your Cashfree account to receive online payments directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge className="bg-success text-success-foreground gap-1">
                <Wifi className="w-3 h-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="w-3 h-3" /> Not Connected
              </Badge>
            )}
          </div>

          {!globalOnlineEnabled && (
            <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
              Online payments are disabled globally by the platform admin.
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">App ID</Label>
              <Input
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Enter Cashfree App ID"
                onFocus={() => { if (appId === '••••••••') setAppId(''); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Secret Key</Label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter Cashfree Secret Key"
                  onFocus={() => { if (secretKey === '••••••••') setSecretKey(''); }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveCredentials} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {isConnected ? 'Update Credentials' : 'Connect'}
              </Button>
              {isConnected && (
                <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={saveMutation.isPending}>
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <CardDescription className="text-xs">Enable or disable payment methods for parents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Online Payments</p>
              <p className="text-xs text-muted-foreground">Accept payments via Cashfree gateway</p>
            </div>
            <Switch
              checked={onlineEnabled}
              onCheckedChange={(v) => handleToggle('online_enabled', v)}
              disabled={!globalOnlineEnabled || !isConnected}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manual Payments</p>
              <p className="text-xs text-muted-foreground">Accept UTR/transaction ID submissions</p>
            </div>
            <Switch
              checked={manualEnabled}
              onCheckedChange={(v) => handleToggle('manual_enabled', v)}
              disabled={!globalManualEnabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
