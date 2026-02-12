import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
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

  const marksValues = Object.values(marks);
  const avgMarks = marksValues.reduce((a, b) => a + b, 0) / marksValues.length;
  const passCount = marksValues.filter(m => m >= 35).length;
  const failCount = marksValues.length - passCount;
  const topperMarks = Math.max(...marksValues);

  const getGrade = (m: number) => {
    if (m >= 90) return { label: 'A+', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
    if (m >= 75) return { label: 'A', color: 'text-primary', bg: 'bg-primary/10' };
    if (m >= 60) return { label: 'B', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' };
    if (m >= 45) return { label: 'C', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' };
    if (m >= 35) return { label: 'D', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' };
    return { label: 'F', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const getBarColor = (m: number) => {
    if (m >= 90) return 'bg-emerald-500';
    if (m >= 75) return 'bg-primary';
    if (m >= 60) return 'bg-sky-500';
    if (m >= 45) return 'bg-amber-500';
    if (m >= 35) return 'bg-orange-500';
    return 'bg-destructive';
  };

  return (
    <MobileLayout title="Enter Marks" showBack>
      <div className="p-4 space-y-3">
        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-2.5">
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {exams.map(exam => (<SelectItem key={exam} value={exam}>{exam}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="flex-1 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (<SelectItem key={cls} value={cls}>{cls}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="flex-1 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card border border-border/50 rounded-xl p-2.5 text-center">
            <span className="text-lg font-bold text-foreground">{avgMarks.toFixed(0)}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Average</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-2.5 text-center">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{passCount}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pass</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-2.5 text-center">
            <span className="text-lg font-bold text-destructive">{failCount}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Fail</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-0.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-lg font-bold text-foreground">{topperMarks}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Highest</p>
          </div>
        </div>

        {/* Student Marks List */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/50">
          {mockStudents.map((student) => {
            const grade = getGrade(marks[student.id]);
            const percentage = (marks[student.id] / maxMarks) * 100;
            const barColor = getBarColor(marks[student.id]);

            return (
              <div key={student.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  {/* Roll + Grade badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${grade.bg} ${grade.color}`}>
                    {student.rollNo}
                  </div>
                  {/* Name + Grade */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[13px] text-foreground truncate leading-tight">{student.name}</p>
                    <span className={`text-[11px] font-semibold ${grade.color}`}>Grade {grade.label}</span>
                  </div>
                  {/* Marks Input */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      value={marks[student.id]}
                      onChange={(e) => updateMarks(student.id, e.target.value)}
                      className="w-14 h-8 text-center text-sm font-semibold px-1"
                      min={0}
                      max={maxMarks}
                    />
                    <span className="text-[11px] text-muted-foreground">/{maxMarks}</span>
                  </div>
                </div>
                {/* Thin progress bar */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="sticky bottom-20 pt-2">
          <Button className="w-full shadow-lg" size="lg" onClick={saveMarks} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Marks
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
