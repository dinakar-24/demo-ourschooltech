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
  const { data: classData, isLoading } = useClassAttendance(
    date, 
    selectedClass, 
    selectedSection
  );
  const markAttendance = useMarkAttendance();

  // Get sections for selected class
  const selectedClassData = classes?.find(c => c.name === selectedClass);
  const sections = selectedClassData?.sections || [];

  // Initialize local attendance from fetched data
  const students = classData?.students || [];
  const existingAttendance = classData?.attendance || new Map();
  const isAlreadyMarked = classData?.isMarked || false;

  // Get current attendance state (local or from DB)
  const getAttendanceStatus = (studentId: string): 'present' | 'absent' | 'late' => {
    if (localAttendance[studentId]) return localAttendance[studentId];
    const existing = existingAttendance.get(studentId);
    if (existing) return existing.status as 'present' | 'absent' | 'late';
    return 'present'; // Default
  };

  const markAll = (status: 'present' | 'absent') => {
    const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(s => {
      newAttendance[s.id] = status;
    });
    setLocalAttendance(newAttendance);
  };

  const toggleStatus = (id: string) => {
    const current = getAttendanceStatus(id);
    const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
    setLocalAttendance(prev => ({ ...prev, [id]: next }));
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

  const classOptions = classes?.map(c => c.name) || [];

  return (
    <MobileLayout title="Mark Attendance" showBack>
      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
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
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(sec => (
                  <SelectItem key={sec.id} value={sec.name}>Section {sec.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[130px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'dd MMM')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setLocalAttendance({});
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {!selectedClass || !selectedSection ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Class & Section</h3>
            <p className="text-muted-foreground">
              Choose a class and section to mark attendance
            </p>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : students.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-muted-foreground">
              There are no active students in this class and section.
            </p>
          </Card>
        ) : (
          <>
            {isAlreadyMarked && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Attendance already marked for this date. You can update it.
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{students.length} Students</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-sm">{presentCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="text-sm">{absentCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <span className="text-sm">{lateCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => markAll('present')}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Present
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => markAll('absent')}
              >
                <X className="w-4 h-4 mr-2" />
                Mark All Absent
              </Button>
            </div>

            {/* Student List */}
            <div className="space-y-2">
              {students.map((student) => {
                const status = getAttendanceStatus(student.id);
                return (
                  <Card 
                    key={student.id}
                    className="cursor-pointer active:scale-[0.99] transition-transform"
                    onClick={() => toggleStatus(student.id)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          status === 'present' ? 'bg-success/10 text-success' :
                          status === 'absent' ? 'bg-destructive/10 text-destructive' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {student.roll_number || '-'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.admission_number}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`capitalize ${
                          status === 'present' ? 'border-success text-success bg-success/10' :
                          status === 'absent' ? 'border-destructive text-destructive bg-destructive/10' :
                          'border-warning text-warning bg-warning/10'
                        }`}
                      >
                        {status === 'present' ? <Check className="w-3 h-3 mr-1" /> :
                         status === 'absent' ? <X className="w-3 h-3 mr-1" /> :
                         <Clock className="w-3 h-3 mr-1" />}
                        {status}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-20 pt-4">
              <Button 
                className="w-full" 
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
