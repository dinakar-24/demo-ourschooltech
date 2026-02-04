import { useState, useMemo } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Edit,
  Trash2,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useExams, ExamFormData } from '@/hooks/useExams';
import { useClasses } from '@/hooks/useClasses';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education',
];

export default function ExamsPage() {
  const { exams, loading, stats, createExam, updateExam, deleteExam } = useExams();
  const { data: classes = [] } = useClasses();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<typeof exams[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ExamFormData>({
    name: '',
    subject: '',
    class_name: '',
    exam_date: '',
    max_marks: 100,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      class_name: '',
      exam_date: '',
      max_marks: 100,
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.subject || !formData.class_name || !formData.exam_date) {
      return;
    }
    setIsSubmitting(true);
    const success = await createExam(formData);
    if (success) {
      setIsAddDialogOpen(false);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleEdit = async () => {
    if (!selectedExam) return;
    setIsSubmitting(true);
    const success = await updateExam(selectedExam.id, formData);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedExam(null);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    const success = await deleteExam(selectedExam.id);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedExam(null);
    }
  };

  const openEditDialog = (exam: typeof exams[0]) => {
    setSelectedExam(exam);
    setFormData({
      name: exam.name,
      subject: exam.subject,
      class_name: exam.class_name,
      exam_date: exam.exam_date,
      max_marks: exam.max_marks,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (exam: typeof exams[0]) => {
    setSelectedExam(exam);
    setDeleteDialogOpen(true);
  };

  const getExamStatus = (examDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(examDate);
    date.setHours(0, 0, 0, 0);
    
    if (date > today) return 'upcoming';
    if (date < today) return 'completed';
    return 'today';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'today':
        return <Badge className="bg-primary text-primary-foreground">Today</Badge>;
      case 'upcoming':
        return <Badge className="bg-warning text-warning-foreground">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Group exams by date for schedule view
  const examSchedule = useMemo(() => {
    const upcoming = exams
      .filter(e => new Date(e.exam_date) >= new Date())
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
      .slice(0, 10);
    return upcoming;
  }, [exams]);

  // Unique class names from classes data
  const classNames = useMemo(() => {
    return classes.map(c => c.name);
  }, [classes]);

  const ExamFormFields = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Exam Name</Label>
        <Input 
          placeholder="e.g., Mid-Term Examination" 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select 
            value={formData.subject}
            onValueChange={(value) => setFormData({ ...formData, subject: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Class</Label>
          <Select 
            value={formData.class_name}
            onValueChange={(value) => setFormData({ ...formData, class_name: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Exam Date</Label>
          <Input 
            type="date" 
            value={formData.exam_date}
            onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Marks</Label>
          <Input 
            type="number" 
            value={formData.max_marks}
            onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) || 100 })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Examinations">
      <div className="space-y-6 animate-fade-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Exams</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-warning">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.upcoming}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.completed}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-primary">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.thisMonth}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="exams" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="exams">All Exams</TabsTrigger>
              <TabsTrigger value="schedule">Exam Schedule</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Examination</DialogTitle>
                </DialogHeader>
                <ExamFormFields />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Exam
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="exams" className="space-y-4">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-24 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : exams.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Exams Created</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first exam to get started.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Exam
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{exam.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {exam.subject}
                          </p>
                        </div>
                        {getStatusBadge(getExamStatus(exam.exam_date))}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(exam.exam_date), 'dd MMM yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="w-4 h-4" />
                          {exam.class_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        Max Marks: {exam.max_marks}
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openEditDialog(exam)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(exam)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Exam Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : examSchedule.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming exams scheduled.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {examSchedule.map((exam) => (
                      <div 
                        key={exam.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-lg font-bold text-primary">
                              {format(new Date(exam.exam_date), 'dd')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(exam.exam_date), 'MMM')}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">{exam.subject}</p>
                            <p className="text-sm text-muted-foreground">{exam.class_name} • {exam.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          {exam.max_marks} marks
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Examination</DialogTitle>
          </DialogHeader>
          <ExamFormFields />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedExam?.name}"? This will also delete all associated results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
