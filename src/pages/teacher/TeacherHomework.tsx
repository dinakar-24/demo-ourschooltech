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
  Clock,
  Eye,
  Edit,
  Users,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const mockHomework = [
  { 
    id: '1', 
    class: 'Class 8-A', 
    subject: 'Mathematics', 
    title: 'Chapter 5 - Quadratic Equations', 
    description: 'Complete exercises 5.1 and 5.2 from the textbook',
    dueDate: '2024-01-20',
    submissions: 35,
    total: 42,
    status: 'active'
  },
  { 
    id: '2', 
    class: 'Class 9-B', 
    subject: 'Mathematics', 
    title: 'Trigonometry Practice', 
    description: 'Solve practice problems from worksheet',
    dueDate: '2024-01-22',
    submissions: 28,
    total: 44,
    status: 'active'
  },
  { 
    id: '3', 
    class: 'Class 10-A', 
    subject: 'Physics', 
    title: 'Light Chapter Summary', 
    description: 'Write summary of chapter 10',
    dueDate: '2024-01-18',
    submissions: 45,
    total: 48,
    status: 'completed'
  },
];

const classes = ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A'];
const subjects = ['Mathematics', 'Physics', 'Chemistry'];

export default function TeacherHomework() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const handlePost = () => {
    toast.success('Homework posted successfully!');
    setIsAddDialogOpen(false);
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
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
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
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g., Chapter 5 Exercises" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe the homework assignment..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handlePost}>
                Post Homework
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Homework List */}
        <div className="space-y-3">
          {mockHomework.map((hw) => (
            <Card key={hw.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{hw.class}</p>
                      <p className="text-xs text-muted-foreground">{hw.subject}</p>
                    </div>
                  </div>
                  <Badge variant={hw.status === 'active' ? 'default' : 'secondary'}>
                    {hw.status}
                  </Badge>
                </div>
                
                <h3 className="font-semibold mb-1">{hw.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{hw.description}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {hw.dueDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {hw.submissions}/{hw.total} submitted
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(hw.submissions / hw.total) * 100}%` }}
                  />
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
      </div>
    </MobileLayout>
  );
}
