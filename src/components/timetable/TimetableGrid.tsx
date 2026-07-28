import { TimetableEntry, DAYS_OF_WEEK } from '@/hooks/useTimetableEntries';
import { cn } from '@/lib/utils';
import { Coffee } from 'lucide-react';

interface TimetableGridProps {
  entries: TimetableEntry[];
  maxPeriod?: number;
  compact?: boolean;
}

export function TimetableGrid({ entries, maxPeriod, compact = false }: TimetableGridProps) {
  // Determine period range
  const periodNumbers = entries.map(e => e.period_number);
  const max = maxPeriod || Math.max(...periodNumbers, 0);
  if (max === 0) return null;

  const periods = Array.from({ length: max }, (_, i) => i + 1);

  // Build lookup: [period][day] -> entry
  const grid: Record<number, Record<string, TimetableEntry>> = {};
  entries.forEach(e => {
    if (!grid[e.period_number]) grid[e.period_number] = {};
    grid[e.period_number][e.day_of_week] = e;
  });

  // Check if a period is lunch (any entry for that period is lunch)
  const isLunchPeriod = (period: number) => {
    return Object.values(grid[period] || {}).some(e => e.is_lunch);
  };

  // Get time display from any entry in the period
  const getPeriodTime = (period: number) => {
    const anyEntry = Object.values(grid[period] || {})[0];
    if (anyEntry) return `${anyEntry.start_time} - ${anyEntry.end_time}`;
    return '';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-muted/50">
            <th className="border-b border-r border-border px-3 py-2.5 text-left font-semibold text-muted-foreground w-[100px]">
              Period
            </th>
            {DAYS_OF_WEEK.map(day => (
              <th key={day} className="border-b border-r last:border-r-0 border-border px-3 py-2.5 text-center font-semibold text-muted-foreground">
                {compact ? day.slice(0, 3) : day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map(period => {
            const lunch = isLunchPeriod(period);
            const time = getPeriodTime(period);

            if (lunch) {
              return (
                <tr key={period} className="bg-amber-50 dark:bg-amber-950/20">
                  <td className="border-b border-r border-border px-3 py-2 text-center" colSpan={DAYS_OF_WEEK.length + 1}>
                    <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                      <Coffee className="w-4 h-4" />
                      LUNCH BREAK
                      {time && <span className="text-xs font-normal text-amber-600/70 dark:text-amber-500/70">({time})</span>}
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={period} className="hover:bg-muted/30 transition-colors">
                <td className="border-b border-r border-border px-3 py-2">
                  <div className="font-medium text-foreground">Period {period}</div>
                  {time && <div className="text-[11px] text-muted-foreground">{time}</div>}
                </td>
                {DAYS_OF_WEEK.map(day => {
                  const entry = grid[period]?.[day];
                  return (
                    <td key={day} className={cn(
                      "border-b border-r last:border-r-0 border-border px-2 py-1.5 text-center",
                      !entry && "text-muted-foreground/40"
                    )}>
                      {entry ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground text-xs leading-tight">{entry.subject}</div>
                          {entry.teacher && (
                            <div className="text-[10px] text-muted-foreground leading-tight">{entry.teacher.full_name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
