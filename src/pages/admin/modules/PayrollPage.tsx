import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Play, Receipt, TrendingDown } from 'lucide-react';
import { payrollRuns, payslips, inr } from '@/data/mockModules';

export default function PayrollPage() {
  const latest = payrollRuns.find(p => p.status === 'draft') ?? payrollRuns[0];
  return (
    <ModulePage>
      <ModuleHeader
        icon={Wallet}
        title="Payroll"
        description="Monthly salary runs, deductions and payslips"
        actions={<Button><Play className="h-4 w-4 mr-2" />Run payroll</Button>}
      />

      <StatGrid stats={[
        { label: 'Current run', value: latest.month, hint: latest.status, icon: Wallet },
        { label: 'Employees', value: latest.employees, icon: Receipt },
        { label: 'Gross', value: inr(latest.gross), icon: Wallet, tone: 'success' },
        { label: 'Deductions', value: inr(latest.deductions), icon: TrendingDown, tone: 'warning' },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Payroll runs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={payrollRuns}
            columns={[
              { key: 'month', header: 'Month', mobile: 'title', cell: p => p.month },
              { key: 'id', header: 'Run ID', mobile: 'subtitle', cell: p => p.id },
              { key: 'employees', header: 'Employees', mobile: 'meta', cell: p => `${p.employees}` },
              { key: 'gross', header: 'Gross', mobile: 'meta', cell: p => inr(p.gross) },
              { key: 'deductions', header: 'Deductions', mobile: 'meta', cell: p => inr(p.deductions) },
              { key: 'net', header: 'Net payout', mobile: 'meta', cell: p => inr(p.net) },
              { key: 'paidOn', header: 'Paid on', mobile: 'meta', cell: p => p.paidOn },
              { key: 'status', header: 'Status', mobile: 'badge', cell: p => <StatusBadge status={p.status} /> },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payslip breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={payslips}
            columns={[
              { key: 'employee', header: 'Employee', mobile: 'title', cell: p => p.employee },
              { key: 'basic', header: 'Basic', mobile: 'meta', cell: p => inr(p.basic) },
              { key: 'hra', header: 'HRA', mobile: 'meta', cell: p => inr(p.hra) },
              { key: 'allowances', header: 'Allowances', mobile: 'meta', cell: p => inr(p.allowances) },
              { key: 'pf', header: 'PF', mobile: 'meta', cell: p => inr(p.pf) },
              { key: 'tax', header: 'TDS', mobile: 'meta', cell: p => inr(p.tax) },
              { key: 'net', header: 'Net pay', mobile: 'subtitle', cell: p => <span className="font-semibold">{inr(p.net)}</span> },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}