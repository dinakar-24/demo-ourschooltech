import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Users,
  GraduationCap,
  Edit,
  BookOpen,
} from 'lucide-react';

const mockClasses = [
  { id: '1', name: 'Class 6', sections: [
    { section: 'A', students: 42, classTeacher: 'Mrs. Sunita Patel', subjects: ['Math', 'Science', 'English', 'Hindi', 'Social Studies'] },
    { section: 'B', students: 40, classTeacher: 'Mr. Amit Singh', subjects: ['Math', 'Science', 'English', 'Hindi', 'Social Studies'] },
  ]},
  { id: '2', name: 'Class 7', sections: [
    { section: 'A', students: 45, classTeacher: 'Mrs. Deepa Sharma', subjects: ['Math', 'Science', 'English', 'Hindi', 'Social Studies'] },
    { section: 'B', students: 43, classTeacher: 'Mr. Rajesh Kumar', subjects: ['Math', 'Science', 'English', 'Hindi', 'Social Studies'] },
    { section: 'C', students: 41, classTeacher: 'Mrs. Priya Verma', subjects: ['Math', 'Science', 'English', 'Hindi', 'Social Studies'] },
  ]},
  { id: '3', name: 'Class 8', sections: [
    { section: 'A', students: 44, classTeacher: 'Mr. Vikram Joshi', subjects: ['Math', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer'] },
    { section: 'B', students: 42, classTeacher: 'Mrs. Anita Reddy', subjects: ['Math', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer'] },
  ]},
  { id: '4', name: 'Class 9', sections: [
    { section: 'A', students: 46, classTeacher: 'Mr. Suresh Iyer', subjects: ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'] },
    { section: 'B', students: 44, classTeacher: 'Mrs. Meera Patel', subjects: ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'] },
  ]},
  { id: '5', name: 'Class 10', sections: [
    { section: 'A', students: 48, classTeacher: 'Mr. Dinesh Kumar', subjects: ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'] },
    { section: 'B', students: 45, classTeacher: 'Mrs. Kavita Sharma', subjects: ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'] },
  ]},
];

export default function ClassesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const totalStudents = mockClasses.reduce((acc, cls) => 
    acc + cls.sections.reduce((sAcc, sec) => sAcc + sec.students, 0), 0
  );
  const totalSections = mockClasses.reduce((acc, cls) => acc + cls.sections.length, 0);

  return (
    <AdminLayout title="Classes & Sections">
      <div className="space-y-6 animate-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold text-foreground">{mockClasses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Sections</p>
              <p className="text-2xl font-bold text-primary">{totalSections}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-success">{totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg. per Section</p>
              <p className="text-2xl font-bold text-foreground">{Math.round(totalStudents / totalSections)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  <Input placeholder="e.g., Class 11" />
                </div>
                <div className="space-y-2">
                  <Label>Number of Sections</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sections" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} Section{n > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>Add Class</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockClasses.map((cls) => (
            <Card key={cls.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <Button variant="ghost" size="icon-sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {cls.sections.length} Sections
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {cls.sections.reduce((acc, s) => acc + s.students, 0)} Students
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {cls.sections.map((section) => (
                  <div 
                    key={section.section} 
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-semibold">
                          Section {section.section}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {section.students} students
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Class Teacher:</span>
                      <span className="font-medium">{section.classTeacher}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {section.subjects.slice(0, 4).map(sub => (
                        <Badge key={sub} variant="secondary" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                      {section.subjects.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{section.subjects.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
