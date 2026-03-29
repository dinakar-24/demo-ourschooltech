import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Wifi, WifiOff, Eye, EyeOff, Clock, CheckCircle2, XCircle, Lock, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  schoolId: string;
  globalOnlineEnabled: boolean;
  globalManualEnabled: boolean;
}

type ConnectionStatus = 'not_connected' | 'pending' | 'connected' | 'rejected';

const statusDisplay: Record<ConnectionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  not_connected: { label: 'Not Connected', variant: 'secondary', icon: WifiOff },
  pending: { label: 'Pending Approval', variant: 'outline', icon: Clock },
  connected: { label: 'Connected', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

export function PaymentConfigSection({ schoolId, globalOnlineEnabled, globalManualEnabled }: Props) {
  const queryClient = useQueryClient();
  const [appId, setAppId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);

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

  const handleSubmitForApproval = () => {
    if (!appId || appId === '••••••••' || !secretKey || secretKey === '••••••••') {
      toast.error('Please enter both App ID and Secret Key');
      return;
    }
    saveMutation.mutate({
      cashfree_app_id: appId,
      cashfree_secret_key: secretKey,
      connection_status: 'pending',
      is_connected: false,
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
    });
  };

  const handleDisconnect = () => {
    saveMutation.mutate({
      cashfree_app_id: null,
      cashfree_secret_key: null,
      is_connected: false,
      connection_status: 'not_connected',
      online_enabled: false,
      rejection_reason: null,
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

  const connectionStatus = (config?.connection_status || 'not_connected') as ConnectionStatus;
  const isConnected = connectionStatus === 'connected';
  const isPending = connectionStatus === 'pending';
  const isRejected = connectionStatus === 'rejected';
  const isLocked = config?.locked_by_super_admin ?? false;
  const statusInfo = statusDisplay[connectionStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-4">
      {/* Locked Banner */}
      {isLocked && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>Payment settings are locked by the platform admin. Contact support to make changes.</span>
        </div>
      )}

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
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant as any} className="gap-1">
              <StatusIcon className="w-3 h-3" /> {statusInfo.label}
            </Badge>
          </div>

          {/* Rejection reason */}
          {isRejected && config?.rejection_reason && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
              <p className="font-medium text-destructive text-xs mb-1">Rejection Reason:</p>
              <p className="text-xs text-muted-foreground">{config.rejection_reason}</p>
            </div>
          )}

          {/* Pending message */}
          {isPending && (
            <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Your connection request is under review. You'll be notified once approved.</span>
            </div>
          )}

          {!globalOnlineEnabled && (
            <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
              Online payments are disabled globally by the platform admin.
            </div>
          )}

          {/* Credential form — show only when not connected and not pending, or when rejected (can resubmit) */}
          {(connectionStatus === 'not_connected' || isRejected) && !isLocked && (
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
              <Button size="sm" onClick={handleSubmitForApproval} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                {isRejected ? 'Resubmit for Approval' : 'Submit for Approval'}
              </Button>
            </div>
          )}

          {/* Connected — show disconnect */}
          {isConnected && !isLocked && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={saveMutation.isPending}>
                Disconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggles — only when connected and not locked */}
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
              disabled={!globalOnlineEnabled || !isConnected || isLocked}
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
              disabled={!globalManualEnabled || isLocked}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
