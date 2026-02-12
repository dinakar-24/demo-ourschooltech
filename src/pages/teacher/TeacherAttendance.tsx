import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Users,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useClassAttendance, useMarkAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TeacherAttendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  const { data: classes } = useClasses();
  const { data: classData, isLoading } = useClassAttendance(date, selectedClass, selectedSection);
  const markAttendance = useMarkAttendance();

  const selectedClassData = classes?.find(c => c.name === selectedClass);
  const sections = selectedClassData?.sections || [];
  const students = classData?.students || [];
  const existingAttendance = classData?.attendance || new Map();
  const isAlreadyMarked = classData?.isMarked || false;

  const getAttendanceStatus = (studentId: string): 'present' | 'absent' | 'late' => {
    if (localAttendance[studentId]) return localAttendance[studentId];
    const existing = existingAttendance.get(studentId);
    if (existing) return existing.status as 'present' | 'absent' | 'late';
    return 'present';
  };

  const markAll = (status: 'present' | 'absent') => {
    const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(s => { newAttendance[s.id] = status; });
    setLocalAttendance(newAttendance);
  };

  const setStatus = (id: string, status: 'present' | 'absent' | 'late') => {
    setLocalAttendance(prev => ({ ...prev, [id]: status }));
  };

  const saveAttendance = async () => {
    const records = students.map(s => ({
      studentId: s.id,
      status: getAttendanceStatus(s.id),
    }));
    await markAttendance.mutateAsync({ date: format(date, 'yyyy-MM-dd'), records });
    setLocalAttendance({});
  };

  const presentCount = students.filter(s => getAttendanceStatus(s.id) === 'present').length;
  const absentCount = students.filter(s => getAttendanceStatus(s.id) === 'absent').length;
  const lateCount = students.filter(s => getAttendanceStatus(s.id) === 'late').length;
  const attendancePercentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;
  const classOptions = classes?.map(c => c.name) || [];

  return (
    <MobileLayout title="Mark Attendance" showBack>
      <div className="p-4 space-y-3">
        {/* Date & Class Selection */}
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-2.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{format(date, 'EEE, dd MMM yyyy')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if (d) { setDate(d); setLocalAttendance({}); } }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="flex gap-2">
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection(''); setLocalAttendance({}); }}>
                <SelectTrigger className="flex-1 h-10"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classOptions.map(cls => (<SelectItem key={cls} value={cls}>{cls}</SelectItem>))}
                </SelectContent>
              </Select>
              {selectedClass && (
                <Select value={selectedSection} onValueChange={(v) => { setSelectedSection(v); setLocalAttendance({}); }}>
                  <SelectTrigger className="w-28 h-10"><SelectValue placeholder="Section" /></SelectTrigger>
                  <SelectContent>
                    {sections.map(sec => (<SelectItem key={sec.id} value={sec.name}>Sec {sec.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedClass || !selectedSection ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Select Class & Section</h3>
            <p className="text-sm text-muted-foreground">Choose above to start marking</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full rounded-xl" />))}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No Students Found</h3>
            <p className="text-sm text-muted-foreground">No active students in this class.</p>
          </div>
        ) : (
          <>
            {isAlreadyMarked && (
              <Alert className="border-primary/30 bg-primary/5 py-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary text-xs">Already marked. You can update it.</AlertDescription>
              </Alert>
            )}

            {/* Compact Stats Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-card border border-border/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{selectedClass} - {selectedSection}</span>
                  <span className="text-lg font-bold text-foreground">{attendancePercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${attendancePercentage}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => markAll('present')} className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg px-2.5 py-1.5 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold">{presentCount}</span>
                </button>
                <button onClick={() => markAll('absent')} className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg px-2.5 py-1.5 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-xs font-bold">{absentCount}</span>
                </button>
                <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg px-2.5 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold">{lateCount}</span>
                </div>
              </div>
            </div>

            {/* Compact Student List */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/50">
              {students.map((student) => {
                const status = getAttendanceStatus(student.id);
                return (
                  <div key={student.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    {/* Roll number */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      status === 'present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      status === 'absent' ? 'bg-destructive/10 text-destructive' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {student.roll_number || '-'}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] text-foreground truncate leading-tight">{student.full_name}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{student.admission_number}</p>
                    </div>
                    {/* Status Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {(['present', 'absent', 'late'] as const).map((s) => {
                        const isActive = status === s;
                        const labels = { present: 'P', absent: 'A', late: 'L' };
                        const activeStyles = {
                          present: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
                          absent: 'bg-destructive text-white shadow-sm shadow-destructive/30',
                          late: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30',
                        };
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(student.id, s)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${
                              isActive ? activeStyles[s] : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {labels[s]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spacer for sticky button */}
            <div className="h-16" />

            {/* Save Button */}
            <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-10">
              <Button className="w-full shadow-lg" size="lg" onClick={saveAttendance} disabled={markAttendance.isPending}>
                {markAttendance.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Attendance
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
