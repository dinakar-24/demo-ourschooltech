import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const mockStudents = [
  { id: '1', name: 'Arjun Verma', rollNo: 1, status: 'present' },
  { id: '2', name: 'Priya Singh', rollNo: 2, status: 'present' },
  { id: '3', name: 'Rahul Kumar', rollNo: 3, status: 'absent' },
  { id: '4', name: 'Sneha Patel', rollNo: 4, status: 'present' },
  { id: '5', name: 'Karan Sharma', rollNo: 5, status: 'present' },
  { id: '6', name: 'Ananya Reddy', rollNo: 6, status: 'late' },
  { id: '7', name: 'Vikram Joshi', rollNo: 7, status: 'present' },
  { id: '8', name: 'Meera Iyer', rollNo: 8, status: 'present' },
  { id: '9', name: 'Rohan Gupta', rollNo: 9, status: 'present' },
  { id: '10', name: 'Kavita Das', rollNo: 10, status: 'present' },
];

const classes = ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A'];

export default function TeacherAttendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState('Class 8-A');
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>(
    Object.fromEntries(mockStudents.map(s => [s.id, s.status as 'present' | 'absent' | 'late']))
  );

  const markAll = (status: 'present' | 'absent') => {
    const newAttendance = Object.fromEntries(
      mockStudents.map(s => [s.id, status])
    );
    setAttendance(newAttendance);
  };

  const toggleStatus = (id: string) => {
    setAttendance(prev => {
      const current = prev[id];
      const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
      return { ...prev, [id]: next };
    });
  };

  const saveAttendance = () => {
    toast.success('Attendance saved successfully!');
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;

  return (
    <MobileLayout title="Mark Attendance" showBack>
      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{mockStudents.length} Students</span>
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
          {mockStudents.map((student) => (
            <Card 
              key={student.id}
              className="cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => toggleStatus(student.id)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    attendance[student.id] === 'present' ? 'bg-success/10 text-success' :
                    attendance[student.id] === 'absent' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {student.rollNo}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Roll No. {student.rollNo}</p>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className={`capitalize ${
                    attendance[student.id] === 'present' ? 'border-success text-success bg-success/10' :
                    attendance[student.id] === 'absent' ? 'border-destructive text-destructive bg-destructive/10' :
                    'border-warning text-warning bg-warning/10'
                  }`}
                >
                  {attendance[student.id] === 'present' ? <Check className="w-3 h-3 mr-1" /> :
                   attendance[student.id] === 'absent' ? <X className="w-3 h-3 mr-1" /> :
                   <Clock className="w-3 h-3 mr-1" />}
                  {attendance[student.id]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Save Button */}
        <div className="sticky bottom-20 pt-4">
          <Button className="w-full" size="lg" onClick={saveAttendance}>
            <Save className="w-4 h-4 mr-2" />
            Save Attendance
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
