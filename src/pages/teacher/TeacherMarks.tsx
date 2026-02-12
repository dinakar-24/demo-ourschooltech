import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Save,
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

const mockStudents = [
  { id: '1', name: 'Arjun Verma', rollNo: 1, marks: 85 },
  { id: '2', name: 'Priya Singh', rollNo: 2, marks: 92 },
  { id: '3', name: 'Rahul Kumar', rollNo: 3, marks: 78 },
  { id: '4', name: 'Sneha Patel', rollNo: 4, marks: 88 },
  { id: '5', name: 'Karan Sharma', rollNo: 5, marks: 75 },
  { id: '6', name: 'Ananya Reddy', rollNo: 6, marks: 95 },
  { id: '7', name: 'Vikram Joshi', rollNo: 7, marks: 82 },
  { id: '8', name: 'Meera Iyer', rollNo: 8, marks: 90 },
];

const classes = ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A'];
const exams = ['Unit Test 1', 'Mid-Term Exam', 'Unit Test 2', 'Final Exam'];
const subjects = ['Mathematics', 'Physics', 'Chemistry'];

export default function TeacherMarks() {
  const [selectedClass, setSelectedClass] = useState('Class 8-A');
  const [selectedExam, setSelectedExam] = useState('Unit Test 1');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [marks, setMarks] = useState<Record<string, number>>(
    Object.fromEntries(mockStudents.map(s => [s.id, s.marks]))
  );
  const [maxMarks] = useState(100);
  const [saving, setSaving] = useState(false);

  const updateMarks = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMarks(prev => ({ ...prev, [id]: Math.min(numValue, maxMarks) }));
  };

  const saveMarks = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Marks saved successfully!');
  };

  const avgMarks = Object.values(marks).reduce((a, b) => a + b, 0) / Object.values(marks).length;
  const passCount = Object.values(marks).filter(m => m >= 35).length;
  const failCount = Object.values(marks).length - passCount;
  const topperMarks = Math.max(...Object.values(marks));
  const lowestMarks = Math.min(...Object.values(marks));

  const getGrade = (m: number) => {
    if (m >= 90) return { label: 'A+', color: 'text-success' };
    if (m >= 75) return { label: 'A', color: 'text-primary' };
    if (m >= 60) return { label: 'B', color: 'text-info' };
    if (m >= 45) return { label: 'C', color: 'text-warning' };
    if (m >= 35) return { label: 'D', color: 'text-orange-500' };
    return { label: 'F', color: 'text-destructive' };
  };

  const getBarColor = (m: number) => {
    if (m >= 75) return 'bg-success';
    if (m >= 45) return 'bg-warning';
    if (m >= 35) return 'bg-orange-500';
    return 'bg-destructive';
  };

  return (
    <MobileLayout title="Enter Marks" showBack>
      <div className="p-4 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exams.map(exam => (
                  <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
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
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Dashboard */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground">{selectedSubject}</span>
                <Badge variant="outline" className="text-xs">Max: {maxMarks}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{avgMarks.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">avg marks</span>
              </div>
            </div>
            <div className="grid grid-cols-4 border-t divide-x divide-border">
              <div className="flex flex-col items-center py-3">
                <span className="text-lg font-bold text-foreground">{mockStudents.length}</span>
                <span className="text-[10px] text-muted-foreground">Total</span>
              </div>
              <div className="flex flex-col items-center py-3">
                <span className="text-lg font-bold text-success">{passCount}</span>
                <span className="text-[10px] text-muted-foreground">Pass</span>
              </div>
              <div className="flex flex-col items-center py-3">
                <span className="text-lg font-bold text-destructive">{failCount}</span>
                <span className="text-[10px] text-muted-foreground">Fail</span>
              </div>
              <div className="flex flex-col items-center py-3">
                <span className="text-lg font-bold text-primary">{topperMarks}</span>
                <span className="text-[10px] text-muted-foreground">Highest</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Marks List */}
        <div className="space-y-2">
          {mockStudents.map((student) => {
            const grade = getGrade(marks[student.id]);
            const percentage = (marks[student.id] / maxMarks) * 100;
            const barColor = getBarColor(marks[student.id]);
            
            return (
              <Card key={student.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                          marks[student.id] >= 75 ? 'bg-success/10 text-success' :
                          marks[student.id] >= 35 ? 'bg-warning/10 text-warning' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {student.rollNo}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{student.name}</p>
                          <span className={`text-xs font-semibold ${grade.color}`}>
                            Grade {grade.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={marks[student.id]}
                          onChange={(e) => updateMarks(student.id, e.target.value)}
                          className="w-16 h-9 text-center text-sm font-semibold"
                          min={0}
                          max={maxMarks}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">/{maxMarks}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${percentage}%` }}
                      />
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
            onClick={saveMarks}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Marks
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
