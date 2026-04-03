import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CreditCard, Wifi, WifiOff, IndianRupee, ShieldCheck, ShieldOff, Clock, CheckCircle2, XCircle, Lock, Unlock } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ConnectionStatus = 'not_connected' | 'pending' | 'connected' | 'rejected';

const statusConfig: Record<ConnectionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; color: string }> = {
  not_connected: { label: 'Not Connected', variant: 'secondary', icon: WifiOff, color: 'text-muted-foreground' },
  pending: { label: 'Pending Approval', variant: 'outline', icon: Clock, color: 'text-warning' },
  connected: { label: 'Connected', variant: 'default', icon: CheckCircle2, color: 'text-success' },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle, color: 'text-destructive' },
};

export function PaymentSettings() {
  const { getSetting, updateSetting } = useSystemSettings();
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; schoolId: string; schoolName: string }>({ open: false, schoolId: '', schoolName: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  const paymentConfig = getSetting('payment_config', {
    online_enabled: true,
    manual_enabled: true,
    extra_charge_pct: 2.0,
  });

  const [onlineEnabled, setOnlineEnabled] = useState(paymentConfig.online_enabled);
  const [manualEnabled, setManualEnabled] = useState(paymentConfig.manual_enabled);
  const [extraCharge, setExtraCharge] = useState(String(paymentConfig.extra_charge_pct));

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
      value: { online_enabled: onlineEnabled, manual_enabled: manualEnabled, extra_charge_pct: pct },
    });
  };

  const approvalMutation = useMutation({
    mutationFn: async ({ schoolId, action, reason }: { schoolId: string; action: 'approve' | 'reject'; reason?: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const payload: any = {
        school_id: schoolId,
        updated_at: new Date().toISOString(),
      };
      if (action === 'approve') {
        payload.connection_status = 'connected';
        payload.is_connected = true;
        payload.approved_by = userId;
        payload.approved_at = new Date().toISOString();
        payload.rejection_reason = null;
      } else {
        payload.connection_status = 'rejected';
        payload.is_connected = false;
        payload.rejection_reason = reason || 'Rejected by admin';
        payload.approved_by = userId;
        payload.approved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('school_payment_config' as any)
        .update(payload as any)
        .eq('school_id', schoolId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['all-school-payment-configs'] });
      toast.success(vars.action === 'approve' ? 'Connection approved' : 'Connection rejected');
      setRejectDialog({ open: false, schoolId: '', schoolName: '' });
      setRejectionReason('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const lockMutation = useMutation({
    mutationFn: async ({ schoolId, locked }: { schoolId: string; locked: boolean }) => {
      const { error } = await supabase
        .from('school_payment_config' as any)
        .update({ locked_by_super_admin: locked, updated_at: new Date().toISOString() } as any)
        .eq('school_id', schoolId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['all-school-payment-configs'] });
      toast.success(vars.locked ? 'School payment settings locked' : 'School payment settings unlocked');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const overrideMutation = useMutation({
    mutationFn: async ({ schoolId, field, value }: { schoolId: string; field: string; value: boolean | null }) => {
      const { error } = await supabase
        .from('school_payment_config' as any)
        .upsert({ school_id: schoolId, [field]: value, updated_at: new Date().toISOString() } as any, { onConflict: 'school_id' });
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

  const pendingSchools = schoolsWithConfig.filter(s => s.config?.connection_status === 'pending');

  return (
    <div className="space-y-5">
      {/* Global Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4" />
            Global Payment Settings
          </CardTitle>
          <CardDescription className="text-xs">Control payment methods across all schools.</CardDescription>
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
            <Input type="number" value={extraCharge} onChange={(e) => setExtraCharge(e.target.value)} min={0} max={10} step={0.1} className="w-32" />
            <p className="text-xs text-muted-foreground">Additional charge on online payments (0-10%)</p>
          </div>
          <Button size="sm" onClick={handleSaveGlobal} disabled={updateSetting.isPending}>
            {updateSetting.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save Global Settings
          </Button>
        </CardContent>
      </Card>

      {/* Pending Approval Requests */}
      {pendingSchools.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-warning">
              <Clock className="w-4 h-4" />
              Pending Cashfree Requests ({pendingSchools.length})
            </CardTitle>
            <CardDescription className="text-xs">Schools awaiting Cashfree connection approval.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSchools.map(school => {
              const rawAppId = school.config?.cashfree_app_id || '';
              const maskedAppId = rawAppId.length > 6
                ? rawAppId.substring(0, 4) + '••••' + rawAppId.substring(rawAppId.length - 4)
                : rawAppId ? '••••••••' : 'Not provided';
              const isTest = rawAppId.toUpperCase().startsWith('TEST');

              return (
                <div key={school.id} className="p-3 rounded-lg border border-warning/30 bg-warning/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{school.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {school.code} • Submitted {school.config?.submitted_at ? new Date(school.config.submitted_at).toLocaleDateString('en-IN') : 'recently'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => approvalMutation.mutate({ schoolId: school.id, action: 'approve' })}
                        disabled={approvalMutation.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => setRejectDialog({ open: true, schoolId: school.id, schoolName: school.name })}
                        disabled={approvalMutation.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">App ID:</span>
                    <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono">{maskedAppId}</code>
                    {isTest && <Badge variant="outline" className="text-[10px] h-4">Sandbox</Badge>}
                    {!isTest && rawAppId && <Badge variant="secondary" className="text-[10px] h-4">Production</Badge>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Per-School Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">School Payment Status</CardTitle>
          <CardDescription className="text-xs">View connection status, lock/unlock, and override settings per school.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSchools ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {schoolsWithConfig.map(school => {
                const status = (school.config?.connection_status || 'not_connected') as ConnectionStatus;
                const cfg = statusConfig[status];
                const StatusIcon = cfg.icon;
                const isLocked = school.config?.locked_by_super_admin ?? false;

                return (
                  <div key={school.id} className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusIcon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{school.name}</p>
                          <p className="text-xs text-muted-foreground">{school.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={cfg.variant as any} className="text-[10px]">{cfg.label}</Badge>
                        {isLocked && (
                          <Badge variant="outline" className="text-[10px] gap-0.5 border-destructive/50 text-destructive">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {status === 'rejected' && school.config?.rejection_reason && (
                      <p className="text-xs text-destructive bg-destructive/5 px-2 py-1 rounded">
                        Reason: {school.config.rejection_reason}
                      </p>
                    )}

                    {/* Actions row */}
                    {school.config && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => lockMutation.mutate({ schoolId: school.id, locked: !isLocked })}
                          disabled={lockMutation.isPending}
                        >
                          {isLocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                          {isLocked ? 'Unlock' : 'Lock'}
                        </Button>
                        {status === 'connected' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => overrideMutation.mutate({ schoolId: school.id, field: 'super_admin_override_online', value: !(school.config?.super_admin_override_online ?? true) })}
                            >
                              {(school.config?.super_admin_override_online ?? true)
                                ? <><ShieldOff className="w-3 h-3 mr-1" /> Disable Online</>
                                : <><ShieldCheck className="w-3 h-3 mr-1" /> Enable Online</>}
                            </Button>
                          </>
                        )}
                        {status === 'rejected' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => approvalMutation.mutate({ schoolId: school.id, action: 'approve' })}
                            disabled={approvalMutation.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approve Now
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {schoolsWithConfig.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No schools found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) { setRejectDialog({ open: false, schoolId: '', schoolName: '' }); setRejectionReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Reject Connection — {rejectDialog.schoolName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs font-medium">Reason for Rejection</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejecting this connection request..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectDialog({ open: false, schoolId: '', schoolName: '' })}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => approvalMutation.mutate({ schoolId: rejectDialog.schoolId, action: 'reject', reason: rejectionReason })}
              disabled={approvalMutation.isPending || !rejectionReason.trim()}
            >
              {approvalMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
