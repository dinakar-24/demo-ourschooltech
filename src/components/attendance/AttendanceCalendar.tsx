import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  overallPercentage: number;
  label?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceCalendar({ records, overallPercentage, label = 'Attendance' }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const recordMap = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => map.set(r.date, r.status));
    return map;
  }, [records]);

  const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const monthRecords = useMemo(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [records, currentMonth]);

  const monthStats = useMemo(() => {
    const present = monthRecords.filter(r => r.status === 'present').length;
    const absent = monthRecords.filter(r => r.status === 'absent').length;
    const late = monthRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: monthRecords.length };
  }, [monthRecords]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const getDayStr = (day: number) => {
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentMonth.getFullYear()}-${m}-${d}`;
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'absent': return 'bg-destructive text-destructive-foreground';
      case 'late': return 'bg-warning text-warning-foreground';
      default: return '';
    }
  };

  const getStatusDot = (status: string | undefined) => {
    switch (status) {
      case 'present': return 'bg-success';
      case 'absent': return 'bg-destructive';
      case 'late': return 'bg-warning';
      default: return '';
    }
  };

  const selectedRecord = selectedDate ? recordMap.get(selectedDate) : null;

  return (
    <div className="space-y-4">
      {/* Overall percentage card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/70 text-sm">{label}</p>
              <p className="text-3xl font-bold mt-1">{overallPercentage}%</p>
              <p className="text-sm text-primary-foreground/60 mt-0.5">
                {monthStats.present} present this month
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">{monthStats.total}</p>
                <p className="text-[10px] text-primary-foreground/60">Days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToPrevMonth}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </motion.button>
            <h3 className="font-semibold text-foreground">{monthName}</h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToNextMonth}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={monthName}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-1"
            >
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = getDayStr(day);
                const status = recordMap.get(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const isFuture = new Date(dateStr) > today;

                return (
                  <motion.button
                    key={day}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => status && setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-sm',
                      status ? 'cursor-pointer' : 'cursor-default',
                      isSelected && status ? 'ring-2 ring-primary ring-offset-1' : '',
                      isToday && !status ? 'bg-primary/10 font-bold text-primary' : '',
                      isFuture ? 'text-muted-foreground/30' : 'text-foreground',
                      !status && !isToday && !isFuture ? 'text-muted-foreground/60' : '',
                    )}
                  >
                    <span className={cn(
                      'text-[13px] font-medium',
                      status && isSelected ? 'text-primary font-bold' : '',
                    )}>
                      {day}
                    </span>
                    {status && (
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-0.5', getStatusDot(status))} />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[11px] text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-[11px] text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-[11px] text-muted-foreground">Late</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDate && selectedRecord && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                {selectedRecord === 'present' && <CheckCircle className="w-5 h-5 text-success" />}
                {selectedRecord === 'absent' && <XCircle className="w-5 h-5 text-destructive" />}
                {selectedRecord === 'late' && <Clock className="w-5 h-5 text-warning" />}
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {new Date(selectedDate).toLocaleDateString('en-IN', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <Badge className={getStatusColor(selectedRecord)}>
                  {selectedRecord.charAt(0).toUpperCase() + selectedRecord.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <p className="text-lg font-bold text-foreground">{monthStats.total}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total</p>
        </div>
        <div className="p-3 rounded-xl bg-success/10 text-center">
          <p className="text-lg font-bold text-success">{monthStats.present}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Present</p>
        </div>
        <div className="p-3 rounded-xl bg-destructive/10 text-center">
          <p className="text-lg font-bold text-destructive">{monthStats.absent}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Absent</p>
        </div>
        <div className="p-3 rounded-xl bg-warning/10 text-center">
          <p className="text-lg font-bold text-warning">{monthStats.late}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Late</p>
        </div>
      </div>
    </div>
  );
}
