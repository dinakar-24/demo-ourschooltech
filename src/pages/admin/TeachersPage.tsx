import { useState, useCallback, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Users,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeachers, useTeacherStats, useTeacherSubjects, useDeleteTeacher } from '@/hooks/useTeachers';
import { CreateTeacherDialog } from '@/components/admin/CreateTeacherDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

export default function TeachersPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const pagination = usePagination(25);

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery, selectedSubject]);

  const { data: result, isLoading } = useTeachers({ 
    search: searchQuery, 
    subject: selectedSubject,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });
  const teachers = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const { data: stats } = useTeacherStats();
  const { data: subjects = ['All Subjects'] } = useTeacherSubjects();
  const deleteTeacher = useDeleteTeacher();

  const handleAddSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
  }, [queryClient]);

  const handleDelete = async (teacherId: string, userId: string | null) => {
    if (confirm('Are you sure you want to delete this teacher? This will also remove their login account.')) {
      await deleteTeacher.mutateAsync({ teacherId, userId });
    }
  };

  const subjectsCount = new Set(teachers.flatMap(t => t.subjects || [])).size;
  const avgClasses = teachers.length > 0 
    ? Math.round(teachers.reduce((acc, t) => acc + (t.classes?.length || 0), 0) / teachers.length)
    : 0;

  return (
    <AdminLayout title="Teachers">
      <div className="space-y-6 animate-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.total || teachers.length}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-success">{stats?.total || teachers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Subjects</p>
              <p className="text-2xl font-bold text-primary">{subjectsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Classes</p>
              <p className="text-2xl font-bold text-warning">{avgClasses}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </div>
        </div>

        {/* Teachers Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : teachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mb-3 opacity-50" />
                <p className="font-medium">No teachers found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Try a different search term' : 'Add your first teacher to get started'}
                </p>
              </div>
            ) : isMobile ? (
              /* Mobile Card Layout */
              <div className="divide-y">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {teacher.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{teacher.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(teacher.id, teacher.user_id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pl-[52px]">
                      <div>
                        <span className="text-muted-foreground">ID: </span>
                        <span className="font-mono font-medium">{teacher.employee_id}</span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />{teacher.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 pl-[52px]">
                      {teacher.subjects?.map(sub => (
                        <Badge key={sub} variant="outline" className="text-[10px] h-5">{sub}</Badge>
                      ))}
                      {teacher.classes?.map(cls => (
                        <Badge key={cls} variant="secondary" className="text-[10px] h-5">{cls}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">Employee ID</TableHead>
                    <TableHead className="w-[25%]">Name</TableHead>
                    <TableHead className="w-[15%]">Subject</TableHead>
                    <TableHead className="w-[20%]">Classes</TableHead>
                    <TableHead className="w-[15%]">Contact</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium font-mono">{teacher.employee_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                            {teacher.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{teacher.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects?.slice(0, 2).map(sub => (
                            <Badge key={sub} variant="outline" className="text-xs">{sub}</Badge>
                          ))}
                          {(teacher.subjects?.length || 0) > 2 && (
                            <Badge variant="secondary" className="text-xs">+{teacher.subjects!.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes?.slice(0, 2).map(cls => (
                            <Badge key={cls} variant="secondary" className="text-xs">{cls}</Badge>
                          ))}
                          {(teacher.classes?.length || 0) > 2 && (
                            <Badge variant="secondary" className="text-xs">+{teacher.classes!.length - 2}</Badge>
                          )}
                          {(!teacher.classes || teacher.classes.length === 0) && (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {teacher.phone ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{teacher.phone}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(teacher.id, teacher.user_id)}>
                              <Trash2 className="w-4 h-4 mr-2" />Delete
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
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        <CreateTeacherDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleAddSuccess}
        />
      </div>
    </AdminLayout>
  );
}
