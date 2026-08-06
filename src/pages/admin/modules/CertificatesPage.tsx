import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Plus, FileCheck, Layers } from 'lucide-react';
import { certificateTemplates, issuedCertificates } from '@/data/mockModules';

export default function CertificatesPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={Award}
        title="Certificate Designer"
        description="Templates for TC, bonafide, awards and bulk issuance"
        actions={<Button><Plus className="h-4 w-4 mr-2" />New template</Button>}
      />

      <StatGrid cols={3} stats={[
        { label: 'Templates', value: certificateTemplates.length, icon: Layers },
        { label: 'Issued all time', value: certificateTemplates.reduce((a, t) => a + t.issued, 0), icon: FileCheck, tone: 'success' },
        { label: 'Drafts', value: certificateTemplates.filter(t => t.status === 'draft').length, icon: Layers, tone: 'warning' },
      ]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {certificateTemplates.map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 space-y-3">
              <div className="aspect-[4/3] rounded-lg border border-dashed bg-muted/40 flex items-center justify-center">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.category} · {t.issued} issued</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <Button size="sm" variant="outline" className="w-full">Edit design</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recently issued</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={issuedCertificates}
            columns={[
              { key: 'student', header: 'Student', mobile: 'title', cell: c => c.student },
              { key: 'template', header: 'Certificate', mobile: 'subtitle', cell: c => c.template },
              { key: 'issuedOn', header: 'Issued on', mobile: 'meta', cell: c => c.issuedOn },
              { key: 'by', header: 'Issued by', mobile: 'meta', cell: c => c.by },
              { key: 'status', header: 'Status', mobile: 'badge', cell: c => <StatusBadge status={c.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}