import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DoorOpen, UserPlus, LogIn, ShieldCheck, Ticket } from 'lucide-react';
import { visitors, gatePasses } from '@/data/mockModules';

export default function VisitorsPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={DoorOpen}
        title="Visitor Management"
        description="Gate entries, badges and student gate passes"
        actions={<Button><UserPlus className="h-4 w-4 mr-2" />Check in visitor</Button>}
      />

      <StatGrid stats={[
        { label: 'Visitors today', value: visitors.length, icon: LogIn },
        { label: 'Inside campus', value: visitors.filter(v => v.status === 'active').length, icon: ShieldCheck, tone: 'success' },
        { label: 'Gate passes', value: gatePasses.length, icon: Ticket },
        { label: 'Awaiting approval', value: gatePasses.filter(g => g.status === 'pending').length, icon: Ticket, tone: 'warning' },
      ]} />

      <Tabs defaultValue="visitors">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="visitors" className="flex-1 sm:flex-none">Visitors</TabsTrigger>
          <TabsTrigger value="passes" className="flex-1 sm:flex-none">Gate passes</TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Today's gate register</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={visitors}
                columns={[
                  { key: 'name', header: 'Visitor', mobile: 'title', cell: v => v.name },
                  { key: 'purpose', header: 'Purpose', mobile: 'subtitle', cell: v => v.purpose },
                  { key: 'host', header: 'Host', mobile: 'meta', cell: v => v.host },
                  { key: 'phone', header: 'Phone', cell: v => <span className="text-muted-foreground">{v.phone}</span> },
                  { key: 'in', header: 'In', mobile: 'meta', cell: v => v.inTime },
                  { key: 'out', header: 'Out', mobile: 'meta', cell: v => v.outTime },
                  { key: 'badge', header: 'Badge', mobile: 'meta', cell: v => v.badge },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: v => <StatusBadge status={v.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passes" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Student gate passes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={gatePasses}
                columns={[
                  { key: 'student', header: 'Student', mobile: 'title', cell: g => g.student },
                  { key: 'reason', header: 'Reason', mobile: 'subtitle', cell: g => g.reason },
                  { key: 'approvedBy', header: 'Approved by', mobile: 'meta', cell: g => g.approvedBy },
                  { key: 'time', header: 'Time', mobile: 'meta', cell: g => g.time },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: g => <StatusBadge status={g.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}