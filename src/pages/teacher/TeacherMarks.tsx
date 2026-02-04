import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Save,
  Users,
  BookOpen,
  CheckCircle,
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

  const updateMarks = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMarks(prev => ({ ...prev, [id]: Math.min(numValue, maxMarks) }));
  };

  const saveMarks = () => {
    toast.success('Marks saved successfully!');
  };

  const avgMarks = Object.values(marks).reduce((a, b) => a + b, 0) / Object.values(marks).length;
  const passCount = Object.values(marks).filter(m => m >= 35).length;

  return (
    <MobileLayout title="Enter Marks" showBack>
      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exams.map(exam => (
                <SelectItem key={exam} value={exam}>{exam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(sub => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{mockStudents.length}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{avgMarks.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{passCount}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Max Marks Info */}
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">Max Marks: {maxMarks}</span>
          <Badge variant="outline">{selectedSubject}</Badge>
        </div>

        {/* Student Marks List */}
        <div className="space-y-2">
          {mockStudents.map((student) => (
            <Card key={student.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    marks[student.id] >= 75 ? 'bg-success/10 text-success' :
                    marks[student.id] >= 35 ? 'bg-warning/10 text-warning' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {student.rollNo}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {marks[student.id] >= 75 ? 'Distinction' :
                       marks[student.id] >= 60 ? 'First Class' :
                       marks[student.id] >= 45 ? 'Second Class' :
                       marks[student.id] >= 35 ? 'Pass' : 'Fail'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={marks[student.id]}
                    onChange={(e) => updateMarks(student.id, e.target.value)}
                    className="w-16 h-9 text-center"
                    min={0}
                    max={maxMarks}
                  />
                  <span className="text-sm text-muted-foreground">/{maxMarks}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Save Button */}
        <div className="sticky bottom-20 pt-4">
          <Button className="w-full" size="lg" onClick={saveMarks}>
            <Save className="w-4 h-4 mr-2" />
            Save Marks
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
