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
  Check,
  X,
  Clock,
  Users,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useClassAttendance, useMarkAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function TeacherAttendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  const { data: classes } = useClasses();
  const { data: classData, isLoading } = useClassAttendance(
    date, 
    selectedClass, 
    selectedSection
  );
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
    students.forEach(s => {
      newAttendance[s.id] = status;
    });
    setLocalAttendance(newAttendance);
  };

  const cycleStatus = (id: string) => {
    const current = getAttendanceStatus(id);
    const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
    setLocalAttendance(prev => ({ ...prev, [id]: next }));
  };

  const setStatus = (id: string, status: 'present' | 'absent' | 'late') => {
    setLocalAttendance(prev => ({ ...prev, [id]: status }));
  };

  const saveAttendance = async () => {
    const records = students.map(s => ({
      studentId: s.id,
      status: getAttendanceStatus(s.id),
    }));

    await markAttendance.mutateAsync({
      date: format(date, 'yyyy-MM-dd'),
      records,
    });

    setLocalAttendance({});
  };

  const presentCount = students.filter(s => getAttendanceStatus(s.id) === 'present').length;
  const absentCount = students.filter(s => getAttendanceStatus(s.id) === 'absent').length;
  const lateCount = students.filter(s => getAttendanceStatus(s.id) === 'late').length;
  const attendancePercentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const classOptions = classes?.map(c => c.name) || [];

  const statusConfig = {
    present: { color: 'bg-success', textColor: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle, label: 'P' },
    absent: { color: 'bg-destructive', textColor: 'text-destructive', bgColor: 'bg-destructive/10', icon: XCircle, label: 'A' },
    late: { color: 'bg-warning', textColor: 'text-warning', bgColor: 'bg-warning/10', icon: Clock, label: 'L' },
  };

  return (
    <MobileLayout title="Mark Attendance" showBack>
      <div className="p-4 space-y-4">
        {/* Date & Class Selection */}
        <Card>
          <CardContent className="p-3 space-y-3">
            {/* Date picker row */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-medium">{format(date, 'EEEE, dd MMMM yyyy')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) { setDate(d); setLocalAttendance({}); }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Class & Section */}
            <div className="flex gap-2">
              <Select value={selectedClass} onValueChange={(v) => {
                setSelectedClass(v);
                setSelectedSection('');
                setLocalAttendance({});
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClass && (
                <Select value={selectedSection} onValueChange={(v) => {
                  setSelectedSection(v);
                  setLocalAttendance({});
                }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(sec => (
                      <SelectItem key={sec.id} value={sec.name}>Sec {sec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedClass || !selectedSection ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Select Class & Section</h3>
            <p className="text-sm text-muted-foreground">
              Choose a class and section above to start marking attendance
            </p>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No Students Found</h3>
            <p className="text-sm text-muted-foreground">
              No active students in this class and section.
            </p>
          </Card>
        ) : (
          <>
            {isAlreadyMarked && (
              <Alert className="border-primary/30 bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                  Attendance already marked. You can update it.
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Dashboard */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">{selectedClass} - Sec {selectedSection}</span>
                    <Badge variant="outline" className="text-xs">
                      {students.length} Students
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-foreground">{attendancePercentage}%</span>
                    <span className="text-sm text-muted-foreground">Present</span>
                  </div>
                  <Progress value={attendancePercentage} className="h-2" />
                </div>
                <div className="grid grid-cols-3 border-t divide-x divide-border">
                  <button
                    className="flex flex-col items-center gap-1 py-3 hover:bg-success/5 transition-colors"
                    onClick={() => markAll('present')}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-success" />
                      <span className="text-lg font-bold text-foreground">{presentCount}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Present</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 py-3 hover:bg-destructive/5 transition-colors"
                    onClick={() => markAll('absent')}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                      <span className="text-lg font-bold text-foreground">{absentCount}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Absent</span>
                  </button>
                  <div className="flex flex-col items-center gap-1 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                      <span className="text-lg font-bold text-foreground">{lateCount}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Late</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student List */}
            <div className="space-y-2">
              {students.map((student) => {
                const status = getAttendanceStatus(student.id);
                const config = statusConfig[status];
                return (
                  <Card key={student.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center">
                        {/* Student Info */}
                        <div 
                          className="flex-1 flex items-center gap-3 p-3 cursor-pointer active:bg-muted/50 transition-colors"
                          onClick={() => cycleStatus(student.id)}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${config.bgColor} ${config.textColor}`}>
                            {student.roll_number || '-'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                          </div>
                        </div>
                        
                        {/* Status Buttons */}
                        <div className="flex items-center gap-1 pr-3">
                          {(['present', 'absent', 'late'] as const).map((s) => {
                            const sc = statusConfig[s];
                            const isActive = status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => setStatus(student.id, s)}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                  isActive 
                                    ? `${sc.color} text-white shadow-sm` 
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                {sc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-20 pt-2">
              <Button 
                className="w-full shadow-lg" 
                size="lg" 
                onClick={saveAttendance}
                disabled={markAttendance.isPending}
              >
                {markAttendance.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Attendance
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
