import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Plus, Users, CheckCircle2, Percent } from 'lucide-react';
import { admissionEnquiries, admissionFunnel } from '@/data/mockModules';

export default function AdmissionsPage() {
  const top = admissionFunnel[0].count;
  const admitted = admissionFunnel[admissionFunnel.length - 1].count;
  return (
    <ModulePage>
      <ModuleHeader
        icon={GraduationCap}
        title="Online Admissions"
        description="Enquiries, applications and the admission funnel"
        actions={<Button><Plus className="h-4 w-4 mr-2" />New enquiry</Button>}
      />

      <StatGrid stats={[
        { label: 'Enquiries', value: top, icon: Users },
        { label: 'Applications', value: admissionFunnel[1].count, icon: Users },
        { label: 'Admitted', value: admitted, icon: CheckCircle2, tone: 'success' },
        { label: 'Conversion', value: Math.round((admitted / top) * 100) + '%', icon: Percent, tone: 'warning' },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Admission funnel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {admissionFunnel.map(f => (
            <div key={f.stage} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>{f.stage}</span>
                <span className="font-medium">{f.count}</span>
              </div>
              <Progress value={Math.round((f.count / top) * 100)} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent enquiries</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={admissionEnquiries}
            columns={[
              { key: 'applicant', header: 'Applicant', mobile: 'title', cell: a => a.applicant },
              { key: 'classApplied', header: 'Class', mobile: 'subtitle', cell: a => `${a.classApplied} · ${a.source}` },
              { key: 'parent', header: 'Parent', mobile: 'meta', cell: a => a.parent },
              { key: 'phone', header: 'Phone', cell: a => <span className="text-muted-foreground">{a.phone}</span> },
              { key: 'date', header: 'Date', mobile: 'meta', cell: a => a.date },
              { key: 'stage', header: 'Stage', mobile: 'badge', cell: a => <StatusBadge status={a.stage} /> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}