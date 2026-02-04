import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Award, 
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  ChevronRight,
} from 'lucide-react';

const mockResults = {
  latestExam: {
    name: 'Mid-Term Examination',
    percentage: 85.4,
    rank: 5,
    totalStudents: 42,
    grade: 'A',
  },
  subjects: [
    { name: 'Mathematics', marks: 88, total: 100, grade: 'A' },
    { name: 'Science', marks: 82, total: 100, grade: 'A' },
    { name: 'English', marks: 90, total: 100, grade: 'A+' },
    { name: 'Hindi', marks: 78, total: 100, grade: 'B+' },
    { name: 'Social Studies', marks: 85, total: 100, grade: 'A' },
    { name: 'Computer', marks: 92, total: 100, grade: 'A+' },
  ],
  previousExams: [
    { name: 'Unit Test 1', percentage: 82, grade: 'A', date: '2023-11-15' },
    { name: 'First Term', percentage: 78, grade: 'B+', date: '2023-09-20' },
  ],
};

export default function ParentResults() {
  const { user } = useAuth();
  const childName = user?.childName || 'Your Child';

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <MobileLayout title="Results" showBack>
      <div className="p-4 space-y-4">
        {/* Latest Exam Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <p className="text-primary-foreground/70 text-sm">{mockResults.latestExam.name}</p>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-4xl font-bold">{mockResults.latestExam.percentage}%</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 text-white">
                    Grade: {mockResults.latestExam.grade}
                  </Badge>
                  <span className="text-sm text-primary-foreground/80">
                    Rank: {mockResults.latestExam.rank}/{mockResults.latestExam.totalStudents}
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject-wise Marks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Subject-wise Marks
            </h3>
            <Button variant="ghost" size="sm" className="text-primary">
              <Download className="w-4 h-4 mr-1" />
              Report Card
            </Button>
          </div>
          <Card>
            <CardContent className="p-4 space-y-4">
              {mockResults.subjects.map((subject, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{subject.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                        {subject.marks}/{subject.total}
                      </span>
                      <Badge variant="outline" className={getGradeColor(subject.grade)}>
                        {subject.grade}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={(subject.marks / subject.total) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Previous Exams */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Previous Exams
          </h3>
          <div className="space-y-2">
            {mockResults.previousExams.map((exam, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">{exam.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{exam.percentage}%</p>
                    <Badge variant="outline" className={getGradeColor(exam.grade)}>
                      {exam.grade}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
