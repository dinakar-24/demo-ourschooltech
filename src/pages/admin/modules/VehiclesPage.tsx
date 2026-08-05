import { useState } from 'react';
import { ModulePage, ModuleHeader, StatGrid, StatusBadge } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bus, Plus, Search, Wrench, Fuel, Gauge } from 'lucide-react';
import { vehicles } from '@/data/mockModules';

export default function VehiclesPage() {
  const [q, setQ] = useState('');
  const rows = vehicles.filter(v =>
    `${v.number} ${v.model} ${v.driver} ${v.route}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <ModulePage>
      <ModuleHeader
        icon={Bus}
        title="Fleet — Vehicles"
        description="Every bus, van and cab registered to your campus"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Add vehicle</Button>}
      />

      <StatGrid stats={[
        { label: 'Total vehicles', value: vehicles.length, icon: Bus },
        { label: 'On road', value: vehicles.filter(v => v.status === 'active').length, icon: Gauge, tone: 'success' },
        { label: 'In maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, icon: Wrench, tone: 'warning' },
        { label: 'Avg fuel level', value: Math.round(vehicles.reduce((a, v) => a + v.fuel, 0) / vehicles.length) + '%', icon: Fuel },
      ]} />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Vehicle register</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search vehicle, driver, route" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Next service</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="font-medium">{v.number}</p>
                      <p className="text-xs text-muted-foreground">{v.model} · {v.odometer.toLocaleString('en-IN')} km</p>
                    </TableCell>
                    <TableCell className="text-sm">{v.driver}</TableCell>
                    <TableCell className="text-sm">{v.route}</TableCell>
                    <TableCell className="text-sm">{v.capacity} seats</TableCell>
                    <TableCell className="w-32">
                      <Progress value={v.fuel} className="h-2" />
                      <span className="text-[11px] text-muted-foreground">{v.fuel}%</span>
                    </TableCell>
                    <TableCell className="text-sm">{v.nextService}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y">
            {rows.map(v => (
              <div key={v.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{v.number}</p>
                    <p className="text-xs text-muted-foreground">{v.model} · {v.capacity} seats</p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-sm">{v.driver} · <span className="text-muted-foreground">{v.route}</span></p>
                <div>
                  <Progress value={v.fuel} className="h-2" />
                  <p className="text-[11px] text-muted-foreground mt-1">Fuel {v.fuel}% · Service due {v.nextService}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ModulePage>
  );
}