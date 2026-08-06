import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, Plus, MapPin, Users, Clock } from 'lucide-react';
import { busRoutes, routeStops } from '@/data/mockModules';

export default function BusRoutesPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={Route}
        title="Fleet — Routes & Stops"
        description="Plan pickup routes, stop sequences and timings"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Add route</Button>}
      />

      <StatGrid stats={[
        { label: 'Routes', value: busRoutes.length, icon: Route },
        { label: 'Active routes', value: busRoutes.filter(r => r.status === 'active').length, icon: Route, tone: 'success' },
        { label: 'Stops mapped', value: busRoutes.reduce((a, r) => a + r.stops, 0), icon: MapPin },
        { label: 'Students ferried', value: busRoutes.reduce((a, r) => a + r.students, 0), icon: Users },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">All routes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={busRoutes}
            columns={[
              { key: 'name', header: 'Route', mobile: 'title', cell: r => r.name },
              { key: 'vehicle', header: 'Vehicle', mobile: 'subtitle', cell: r => r.vehicle },
              { key: 'stops', header: 'Stops', mobile: 'meta', cell: r => `${r.stops}` },
              { key: 'students', header: 'Students', mobile: 'meta', cell: r => `${r.students}` },
              { key: 'distance', header: 'Distance', mobile: 'meta', cell: r => r.distance },
              { key: 'window', header: 'Timing', mobile: 'meta', cell: r => `${r.start} – ${r.end}` },
              { key: 'status', header: 'Status', mobile: 'badge', cell: r => <StatusBadge status={r.status} /> },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Stop sequence — Route 1</CardTitle></CardHeader>
        <CardContent className="space-y-0">
          {routeStops.map((s, i) => (
            <div key={s.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary mt-1.5" />
                {i < routeStops.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-5 min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />{s.time} · {s.students} students · {s.eta}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </ModulePage>
  );
}