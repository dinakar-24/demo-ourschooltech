import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Globe, ShieldCheck, Plus } from 'lucide-react';
import { whiteLabelPlans } from '@/data/mockModules';

export default function WhiteLabelPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={Palette}
        title="White Label & Domains"
        description="Per-school branding, custom domains and plan tiers"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Add domain</Button>}
      />

      <StatGrid cols={3} stats={[
        { label: 'Branded tenants', value: whiteLabelPlans.length, icon: Palette },
        { label: 'Custom domains', value: whiteLabelPlans.filter(w => w.custom !== '—').length, icon: Globe, tone: 'success' },
        { label: 'Pending SSL', value: whiteLabelPlans.filter(w => w.status === 'pending').length, icon: ShieldCheck, tone: 'warning' },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Tenant branding</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={whiteLabelPlans}
            columns={[
              { key: 'school', header: 'School', mobile: 'title', cell: w => w.school },
              { key: 'domain', header: 'Default domain', mobile: 'subtitle', cell: w => w.domain },
              { key: 'custom', header: 'Custom domain', mobile: 'meta', cell: w => w.custom },
              { key: 'theme', header: 'Theme', mobile: 'meta', cell: w => w.theme },
              { key: 'plan', header: 'Plan', mobile: 'meta', cell: w => w.plan },
              { key: 'status', header: 'Status', mobile: 'badge', cell: w => <StatusBadge status={w.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}