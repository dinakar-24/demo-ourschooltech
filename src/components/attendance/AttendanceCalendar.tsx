import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle, XCircle, Clock, TrendingUp, CircleDot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  overallPercentage: number;
  label?: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function AttendanceCalendar({ records, overallPercentage, label = 'Attendance' }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const recordMap = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => map.set(r.date, r.status));
    return map;
  }, [records]);

  const monthName = MONTHS[currentMonth.getMonth()];
  const year = currentMonth.getFullYear();
  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, currentMonth.getMonth(), 1).getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const monthRecords = useMemo(() => {
    const month = currentMonth.getMonth();
    const yr = currentMonth.getFullYear();
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === month && d.getFullYear() === yr;
    });
  }, [records, currentMonth]);

  const monthStats = useMemo(() => {
    const present = monthRecords.filter(r => r.status === 'present').length;
    const absent = monthRecords.filter(r => r.status === 'absent').length;
    const late = monthRecords.filter(r => r.status === 'late').length;
    const half_day = monthRecords.filter(r => r.status === 'half_day').length;
    return { present, absent, late, half_day, total: monthRecords.length };
  }, [monthRecords]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const selectYear = (yr: number) => {
    setCurrentMonth(prev => new Date(yr, prev.getMonth(), 1));
    setShowYearPicker(false);
    setSelectedDate(null);
  };

  const getDayStr = (day: number) => {
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getStatusDotColor = (status: string | undefined) => {
    switch (status) {
      case 'present': return 'bg-success';
      case 'absent': return 'bg-destructive';
      case 'late': return 'bg-warning';
      case 'half_day': return 'bg-info';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'absent': return 'bg-destructive text-destructive-foreground';
      case 'late': return 'bg-warning text-warning-foreground';
      case 'half_day': return 'bg-info text-info-foreground';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'half_day': return 'Half Day';
      default: return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'present': return 'Attended school';
      case 'absent': return 'Did not attend';
      case 'late': return 'Arrived late';
      case 'half_day': return 'Attended half day';
      default: return '';
    }
  };

  const selectedRecord = selectedDate ? recordMap.get(selectedDate) : null;

  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  const canGoNext = currentMonth.getFullYear() < currentYear ||
    (currentMonth.getFullYear() === currentYear && currentMonth.getMonth() < today.getMonth());

  return (
    <div className="space-y-3">
      {/* Header Stats Card */}
      <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/75 text-primary-foreground border-0 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
        <CardContent className="p-5 relative z-10">
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider">{label}</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-4xl font-extrabold tracking-tight">{overallPercentage}%</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary-foreground/60" />
                <span className="text-xs text-primary-foreground/60">
                  {monthStats.present}/{monthStats.total} days present in {monthName}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                { val: monthStats.present, color: 'bg-success/90', lbl: 'P' },
                { val: monthStats.absent, color: 'bg-destructive/90', lbl: 'A' },
                { val: monthStats.late, color: 'bg-warning/90', lbl: 'L' },
                { val: monthStats.half_day, color: 'bg-info/90', lbl: 'HD' },
              ].map(s => (
                <div key={s.lbl} className={cn('w-10 h-10 rounded-xl flex flex-col items-center justify-center', s.color)}>
                  <span className="text-sm font-bold text-white">{s.val}</span>
                  <span className="text-[8px] text-white/70 font-medium">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Card */}
      <Card className="shadow-sm">
        <CardContent className="p-3 pb-4">
          {/* Month + Year nav */}
          <div className="flex items-center justify-between mb-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={goToPrevMonth}
              className="w-8 h-8 rounded-full bg-muted/70 flex items-center justify-center active:bg-muted"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <span className="font-semibold text-sm text-foreground">{monthName} {year}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', showYearPicker && 'rotate-180')} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={goToNextMonth}
              className="w-8 h-8 rounded-full bg-muted/70 flex items-center justify-center active:bg-muted"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Year picker dropdown */}
          <AnimatePresence>
            {showYearPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="flex flex-wrap gap-2 justify-center py-2 px-1 bg-muted/30 rounded-xl">
                  {yearRange.map(yr => (
                    <motion.button
                      key={yr}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectYear(yr)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                        yr === year
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                      )}
                    >
                      {yr}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className={cn(
                'text-center text-[11px] font-semibold py-1.5',
                i === 0 ? 'text-destructive/60' : 'text-muted-foreground'
              )}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${monthName}-${year}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-7"
            >
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`e-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = getDayStr(day);
                const status = recordMap.get(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const isFuture = new Date(dateStr) > today;
                const isSunday = new Date(year, currentMonth.getMonth(), day).getDay() === 0;

                return (
                  <motion.button
                    key={day}
                    whileTap={status ? { scale: 0.8 } : undefined}
                    onClick={() => status && setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center relative rounded-xl mx-0.5 my-0.5 transition-all',
                      status ? 'cursor-pointer active:bg-muted/50' : 'cursor-default',
                      isSelected && status ? 'bg-primary/10 ring-1.5 ring-primary' : '',
                      isToday && !isSelected ? 'bg-primary/5' : '',
                    )}
                  >
                    <span className={cn(
                      'text-[13px] leading-none',
                      isToday ? 'font-bold text-primary' : '',
                      isFuture ? 'text-muted-foreground/25' : '',
                      !status && !isToday && !isFuture ? 'text-muted-foreground/50' : '',
                      status && !isToday ? 'font-semibold text-foreground' : '',
                      isSunday && !isFuture && !status ? 'text-destructive/40' : '',
                      isSunday && status ? 'text-foreground' : '',
                    )}>
                      {day}
                    </span>
                    {status && (
                      <div className={cn('w-[5px] h-[5px] rounded-full mt-[3px]', getStatusDotColor(status))} />
                    )}
                    {isToday && (
                      <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
            {[
              { color: 'bg-success', label: 'Present' },
              { color: 'bg-destructive', label: 'Absent' },
              { color: 'bg-warning', label: 'Late' },
              { color: 'bg-info', label: 'Half Day' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full', item.color)} />
                <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDate && selectedRecord && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <Card className="shadow-sm border-l-4" style={{
              borderLeftColor: selectedRecord === 'present' ? 'hsl(var(--success))' :
                selectedRecord === 'absent' ? 'hsl(var(--destructive))' :
                selectedRecord === 'half_day' ? 'hsl(var(--info))' : 'hsl(var(--warning))'
            }}>
              <CardContent className="p-3.5 flex items-center gap-3">
                {selectedRecord === 'present' && <CheckCircle className="w-5 h-5 text-success shrink-0" />}
                {selectedRecord === 'absent' && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                {selectedRecord === 'late' && <Clock className="w-5 h-5 text-warning shrink-0" />}
                {selectedRecord === 'half_day' && <CircleDot className="w-5 h-5 text-info shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">
                    {new Date(selectedDate).toLocaleDateString('en-IN', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {getStatusDescription(selectedRecord)}
                  </p>
                </div>
                <Badge className={cn('shrink-0 text-[11px]', getStatusBadgeClass(selectedRecord))}>
                  {getStatusLabel(selectedRecord)}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly summary chips */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { val: monthStats.total, lbl: 'Total', bg: 'bg-muted/60', text: 'text-foreground' },
          { val: monthStats.present, lbl: 'Present', bg: 'bg-success/10', text: 'text-success' },
          { val: monthStats.absent, lbl: 'Absent', bg: 'bg-destructive/10', text: 'text-destructive' },
          { val: monthStats.late, lbl: 'Late', bg: 'bg-warning/10', text: 'text-warning' },
          { val: monthStats.half_day, lbl: 'Half Day', bg: 'bg-info/10', text: 'text-info' },
        ].map(s => (
          <div key={s.lbl} className={cn('py-2.5 rounded-xl text-center', s.bg)}>
            <p className={cn('text-xl font-bold', s.text)}>{s.val}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.lbl}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
