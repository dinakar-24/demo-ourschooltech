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
  Loader2,
  Trash2,
} from 'lucide-react';
import { useClasses, useCreateClass, useDeleteClass } from '@/hooks/useClasses';
import { useTeachers } from '@/hooks/useTeachers';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ClassesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [numSections, setNumSections] = useState('1');

  const { data: classes, isLoading } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();

  const totalStudents = classes?.reduce((acc, cls) => 
    acc + cls.sections.reduce((sAcc, sec) => sAcc + (sec.student_count || 0), 0), 0
  ) || 0;
  const totalSections = classes?.reduce((acc, cls) => acc + cls.sections.length, 0) || 0;

  const handleSubmit = async () => {
    if (!className) {
      toast.error('Please enter a class name');
      return;
    }

    const sectionCount = parseInt(numSections);
    const sectionNames = Array.from({ length: sectionCount }, (_, i) => 
      String.fromCharCode(65 + i) // A, B, C, D...
    );

    await createClass.mutateAsync({
      name: className,
      sections: sectionNames,
    });

    setClassName('');
    setNumSections('1');
    setIsAddDialogOpen(false);
  };

  const handleDelete = async (classId: string) => {
    if (confirm('Are you sure you want to delete this class? This will also delete all sections.')) {
      await deleteClass.mutateAsync(classId);
    }
  };

  return (
    <AdminLayout title="Classes & Sections">
      <div className="space-y-6 animate-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Classes</p>
              {isLoading ? (
                <Skeleton className="h-8 w-8 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{classes?.length || 0}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Sections</p>
              {isLoading ? (
                <Skeleton className="h-8 w-8 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-primary">{totalSections}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Students</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-success">{totalStudents}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg. per Section</p>
              {isLoading ? (
                <Skeleton className="h-8 w-8 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {totalSections > 0 ? Math.round(totalStudents / totalSections) : 0}
                </p>
              )}
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
                  <Input 
                    placeholder="e.g., Class 11" 
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Sections</Label>
                  <Select value={numSections} onValueChange={setNumSections}>
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
                <Button onClick={handleSubmit} disabled={createClass.isPending}>
                  {createClass.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Class
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : classes?.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first class to start organizing students and sections.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Class
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes?.map((cls) => (
              <Card key={cls.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleDelete(cls.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {cls.sections.length} Sections
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {cls.sections.reduce((acc, s) => acc + (s.student_count || 0), 0)} Students
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {cls.sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sections added yet
                    </p>
                  ) : (
                    cls.sections.map((section) => (
                      <div 
                        key={section.id} 
                        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-semibold">
                              Section {section.name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {section.student_count || 0} students
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Class Teacher:</span>
                          <span className="font-medium">
                            {section.teacher?.full_name || 'Not assigned'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
