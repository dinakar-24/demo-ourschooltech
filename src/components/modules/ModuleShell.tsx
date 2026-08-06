import { ReactNode } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ModuleHeaderProps {
  icon: any;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function ModuleHeader({ icon: Icon, title, description, actions }: ModuleHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  icon?: any;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}

const toneMap: Record<string, string> = {
  default: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
};

export function StatGrid({ stats, cols = 4 }: { stats: Stat[]; cols?: 2 | 3 | 4 }) {
  return (
    <div className={cn(
      'grid gap-3',
      cols === 2 && 'grid-cols-2',
      cols === 3 && 'grid-cols-2 lg:grid-cols-3',
      cols === 4 && 'grid-cols-2 lg:grid-cols-4',
    )}>
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{s.label}</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">{s.value}</p>
                {s.hint && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{s.hint}</p>}
              </div>
              {s.icon && (
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', toneMap[s.tone ?? 'default'])}>
                  <s.icon className="h-4 w-4" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const statusTones: Record<string, string> = {
  active: 'bg-success/15 text-success border-transparent',
  available: 'bg-success/15 text-success border-transparent',
  approved: 'bg-success/15 text-success border-transparent',
  paid: 'bg-success/15 text-success border-transparent',
  completed: 'bg-success/15 text-success border-transparent',
  present: 'bg-success/15 text-success border-transparent',
  running: 'bg-success/15 text-success border-transparent',
  live: 'bg-success/15 text-success border-transparent',
  pending: 'bg-warning/15 text-warning border-transparent',
  processing: 'bg-warning/15 text-warning border-transparent',
  maintenance: 'bg-warning/15 text-warning border-transparent',
  'in review': 'bg-warning/15 text-warning border-transparent',
  delayed: 'bg-warning/15 text-warning border-transparent',
  low: 'bg-warning/15 text-warning border-transparent',
  overdue: 'bg-destructive/15 text-destructive border-transparent',
  rejected: 'bg-destructive/15 text-destructive border-transparent',
  absent: 'bg-destructive/15 text-destructive border-transparent',
  breakdown: 'bg-destructive/15 text-destructive border-transparent',
  critical: 'bg-destructive/15 text-destructive border-transparent',
  inactive: 'bg-muted text-muted-foreground border-transparent',
  draft: 'bg-muted text-muted-foreground border-transparent',
  scheduled: 'bg-primary/15 text-primary border-transparent',
  upcoming: 'bg-primary/15 text-primary border-transparent',
  issued: 'bg-primary/15 text-primary border-transparent',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTones[status.toLowerCase()] ?? 'bg-muted text-muted-foreground border-transparent';
  return <Badge variant="outline" className={cn('capitalize font-medium', tone)}>{status}</Badge>;
}

export function ModulePage({ children }: { children: ReactNode }) {
  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">{children}</div>
    </AdminLayout>
  );
}

export function EmptyHint({ text }: { text: string }) {
  return (
    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{text}</CardContent></Card>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** shown on the mobile card */
  mobile?: 'title' | 'subtitle' | 'meta' | 'badge' | 'hide';
}

export function ModuleTable<T extends { id?: string }>({
  columns,
  rows,
  empty = 'Nothing here yet.',
}: { columns: Column<T>[]; rows: T[]; empty?: string }) {
  if (rows.length === 0) return <EmptyHint text={empty} />;
  const title = columns.find(c => c.mobile === 'title') ?? columns[0];
  const subtitle = columns.filter(c => c.mobile === 'subtitle');
  const meta = columns.filter(c => c.mobile === 'meta');
  const badge = columns.find(c => c.mobile === 'badge');

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>{columns.map(c => <TableHead key={c.key}>{c.header}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id ?? i}>
                {columns.map(c => <TableCell key={c.key} className="text-sm align-top">{c.cell(r)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden divide-y">
        {rows.map((r, i) => (
          <div key={r.id ?? i} className="p-4 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <div className="font-medium text-sm">{title.cell(r)}</div>
                {subtitle.map(c => (
                  <div key={c.key} className="text-xs text-muted-foreground">{c.cell(r)}</div>
                ))}
              </div>
              {badge && <div className="shrink-0">{badge.cell(r)}</div>}
            </div>
            {meta.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {meta.map(c => (
                  <div key={c.key} className="text-xs">
                    <span className="text-muted-foreground">{c.header}: </span>
                    <span className="font-medium">{c.cell(r)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}