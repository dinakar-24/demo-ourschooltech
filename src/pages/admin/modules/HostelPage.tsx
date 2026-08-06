import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BedDouble, Plus, Users, Home, UtensilsCrossed } from 'lucide-react';
import { hostelBlocks, hostelRooms, messMenu } from '@/data/mockModules';

export default function HostelPage() {
  const capacity = hostelBlocks.reduce((a, b) => a + b.capacity, 0);
  const filled = hostelBlocks.reduce((a, b) => a + b.filled, 0);

  return (
    <ModulePage>
      <ModuleHeader
        icon={BedDouble}
        title="Hostel Management"
        description="Blocks, room allotment, wardens and mess menu"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Allot room</Button>}
      />

      <StatGrid stats={[
        { label: 'Blocks', value: hostelBlocks.length, icon: Home },
        { label: 'Beds', value: capacity, icon: BedDouble },
        { label: 'Residents', value: filled, icon: Users, tone: 'success' },
        { label: 'Occupancy', value: Math.round((filled / capacity) * 100) + '%', icon: Users, tone: 'warning' },
      ]} />

      <Tabs defaultValue="blocks">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="blocks" className="flex-1 sm:flex-none">Blocks</TabsTrigger>
          <TabsTrigger value="rooms" className="flex-1 sm:flex-none">Rooms</TabsTrigger>
          <TabsTrigger value="mess" className="flex-1 sm:flex-none">Mess</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hostelBlocks.map(b => (
              <Card key={b.id}>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground">Warden · {b.warden}</p>
                  </div>
                  <Progress value={Math.round((b.filled / b.capacity) * 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{b.filled}/{b.capacity} beds · {b.occupied}/{b.rooms} rooms occupied</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Room allotment</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={hostelRooms}
                columns={[
                  { key: 'id', header: 'Room', mobile: 'title', cell: r => r.id },
                  { key: 'block', header: 'Block', mobile: 'subtitle', cell: r => r.block },
                  { key: 'beds', header: 'Beds', mobile: 'meta', cell: r => `${r.occupied}/${r.beds}` },
                  { key: 'students', header: 'Students', cell: r => <span className="text-muted-foreground">{r.students}</span> },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: r => <StatusBadge status={r.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mess" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {messMenu.map(m => (
              <Card key={m.day}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />{m.day}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[['Breakfast', m.breakfast], ['Lunch', m.lunch], ['Snacks', m.snacks], ['Dinner', m.dinner]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-right font-medium">{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}