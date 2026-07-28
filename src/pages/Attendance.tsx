import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  AlertCircle,
  Users,
  Save,
} from 'lucide-react';

interface StudentAttendance {
  id: string;
  rollNo: number;
  name: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'unmarked';
}

const classStudents: StudentAttendance[] = [
  { id: '1', rollNo: 1, name: 'Arjun Sharma', status: 'unmarked' },
  { id: '2', rollNo: 2, name: 'Priya Patel', status: 'unmarked' },
  { id: '3', rollNo: 3, name: 'Rahul Verma', status: 'unmarked' },
  { id: '4', rollNo: 4, name: 'Ananya Singh', status: 'unmarked' },
  { id: '5', rollNo: 5, name: 'Vikram Rao', status: 'unmarked' },
  { id: '6', rollNo: 6, name: 'Neha Gupta', status: 'unmarked' },
  { id: '7', rollNo: 7, name: 'Amit Kumar', status: 'unmarked' },
  { id: '8', rollNo: 8, name: 'Kavya Nair', status: 'unmarked' },
  { id: '9', rollNo: 9, name: 'Ravi Menon', status: 'unmarked' },
  { id: '10', rollNo: 10, name: 'Sanya Reddy', status: 'unmarked' },
];

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentAttendance[]>(classStudents);
  const [saving, setSaving] = useState(false);

  const updateStatus = (id: string, status: StudentAttendance['status']) => {
    setStudents(prev =>
      prev.map(s => s.id === id ? { ...s, status } : s)
    );
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  const getStats = () => {
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const late = students.filter(s => s.status === 'late').length;
    const unmarked = students.filter(s => s.status === 'unmarked').length;
    return { present, absent, late, unmarked, total: students.length };
  };

  const stats = getStats();

  const getStatusColor = (status: StudentAttendance['status']) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'absent': return 'bg-destructive text-destructive-foreground';
      case 'late': return 'bg-warning text-warning-foreground';
      case 'half_day': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout title="Mark Attendance">
      <div className="space-y-6 animate-fade-up">
        {/* Header Controls */}
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field py-2 px-3 min-w-[140px]"
              >
                <option value="10-A">Class 10-A</option>
                <option value="10-B">Class 10-B</option>
                <option value="9-A">Class 9-A</option>
                <option value="9-B">Class 9-B</option>
              </select>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field py-2 px-3 w-auto"
                />
                <Button variant="ghost" size="icon-sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                <Check className="w-4 h-4" />
                Mark All Present
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card-metric !p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-bold text-foreground">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="card-metric !p-3 text-center bg-success-muted">
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span className="text-lg font-bold text-success">{stats.present}</span>
            </div>
            <p className="text-xs text-success/80">Present</p>
          </div>
          <div className="card-metric !p-3 text-center bg-destructive-muted">
            <div className="flex items-center justify-center gap-2">
              <X className="w-4 h-4 text-destructive" />
              <span className="text-lg font-bold text-destructive">{stats.absent}</span>
            </div>
            <p className="text-xs text-destructive/80">Absent</p>
          </div>
          <div className="card-metric !p-3 text-center bg-warning-muted">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-lg font-bold text-warning">{stats.late}</span>
            </div>
            <p className="text-xs text-warning/80">Late</p>
          </div>
          <div className="card-metric !p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-bold text-muted-foreground">{stats.unmarked}</span>
            </div>
            <p className="text-xs text-muted-foreground">Unmarked</p>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {student.rollNo}
                  </div>
                  <span className="font-medium text-foreground">{student.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {(['present', 'absent', 'late'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(student.id, status)}
                      className={cn(
                        "w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-lg text-sm font-medium transition-all",
                        student.status === status
                          ? getStatusColor(status)
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {status === 'present' && <Check className="w-4 h-4 md:hidden" />}
                      {status === 'absent' && <X className="w-4 h-4 md:hidden" />}
                      {status === 'late' && <Clock className="w-4 h-4 md:hidden" />}
                      <span className="hidden md:inline capitalize">{status}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button - Sticky on Mobile */}
        <div className="sticky bottom-20 md:bottom-6 z-20">
          <Button
            onClick={handleSave}
            disabled={saving || stats.unmarked === stats.total}
            className="w-full md:w-auto"
            size="lg"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
      </div>
    </DashboardLayout>
  );
}
