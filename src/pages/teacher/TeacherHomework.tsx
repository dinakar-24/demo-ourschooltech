import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  BookOpen,
  Calendar,
  Eye,
  Edit,
  Users,
  Loader2,
  FileText,
} from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { useTeacherHomework, useCreateHomework } from '@/hooks/useHomework';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Studies', 'Computer Science'];

export default function TeacherHomework() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: classes } = useClasses();
  const { data: homework, isLoading } = useTeacherHomework();
  const createHomework = useCreateHomework();

  const selectedClass = classes?.find(c => c.id === selectedClassId);

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubject || !title || !dueDate) {
      return;
    }

    await createHomework.mutateAsync({
      class_id: selectedClassId,
      section_id: selectedSectionId || undefined,
      subject: selectedSubject,
      title,
      description: description || undefined,
      due_date: dueDate,
    });

    setSelectedClassId('');
    setSelectedSectionId('');
    setSelectedSubject('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setIsAddDialogOpen(false);
  };

  const getStatusBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (due < today) {
      return <Badge variant="secondary">completed</Badge>;
    }
    return <Badge variant="default">active</Badge>;
  };

  return (
    <MobileLayout title="Homework" showBack>
      <div className="p-4 space-y-4">
        {/* Post New Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Post New Homework
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post Homework</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={selectedClassId} onValueChange={(v) => {
                    setSelectedClassId(v);
                    setSelectedSectionId('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section (Optional)</Label>
                  <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClass?.sections.map(sec => (
                        <SelectItem key={sec.id} value={sec.id}>Section {sec.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  placeholder="e.g., Chapter 5 Exercises" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe the homework assignment..."
                  className="min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={createHomework.isPending || !selectedClassId || !selectedSubject || !title || !dueDate}
              >
                {createHomework.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Post Homework
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Homework List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : homework?.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Homework Posted</h3>
            <p className="text-muted-foreground">
              Post your first homework assignment to get started.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {homework?.map((hw) => (
              <Card key={hw.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{hw.class?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {hw.subject} {hw.section && `• Section ${hw.section.name}`}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(hw.due_date)}
                  </div>
                  
                  <h3 className="font-semibold mb-1">{hw.title}</h3>
                  {hw.description && (
                    <p className="text-sm text-muted-foreground mb-3">{hw.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {format(new Date(hw.due_date), 'dd MMM yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Posted {format(new Date(hw.created_at), 'dd MMM')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
