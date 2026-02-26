import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, X, Loader2, CalendarDays, CloudRain, Umbrella, BookOpen, Sun } from 'lucide-react';
import { useSchoolHolidays } from '@/hooks/useSchoolHolidays';
import { cn } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_TYPES = [
  { label: 'Weekend', value: 'weekend', color: 'bg-destructive/15 text-destructive border border-destructive/20', dragColor: 'bg-destructive text-destructive-foreground', icon: Sun },
  { label: 'Rainy Day', value: 'rainy_day', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20', dragColor: 'bg-sky-500 text-white', icon: CloudRain },
  { label: 'Holiday', value: 'holiday', color: 'bg-warning/15 text-warning border border-warning/20', dragColor: 'bg-warning text-warning-foreground', icon: CalendarDays },
  { label: 'Exam', value: 'exam', color: 'bg-primary/15 text-primary border border-primary/20', dragColor: 'bg-primary text-primary-foreground', icon: BookOpen },
];

function getEventColor(type: string) {
  return EVENT_TYPES.find(e => e.value === type)?.color || 'bg-muted text-muted-foreground';
}

export default function HolidayCalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [newTitle, setNewTitle] = useState('');
  const [dragType, setDragType] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const { data: holidays = [], isLoading, addHoliday, deleteHoliday } = useSchoolHolidays(currentMonth, currentYear);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    // Fill remaining cells to complete the grid
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth, currentYear]);

  const holidaysByDate = useMemo(() => {
    const map: Record<string, typeof holidays> = {};
    holidays.forEach(h => {
      const day = parseInt(h.date.split('-')[2]);
      if (!map[day]) map[day] = [];
      map[day].push(h);
    });
    return map;
  }, [holidays]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const handleDrop = (day: number) => {
    if (!dragType) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const typeLabel = EVENT_TYPES.find(e => e.value === dragType)?.label || dragType;
    addHoliday.mutate({ title: typeLabel, date: dateStr, event_type: dragType });
    setDragType(null);
    setDragOverDay(null);
  };

  const handleAddCustom = () => {
    if (!newTitle.trim()) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addHoliday.mutate({ title: newTitle.trim(), date: dateStr, event_type: 'holiday' });
    setNewTitle('');
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const isSunday = (day: number) => new Date(currentYear, currentMonth, day).getDay() === 0;

  // Count events this month
  const eventCount = holidays.length;

  return (
    <AdminLayout title="Holiday Calendar">
      <div className="flex flex-col lg:flex-row gap-5 animate-fade-up">
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 space-y-4 shrink-0">
          {/* Month Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{eventCount}</p>
                  <p className="text-xs text-muted-foreground">Events this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Draggable Events */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground">Drag to Calendar</CardTitle>
              <p className="text-xs text-muted-foreground">Drag an event type onto any date</p>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {EVENT_TYPES.map(type => (
                <div
                  key={type.value}
                  draggable
                  onDragStart={() => setDragType(type.value)}
                  onDragEnd={() => { setDragType(null); setDragOverDay(null); }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-grab active:cursor-grabbing select-none transition-all hover:scale-[1.02] active:scale-95 shadow-sm",
                    type.dragColor
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Create New Holiday */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground">Quick Add Holiday</CardTitle>
              <p className="text-xs text-muted-foreground">Adds to today's date</p>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Event title..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  className="text-sm h-9"
                />
                <Button size="sm" onClick={handleAddCustom} disabled={!newTitle.trim()} className="h-9 px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-foreground mb-1.5">ℹ️ How it works</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-3.5">
                  <li>Drag events onto calendar dates</li>
                  <li>Attendance is disabled on event dates</li>
                  <li>Click × to remove events</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon-sm" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {MONTHS[currentMonth]} {currentYear}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
            >
              Today
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-muted/30">
                  {DAYS.map(d => (
                    <div key={d} className={cn(
                      "py-2.5 text-center text-xs font-semibold border-b border-border",
                      d === 'Sun' && "text-destructive"
                    )}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const events = day ? (holidaysByDate[day] || []) : [];
                    const hasEvents = events.length > 0;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[88px] md:min-h-[100px] border-r border-b border-border p-1.5 transition-colors relative",
                          idx % 7 === 6 && "border-r-0",
                          day === null && "bg-muted/20",
                          day && isToday(day) && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                          day && dragOverDay === day && "bg-primary/10 ring-2 ring-inset ring-primary/40",
                          day && !isToday(day) && "hover:bg-muted/20"
                        )}
                        onDragOver={day ? (e) => { e.preventDefault(); setDragOverDay(day); } : undefined}
                        onDragLeave={day ? () => setDragOverDay(null) : undefined}
                        onDrop={day ? () => handleDrop(day) : undefined}
                      >
                        {day && (
                          <>
                            <div className={cn(
                              "text-sm mb-1 flex items-center justify-center w-6 h-6 rounded-full",
                              isToday(day)
                                ? "bg-primary text-primary-foreground font-bold"
                                : isSunday(day)
                                ? "text-destructive font-medium"
                                : "text-foreground font-medium"
                            )}>
                              {day}
                            </div>
                            <div className="space-y-0.5">
                              {events.map(h => (
                                <div
                                  key={h.id}
                                  className={cn(
                                    "text-[10px] md:text-xs px-1.5 py-0.5 rounded-md flex items-center justify-between gap-0.5 group leading-tight",
                                    getEventColor(h.event_type)
                                  )}
                                >
                                  <span className="truncate font-medium">{h.title}</span>
                                  <button
                                    onClick={() => deleteHoliday.mutate(h.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
