import { ModulePage, ModuleHeader, StatGrid, StatusBadge } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IdCard, Plus, Star, ShieldCheck, Phone, UserRound } from 'lucide-react';
import { drivers } from '@/data/mockModules';

export default function DriversPage() {
  const expiringSoon = drivers.filter(d => new Date(d.expiry) < new Date('2027-01-01')).length;

  return (
    <ModulePage>
      <ModuleHeader
        icon={IdCard}
        title="Fleet — Drivers"
        description="Driver profiles, licences and safety ratings"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Add driver</Button>}
      />

      <StatGrid stats={[
        { label: 'Drivers', value: drivers.length, icon: UserRound },
        { label: 'On duty', value: drivers.filter(d => d.status === 'active').length, icon: ShieldCheck, tone: 'success' },
        { label: 'Licence expiring', value: expiringSoon, hint: 'within 6 months', icon: IdCard, tone: 'warning' },
        { label: 'Avg safety rating', value: (drivers.reduce((a, d) => a + d.rating, 0) / drivers.length).toFixed(1), icon: Star },
      ]} />

      <div className="grid gap-3 md:hidden">
        {drivers.map(d => (
          <Card key={d.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.experience} yrs experience</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-sm flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{d.phone}</p>
              <p className="text-xs text-muted-foreground">Licence {d.licence} · expires {d.expiry}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">{d.vehicle}</span>
                <Badge variant="outline" className="gap-1"><Star className="h-3 w-3 fill-warning text-warning" />{d.rating}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
        <CardHeader><CardTitle className="text-base">Driver roster</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Licence</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Assigned vehicle</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.experience} yrs experience</p>
                  </TableCell>
                  <TableCell className="text-sm">{d.phone}</TableCell>
                  <TableCell className="text-sm font-mono text-xs">{d.licence}</TableCell>
                  <TableCell className="text-sm">{d.expiry}</TableCell>
                  <TableCell className="text-sm">{d.vehicle}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1"><Star className="h-3 w-3 fill-warning text-warning" />{d.rating}</Badge>
                  </TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ModulePage>
  );
}