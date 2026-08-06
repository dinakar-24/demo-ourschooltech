import { ModulePage, ModuleHeader, StatGrid, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { financeSummary, monthlyCollection, inr } from '@/data/mockModules';

export default function FinancePage() {
  const income = financeSummary.filter(f => f.actual > 0).reduce((a, f) => a + f.actual, 0);
  const expense = financeSummary.filter(f => f.actual < 0).reduce((a, f) => a + Math.abs(f.actual), 0);
  const peak = Math.max(...monthlyCollection.map(m => m.expected));

  return (
    <ModulePage>
      <ModuleHeader
        icon={LineChart}
        title="Finance Analytics"
        description="Budget vs actuals, collections and surplus"
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>}
      />

      <StatGrid cols={3} stats={[
        { label: 'Income YTD', value: inr(income), icon: TrendingUp, tone: 'success' },
        { label: 'Expenditure YTD', value: inr(expense), icon: TrendingDown, tone: 'destructive' },
        { label: 'Net surplus', value: inr(income - expense), icon: Wallet },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Monthly fee collection (₹ crore)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 sm:gap-6 h-48">
            {monthlyCollection.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 flex-1">
                  <div className="w-1/2 rounded-t bg-primary" style={{ height: `${(m.collected / peak) * 100}%` }} />
                  <div className="w-1/2 rounded-t bg-primary/20" style={{ height: `${(m.expected / peak) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />Collected</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary/20" />Expected</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Budget vs actual</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={financeSummary.map(f => ({ ...f, id: f.head }))}
            columns={[
              { key: 'head', header: 'Head', mobile: 'title', cell: f => f.head },
              { key: 'budget', header: 'Budget', mobile: 'meta', cell: f => inr(Math.abs(f.budget)) },
              { key: 'actual', header: 'Actual', mobile: 'meta', cell: f => inr(Math.abs(f.actual)) },
              {
                key: 'progress', header: 'Utilisation', mobile: 'subtitle',
                cell: f => (
                  <div className="w-full min-w-[120px]">
                    <Progress value={Math.round((Math.abs(f.actual) / Math.abs(f.budget)) * 100)} className="h-2" />
                    <span className="text-[11px] text-muted-foreground">
                      {Math.round((Math.abs(f.actual) / Math.abs(f.budget)) * 100)}%
                    </span>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}