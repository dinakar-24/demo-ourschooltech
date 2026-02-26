import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  CalendarIcon, Check, X, Clock, Save, Search, Loader2, Users, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeacherAttendance } from '@/hooks/useTeacherAttendance';

type Status = 'present' | 'absent' | 'late' | 'half_day';

export default function EmployeeAttendancePage() {
  const isMobile = useIsMobile();
  const [date, setDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [localStatuses, setLocalStatuses] = useState<Record<string, Status>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, saveAttendance } = useTeacherAttendance(date);
  const teachers = data?.teachers || [];
  const records = data?.records || [];

  // Merge server records with local changes
  const statusMap = useMemo(() => {
    const map: Record<string, Status> = {};
    records.forEach(r => { map[r.teacher_id] = r.status as Status; });
    Object.assign(map, localStatuses);
    return map;
  }, [records, localStatuses]);

  const filtered = teachers.filter(t =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateStatus = (teacherId: string, status: Status) => {
    setLocalStatuses(prev => ({ ...prev, [teacherId]: status }));
    setHasChanges(true);
  };

  const markAllPresent = () => {
    const all: Record<string, Status> = {};
    teachers.forEach(t => { all[t.id] = 'present'; });
    setLocalStatuses(all);
    setHasChanges(true);
  };

  const handleSave = () => {
    const entries = teachers
      .filter(t => statusMap[t.id])
      .map(t => ({ teacher_id: t.id, status: statusMap[t.id] }));
    saveAttendance.mutate(entries, {
      onSuccess: () => {
        setLocalStatuses({});
        setHasChanges(false);
      },
    });
  };

  const stats = useMemo(() => {
    const present = teachers.filter(t => statusMap[t.id] === 'present').length;
    const absent = teachers.filter(t => statusMap[t.id] === 'absent').length;
    const late = teachers.filter(t => statusMap[t.id] === 'late').length;
    const unmarked = teachers.filter(t => !statusMap[t.id]).length;
    return { present, absent, late, unmarked, total: teachers.length };
  }, [teachers, statusMap]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'absent': return 'bg-destructive text-destructive-foreground';
      case 'late': return 'bg-warning text-warning-foreground';
      case 'half_day': return 'bg-info text-info-foreground';
    }
  };

  return (
    <AdminLayout title="Employee Attendance">
      <div className="space-y-6 animate-fade-up">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search teacher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-56 text-sm"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={markAllPresent}>
            <Check className="w-4 h-4 mr-1" />
            Mark All Present
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Users, label: 'Total', value: stats.total, color: 'text-foreground' },
            { icon: CheckCircle, label: 'Present', value: stats.present, color: 'text-success' },
            { icon: XCircle, label: 'Absent', value: stats.absent, color: 'text-destructive' },
            { icon: Clock, label: 'Late', value: stats.late, color: 'text-warning' },
            { icon: AlertCircle, label: 'Unmarked', value: stats.unmarked, color: 'text-muted-foreground' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <s.icon className={cn("w-5 h-5 mx-auto mb-1", s.color)} />
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile search */}
        <div className="sm:hidden relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teacher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Teacher List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No teachers found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(teacher => {
                  const status = statusMap[teacher.id];
                  return (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {teacher.avatar_url ? (
                          <img src={teacher.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                            {teacher.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-foreground">{teacher.full_name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.employee_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(['present', 'absent', 'late', 'half_day'] as Status[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(teacher.id, s)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                              status === s ? getStatusColor(s) : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {isMobile ? (
                              s === 'present' ? <Check className="w-3.5 h-3.5" /> :
                              s === 'absent' ? <X className="w-3.5 h-3.5" /> :
                              s === 'late' ? <Clock className="w-3.5 h-3.5" /> :
                              'HD'
                            ) : (
                              s === 'half_day' ? 'Half Day' : s.charAt(0).toUpperCase() + s.slice(1)
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-20 md:bottom-6 z-20">
            <Button
              onClick={handleSave}
              disabled={saveAttendance.isPending}
              className="w-full md:w-auto"
              size="lg"
            >
              {saveAttendance.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Attendance ({stats.total - stats.unmarked}/{stats.total})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
