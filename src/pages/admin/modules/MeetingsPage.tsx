import { ModulePage, ModuleHeader, StatGrid, StatusBadge } from '@/components/modules/ModuleShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Plus, Users, CalendarClock } from 'lucide-react';
import { meetings } from '@/data/mockModules';

export default function MeetingsPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={Video}
        title="Video Meetings"
        description="PTMs, staff syncs and orientation sessions"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Schedule meeting</Button>}
      />

      <StatGrid cols={3} stats={[
        { label: 'Live now', value: meetings.filter(m => m.status === 'live').length, icon: Video, tone: 'success' },
        { label: 'Scheduled', value: meetings.filter(m => m.status === 'scheduled').length, icon: CalendarClock },
        { label: 'Participants', value: meetings.reduce((a, m) => a + m.participants, 0), icon: Users },
      ]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {meetings.map(m => (
          <Card key={m.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-snug">{m.title}</p>
                <StatusBadge status={m.status} />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Host · {m.host}</p>
                <p>{m.when} · {m.duration}</p>
                <p>{m.participants} participants · {m.platform}</p>
              </div>
              <Button size="sm" className="w-full" variant={m.status === 'live' ? 'default' : 'outline'}>
                {m.status === 'live' ? 'Join now' : m.status === 'scheduled' ? 'Copy invite' : 'View recording'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ModulePage>
  );
}