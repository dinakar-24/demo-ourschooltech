import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartPulse, Plus, Stethoscope, Pill, AlertTriangle } from 'lucide-react';
import { medicalRecords, medicineStock } from '@/data/mockModules';

export default function MedicalPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={HeartPulse}
        title="Medical & Infirmary"
        description="Clinic visits, treatments and medicine stock"
        actions={<Button><Plus className="h-4 w-4 mr-2" />New visit</Button>}
      />

      <StatGrid stats={[
        { label: 'Visits logged', value: medicalRecords.length, icon: Stethoscope },
        { label: 'Under care', value: medicalRecords.filter(m => m.status === 'active').length, icon: HeartPulse, tone: 'warning' },
        { label: 'Medicines', value: medicineStock.length, icon: Pill },
        { label: 'Low stock', value: medicineStock.filter(m => m.status === 'low').length, icon: AlertTriangle, tone: 'destructive' },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Infirmary log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={medicalRecords}
            columns={[
              { key: 'student', header: 'Student', mobile: 'title', cell: m => m.student },
              { key: 'complaint', header: 'Complaint', mobile: 'subtitle', cell: m => m.complaint },
              { key: 'treatment', header: 'Treatment', cell: m => <span className="text-muted-foreground">{m.treatment}</span> },
              { key: 'nurse', header: 'Attended by', mobile: 'meta', cell: m => m.nurse },
              { key: 'date', header: 'Date', mobile: 'meta', cell: m => m.date },
              { key: 'status', header: 'Status', mobile: 'badge', cell: m => <StatusBadge status={m.status} /> },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Medicine stock</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={medicineStock.map((m, i) => ({ ...m, id: `MS-${i}` }))}
            columns={[
              { key: 'name', header: 'Medicine', mobile: 'title', cell: m => m.name },
              { key: 'qty', header: 'Quantity', mobile: 'meta', cell: m => `${m.qty} ${m.unit}` },
              { key: 'expiry', header: 'Expiry', mobile: 'meta', cell: m => m.expiry },
              { key: 'status', header: 'Status', mobile: 'badge', cell: m => <StatusBadge status={m.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}