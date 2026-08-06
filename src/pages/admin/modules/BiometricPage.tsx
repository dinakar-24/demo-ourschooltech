import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanFace, Plus, Fingerprint, Activity } from 'lucide-react';
import { biometricDevices, biometricPunches } from '@/data/mockModules';

export default function BiometricPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={ScanFace}
        title="Biometric & Face Attendance"
        description="Devices, sync health and live punch feed"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Register device</Button>}
      />

      <StatGrid stats={[
        { label: 'Devices', value: biometricDevices.length, icon: Fingerprint },
        { label: 'Online', value: biometricDevices.filter(d => d.status === 'active').length, icon: Activity, tone: 'success' },
        { label: 'Punches today', value: biometricDevices.reduce((a, d) => a + d.punches, 0).toLocaleString('en-IN'), icon: ScanFace },
        { label: 'Absent flagged', value: biometricPunches.filter(p => p.status === 'absent').length, icon: Activity, tone: 'destructive' },
      ]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {biometricDevices.map(d => (
          <Card key={d.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.type}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-xs text-muted-foreground">{d.location} · last sync {d.lastSync}</p>
              <p className="text-xs">{d.punches.toLocaleString('en-IN')} punches captured</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Live punch feed</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={biometricPunches}
            columns={[
              { key: 'person', header: 'Person', mobile: 'title', cell: p => p.person },
              { key: 'type', header: 'Type', mobile: 'subtitle', cell: p => p.type },
              { key: 'device', header: 'Device', mobile: 'meta', cell: p => p.device },
              { key: 'time', header: 'Time', mobile: 'meta', cell: p => p.time },
              { key: 'mode', header: 'Mode', mobile: 'meta', cell: p => p.mode },
              { key: 'status', header: 'Status', mobile: 'badge', cell: p => <StatusBadge status={p.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}