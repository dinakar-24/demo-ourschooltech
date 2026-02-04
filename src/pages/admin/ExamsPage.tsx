import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';

const mockExams = [
  { 
    id: '1', 
    name: 'Mid-Term Examination', 
    type: 'term',
    startDate: '2024-02-15', 
    endDate: '2024-02-25',
    classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    status: 'upcoming',
    subjects: 6,
  },
  { 
    id: '2', 
    name: 'Unit Test 1', 
    type: 'unit',
    startDate: '2024-01-20', 
    endDate: '2024-01-22',
    classes: ['Class 8', 'Class 9'],
    status: 'completed',
    subjects: 5,
  },
  { 
    id: '3', 
    name: 'Pre-Board Examination', 
    type: 'board',
    startDate: '2024-01-25', 
    endDate: '2024-02-05',
    classes: ['Class 10'],
    status: 'ongoing',
    subjects: 5,
  },
  { 
    id: '4', 
    name: 'Final Examination', 
    type: 'term',
    startDate: '2024-03-10', 
    endDate: '2024-03-25',
    classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    status: 'scheduled',
    subjects: 6,
  },
];

const mockSchedule = [
  { date: '2024-02-15', subject: 'Mathematics', time: '9:00 AM - 12:00 PM', class: 'Class 10-A' },
  { date: '2024-02-16', subject: 'Science', time: '9:00 AM - 12:00 PM', class: 'Class 10-A' },
  { date: '2024-02-17', subject: 'English', time: '9:00 AM - 12:00 PM', class: 'Class 10-A' },
  { date: '2024-02-19', subject: 'Hindi', time: '9:00 AM - 12:00 PM', class: 'Class 10-A' },
  { date: '2024-02-20', subject: 'Social Studies', time: '9:00 AM - 12:00 PM', class: 'Class 10-A' },
];

export default function ExamsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'ongoing':
        return <Badge className="bg-primary text-primary-foreground">Ongoing</Badge>;
      case 'upcoming':
        return <Badge className="bg-warning text-warning-foreground">Upcoming</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Examinations">
      <div className="space-y-6 animate-fade-up">
        <Tabs defaultValue="exams" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="exams">All Exams</TabsTrigger>
              <TabsTrigger value="schedule">Exam Schedule</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Examination</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Exam Name</Label>
                    <Input placeholder="e.g., Mid-Term Examination" />
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unit Test</SelectItem>
                        <SelectItem value="term">Term Exam</SelectItem>
                        <SelectItem value="board">Board Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Classes</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="6-8">Class 6-8</SelectItem>
                        <SelectItem value="9-10">Class 9-10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsAddDialogOpen(false)}>Create Exam</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="exams" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {mockExams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{exam.name}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize mt-1">
                          {exam.type} Examination
                        </p>
                      </div>
                      {getStatusBadge(exam.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {exam.startDate} - {exam.endDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {exam.classes.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      {exam.subjects} Subjects
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam Schedule - Mid-Term Examination</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSchedule.map((item, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold text-primary">{item.date.split('-')[2]}</p>
                          <p className="text-xs text-muted-foreground">Feb</p>
                        </div>
                        <div>
                          <p className="font-medium">{item.subject}</p>
                          <p className="text-sm text-muted-foreground">{item.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Results Management</h3>
                <p className="text-muted-foreground mb-4">
                  View, enter, and publish examination results for all classes.
                </p>
                <Button>Enter Results</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
