import { ModulePage, ModuleHeader, StatGrid, StatusBadge } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Radio, Navigation, Gauge, Users, Bell } from 'lucide-react';
import { liveBuses, routeStops } from '@/data/mockModules';

export default function LiveTrackingPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={Radio}
        title="Fleet — Live Tracking"
        description="Real-time bus positions, ETAs and parent alerts"
        actions={<Button variant="outline"><Bell className="h-4 w-4 mr-2" />Alert parents</Button>}
      />

      <StatGrid cols={3} stats={[
        { label: 'Buses running', value: liveBuses.filter(b => b.status === 'running').length, icon: Navigation, tone: 'success' },
        { label: 'Students onboard', value: liveBuses.reduce((a, b) => a + b.onboard, 0), icon: Users },
        { label: 'Delayed', value: liveBuses.filter(b => b.status === 'delayed').length, icon: Gauge, tone: 'warning' },
      ]} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader><CardTitle className="text-base">Campus map</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="relative h-64 sm:h-80 bg-muted/40 border-t">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:32px_32px]" />
              {liveBuses.map((b, i) => (
                <div key={b.id} className="absolute flex items-center gap-2" style={{ left: `${12 + i * 26}%`, top: `${22 + i * 20}%` }}>
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                  </span>
                  <span className="rounded-md bg-background/90 border px-2 py-1 text-[11px] font-medium shadow-sm">{b.number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming stops</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {routeStops.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.time} · {s.students} students</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{s.eta}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liveBuses.map(b => (
          <Card key={b.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{b.number}</p>
                  <p className="text-xs text-muted-foreground">{b.route}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <Progress value={b.progress} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-muted-foreground">Speed</p><p className="font-medium">{b.speed} km/h</p></div>
                <div><p className="text-muted-foreground">Onboard</p><p className="font-medium">{b.onboard}</p></div>
                <div><p className="text-muted-foreground">ETA</p><p className="font-medium">{b.eta}</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Next stop · {b.nextStop} — {b.driver}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ModulePage>
  );
}