import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus, Send, Eye } from 'lucide-react';
import { notificationCampaigns } from '@/data/mockModules';

export default function CampaignsPage() {
  const sent = notificationCampaigns.reduce((a, c) => a + c.sent, 0);
  const opened = notificationCampaigns.reduce((a, c) => a + c.opened, 0);
  return (
    <ModulePage>
      <ModuleHeader
        icon={Megaphone}
        title="Notification Campaigns"
        description="Push, SMS and email broadcasts with delivery insight"
        actions={<Button><Plus className="h-4 w-4 mr-2" />New campaign</Button>}
      />

      <StatGrid stats={[
        { label: 'Campaigns', value: notificationCampaigns.length, icon: Megaphone },
        { label: 'Messages sent', value: sent.toLocaleString('en-IN'), icon: Send, tone: 'success' },
        { label: 'Opened', value: opened.toLocaleString('en-IN'), icon: Eye },
        { label: 'Open rate', value: sent ? Math.round((opened / sent) * 100) + '%' : '—', icon: Eye, tone: 'warning' },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">All campaigns</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={notificationCampaigns}
            columns={[
              { key: 'title', header: 'Campaign', mobile: 'title', cell: c => c.title },
              { key: 'audience', header: 'Audience', mobile: 'subtitle', cell: c => `${c.audience} · ${c.channel}` },
              { key: 'sent', header: 'Sent', mobile: 'meta', cell: c => c.sent.toLocaleString('en-IN') },
              { key: 'opened', header: 'Opened', mobile: 'meta', cell: c => c.opened.toLocaleString('en-IN') },
              { key: 'date', header: 'Date', mobile: 'meta', cell: c => c.date },
              { key: 'status', header: 'Status', mobile: 'badge', cell: c => <StatusBadge status={c.status} /> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}