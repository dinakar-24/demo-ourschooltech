import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddStudentDialog } from '@/components/admin/AddStudentDialog';
import {
  Search,
  Plus,
  Upload,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Loader2,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStudents, useStudentStats, useCreateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useIsMobile } from '@/hooks/use-mobile';
import { StudentCard } from '@/components/admin/StudentCard';

export default function StudentsPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const pagination = usePagination(25);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery, selectedClass, selectedSection]);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    admission_number: '',
    class_name: '',
    section: '',
    roll_number: '',
    gender: '',
    date_of_birth: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  });

  // Fetch data
  const { data: result, isLoading: studentsLoading } = useStudents({
    className: selectedClass,
    section: selectedSection,
    search: searchQuery,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });
  const students = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: classes } = useClasses();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();

  const classNames = ['All Classes', ...(classes?.map(c => c.name) || [])];
  const sections = ['All Sections', 'A', 'B', 'C', 'D'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.admission_number || !formData.class_name || !formData.section) {
      toast.error('Please fill in all required fields');
      return;
    }

    await createStudent.mutateAsync({
      full_name: formData.full_name,
      admission_number: formData.admission_number,
      class_name: formData.class_name,
      section: formData.section,
      roll_number: formData.roll_number ? parseInt(formData.roll_number) : undefined,
      gender: formData.gender || undefined,
      date_of_birth: formData.date_of_birth || undefined,
      parent_name: formData.parent_name || undefined,
      parent_phone: formData.parent_phone || undefined,
      parent_email: formData.parent_email || undefined,
    });

    setFormData({
      full_name: '',
      admission_number: '',
      class_name: '',
      section: '',
      roll_number: '',
      gender: '',
      date_of_birth: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
    });
    setIsAddDialogOpen(false);
  };

  const handleDelete = async (studentId: string) => {
    if (confirm('Are you sure you want to deactivate this student?')) {
      await deleteStudent.mutateAsync(studentId);
    }
  };

  return (
    <AdminLayout title="Students">
      <div className="space-y-6 animate-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Students</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-success">{stats?.active || 0}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">New This Month</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-primary">{stats?.newThisMonth || 0}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Inactive</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-destructive">{stats?.inactive || 0}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classNames.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(sec => (
                  <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <AddStudentDialog
              classes={classes}
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              isPending={createStudent.isPending}
              isOpen={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
            />
          </div>
        </div>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            {studentsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground px-4">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No students found</p>
                <p className="text-sm mt-1">Add your first student to get started</p>
              </div>
            ) : isMobile ? (
              /* Mobile Card Layout */
              <div className="divide-y">
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              /* Desktop Table Layout */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.admission_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {student.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{student.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.class_name} - {student.section}</TableCell>
                      <TableCell>{student.roll_number || '-'}</TableCell>
                      <TableCell>{student.parent_name || '-'}</TableCell>
                      <TableCell>
                        {student.parent_phone ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {student.parent_phone}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(student.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalCount={totalCount}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              isLoading={studentsLoading}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
