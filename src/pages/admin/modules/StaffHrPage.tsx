import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, CalendarDays, Building2 } from 'lucide-react';
import { staffDirectory, leaveRequests, inr } from '@/data/mockModules';

export default function StaffHrPage() {
  const depts = new Set(staffDirectory.map(s => s.dept));
  return (
    <ModulePage>
      <ModuleHeader
        icon={Users}
        title="Staff & HR"
        description="Employee directory, departments and leave approvals"
        actions={<Button><UserPlus className="h-4 w-4 mr-2" />Add employee</Button>}
      />

      <StatGrid stats={[
        { label: 'Employees', value: staffDirectory.length, icon: Users },
        { label: 'Active', value: staffDirectory.filter(s => s.status === 'active').length, icon: Users, tone: 'success' },
        { label: 'Departments', value: depts.size, icon: Building2 },
        { label: 'Leaves pending', value: leaveRequests.filter(l => l.status === 'pending').length, icon: CalendarDays, tone: 'warning' },
      ]} />

      <Tabs defaultValue="directory">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="directory" className="flex-1 sm:flex-none">Directory</TabsTrigger>
          <TabsTrigger value="leaves" className="flex-1 sm:flex-none">Leave requests</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Employee directory</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={staffDirectory}
                columns={[
                  { key: 'name', header: 'Employee', mobile: 'title', cell: s => s.name },
                  { key: 'role', header: 'Role', mobile: 'subtitle', cell: s => `${s.role} · ${s.dept}` },
                  { key: 'joined', header: 'Joined', mobile: 'meta', cell: s => s.joined },
                  { key: 'ctc', header: 'Annual CTC', mobile: 'meta', cell: s => inr(s.ctc) },
                  { key: 'leaves', header: 'Leaves taken', mobile: 'meta', cell: s => `${s.leaves}` },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: s => <StatusBadge status={s.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Leave requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={leaveRequests}
                columns={[
                  { key: 'staff', header: 'Employee', mobile: 'title', cell: l => l.staff },
                  { key: 'type', header: 'Type', mobile: 'subtitle', cell: l => l.type },
                  { key: 'from', header: 'From', mobile: 'meta', cell: l => l.from },
                  { key: 'to', header: 'To', mobile: 'meta', cell: l => l.to },
                  { key: 'days', header: 'Days', mobile: 'meta', cell: l => `${l.days}` },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: l => <StatusBadge status={l.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}