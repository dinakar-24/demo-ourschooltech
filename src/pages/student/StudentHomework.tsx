import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Calendar, 
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
} from 'lucide-react';

const mockHomework = [
  { 
    id: '1', 
    subject: 'Mathematics', 
    title: 'Chapter 5 - Quadratic Equations', 
    description: 'Complete exercises 5.1 and 5.2 from the textbook',
    dueDate: '2024-01-20',
    teacher: 'Mrs. Sharma',
    status: 'pending',
  },
  { 
    id: '2', 
    subject: 'Science', 
    title: 'Lab Report - Light Experiment', 
    description: 'Write detailed lab report for the light refraction experiment',
    dueDate: '2024-01-22',
    teacher: 'Mr. Gupta',
    status: 'pending',
  },
  { 
    id: '3', 
    subject: 'English', 
    title: 'Essay Writing', 
    description: 'Write an essay on "Technology in Education"',
    dueDate: '2024-01-18',
    teacher: 'Ms. Patel',
    status: 'submitted',
  },
  { 
    id: '4', 
    subject: 'Hindi', 
    title: 'Grammar Exercises', 
    description: 'Complete exercises from Chapter 8',
    dueDate: '2024-01-15',
    teacher: 'Mrs. Verma',
    status: 'graded',
    grade: 'A',
  },
];

export default function StudentHomework() {
  const getStatusBadge = (status: string, grade?: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-primary text-primary-foreground">Submitted</Badge>;
      case 'graded':
        return <Badge className="bg-success text-success-foreground">Graded: {grade}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = mockHomework.filter(h => h.status === 'pending').length;

  return (
    <MobileLayout title="Homework" showBack>
      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <AlertCircle className="w-5 h-5 text-warning mx-auto mb-1" />
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">1</p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-lg font-bold">1</p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </CardContent>
          </Card>
        </div>

        {/* Homework List */}
        <div className="space-y-3">
          {mockHomework.map((hw) => (
            <Card key={hw.id} className={hw.status === 'pending' ? 'border-warning/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{hw.subject}</p>
                      <p className="text-xs text-muted-foreground">{hw.teacher}</p>
                    </div>
                  </div>
                  {getStatusBadge(hw.status, hw.grade)}
                </div>
                
                <h3 className="font-medium mb-1">{hw.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{hw.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Due: {hw.dueDate}
                  </div>
                  {hw.status === 'pending' && (
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
