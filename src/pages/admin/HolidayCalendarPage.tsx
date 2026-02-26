import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, CloudRain, Loader2 } from 'lucide-react';
import { useSchoolHolidays } from '@/hooks/useSchoolHolidays';
import { cn } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_TYPES = [
  { label: 'Weekend', value: 'weekend', color: 'bg-destructive/80 text-destructive-foreground' },
  { label: 'Rainy Day', value: 'rainy_day', color: 'bg-sky-500/80 text-white' },
  { label: 'Holiday', value: 'holiday', color: 'bg-warning/80 text-warning-foreground' },
  { label: 'Exam', value: 'exam', color: 'bg-primary/80 text-primary-foreground' },
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

  const { data: holidays = [], isLoading, addHoliday, deleteHoliday } = useSchoolHolidays(currentMonth, currentYear);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
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
  };

  const handleAddCustom = () => {
    if (!newTitle.trim()) return;
    // Add for today's date in current month view (user can drag events for specific days)
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addHoliday.mutate({ title: newTitle.trim(), date: dateStr, event_type: 'holiday' });
    setNewTitle('');
  };

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  return (
    <AdminLayout title="Holiday Calendar">
      <div className="flex flex-col lg:flex-row gap-6 animate-fade-up">
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 space-y-4 shrink-0">
          {/* Draggable Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Draggable Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {EVENT_TYPES.map(type => (
                <div
                  key={type.value}
                  draggable
                  onDragStart={() => setDragType(type.value)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium cursor-grab active:cursor-grabbing select-none",
                    type.color
                  )}
                >
                  {type.label}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Create New Holiday */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Create New Holiday</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Event Title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleAddCustom} disabled={!newTitle.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Note:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Drag events onto calendar dates</li>
                  <li>When you add event to a date, all attendance will be disabled for that date.</li>
                  <li>You can delete events at any time.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle className="text-xl font-semibold">
              {MONTHS[currentMonth]} {currentYear}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}>
              Today
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border-t border-border">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border">
                  {DAYS.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r border-border last:border-r-0">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[90px] md:min-h-[110px] border-r border-b border-border last:border-r-0 p-1.5 transition-colors",
                        day === null && "bg-muted/30",
                        day && isToday(day) && "bg-warning/10",
                        day && "hover:bg-muted/20"
                      )}
                      onDragOver={day ? (e) => e.preventDefault() : undefined}
                      onDrop={day ? () => handleDrop(day) : undefined}
                    >
                      {day && (
                        <>
                          <div className={cn(
                            "text-sm font-medium mb-1",
                            isToday(day) ? "text-primary font-bold" : "text-foreground"
                          )}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {(holidaysByDate[day] || []).map(h => (
                              <div
                                key={h.id}
                                className={cn(
                                  "text-[10px] md:text-xs px-1.5 py-0.5 rounded flex items-center justify-between gap-1 group",
                                  getEventColor(h.event_type)
                                )}
                              >
                                <span className="truncate">{h.title}</span>
                                <button
                                  onClick={() => deleteHoliday.mutate(h.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
