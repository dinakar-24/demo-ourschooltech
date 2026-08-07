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
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
      {/* ambient premium wash */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.10),transparent_55%),radial-gradient(90%_90%_at_100%_0%,hsl(var(--accent)/0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-primary/25 blur-lg" />
            <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.8)] ring-1 ring-inset ring-white/20">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-semibold leading-tight tracking-tight truncate">{title}</h1>
            {description && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
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
  default: 'text-primary bg-primary/10 ring-primary/20',
  success: 'text-success bg-success/10 ring-success/20',
  warning: 'text-warning bg-warning/10 ring-warning/20',
  destructive: 'text-destructive bg-destructive/10 ring-destructive/20',
};

const toneGlow: Record<string, string> = {
  default: 'from-primary/60',
  success: 'from-success/60',
  warning: 'from-warning/60',
  destructive: 'from-destructive/60',
};

export function StatGrid({ stats, cols = 4 }: { stats: Stat[]; cols?: 2 | 3 | 4 }) {
  return (
    <div className={cn(
      'grid gap-3',
      cols === 2 && 'grid-cols-2',
      cols === 3 && 'grid-cols-2 lg:grid-cols-3',
      cols === 4 && 'grid-cols-2 lg:grid-cols-4',
    )}>
      {stats.map(s => {
        const tone = s.tone ?? 'default';
        return (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_30px_-18px_hsl(var(--primary)/0.55)]"
          >
            <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent opacity-70', toneGlow[tone])} />
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground truncate">{s.label}</p>
                <p className="text-2xl sm:text-3xl font-semibold mt-1.5 tracking-tight tabular-nums">{s.value}</p>
                {s.hint && <p className="text-[11px] text-muted-foreground mt-1 truncate">{s.hint}</p>}
              </div>
              {s.icon && (
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset transition-transform duration-300 group-hover:scale-110', toneMap[tone])}>
                  <s.icon className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        );
      })}
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
  return (
    <Badge variant="outline" className={cn('capitalize font-medium gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]', tone)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </Badge>
  );
}

export function ModulePage({ children }: { children: ReactNode }) {
  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6 pb-12 animate-in fade-in duration-500">{children}</div>
    </AdminLayout>
  );
}

export function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
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
            <TableRow className="hover:bg-transparent border-border/60">
              {columns.map(c => (
                <TableHead key={c.key} className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground bg-muted/40 first:rounded-tl-none">
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id ?? i} className="border-border/50 transition-colors hover:bg-primary/[0.035]">
                {columns.map(c => <TableCell key={c.key} className="text-sm align-middle py-3.5">{c.cell(r)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden divide-y divide-border/60">
        {rows.map((r, i) => (
          <div key={r.id ?? i} className="p-4 space-y-1.5 transition-colors active:bg-muted/40">
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