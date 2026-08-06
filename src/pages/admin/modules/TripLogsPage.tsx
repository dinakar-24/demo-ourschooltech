import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Download, Clock, Route as RouteIcon } from 'lucide-react';
import { tripLogs } from '@/data/mockModules';

export default function TripLogsPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={ClipboardList}
        title="Fleet — Trip Logs"
        description="Completed journeys with boarding counts and durations"
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>}
      />

      <StatGrid cols={3} stats={[
        { label: 'Trips logged', value: tripLogs.length, icon: ClipboardList },
        { label: 'On time', value: tripLogs.filter(t => t.status === 'completed').length, icon: Clock, tone: 'success' },
        { label: 'Delayed', value: tripLogs.filter(t => t.status === 'delayed').length, icon: RouteIcon, tone: 'warning' },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Recent trips</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={tripLogs}
            columns={[
              { key: 'route', header: 'Route', mobile: 'title', cell: t => t.route },
              { key: 'when', header: 'Date / shift', mobile: 'subtitle', cell: t => `${t.date} · ${t.shift}` },
              { key: 'driver', header: 'Driver', mobile: 'meta', cell: t => t.driver },
              { key: 'boarded', header: 'Boarded', mobile: 'meta', cell: t => `${t.boarded}` },
              { key: 'distance', header: 'Distance', mobile: 'meta', cell: t => t.distance },
              { key: 'duration', header: 'Duration', mobile: 'meta', cell: t => t.duration },
              { key: 'status', header: 'Status', mobile: 'badge', cell: t => <StatusBadge status={t.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}