import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building2 } from 'lucide-react';
import { TableSkeleton, CardSkeleton, ErrorState } from '@/components/ui/data-states';
import { useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool, useToggleSchoolStatus, School, SchoolFormData } from '@/hooks/useSchools';
import { SchoolFormDialog } from '@/components/super-admin/schools/SchoolFormDialog';
import { DeleteSchoolDialog } from '@/components/super-admin/schools/DeleteSchoolDialog';
import { SchoolsTable } from '@/components/super-admin/schools/SchoolsTable';
import { SchoolCard } from '@/components/super-admin/schools/SchoolCard';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SchoolsPage() {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [searchQuery, setSearchQuery] = useState('');
  const pagination = usePagination(25);

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery]);

  const { data: result, isLoading, isError, refetch } = useSchools({ search: searchQuery, page: pagination.page, pageSize: pagination.pageSize });
  const schools = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();
  const deleteSchoolMutation = useDeleteSchool();
  const toggleStatusMutation = useToggleSchoolStatus();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [togglingSchool, setTogglingSchool] = useState<School | null>(null);

  const handleOpenAddDialog = useCallback(() => {
    setEditingSchool(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((school: School) => {
    setEditingSchool(school);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((school: School) => {
    setDeletingSchool(school);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingSchool) return;
    await deleteSchoolMutation.mutateAsync(deletingSchool.id);
    setDeletingSchool(null);
  }, [deleteSchoolMutation, deletingSchool]);

  const handleSubmit = useCallback(async (formData: SchoolFormData, logoPreview: string | null) => {
    try {
      if (editingSchool) {
        await updateSchool.mutateAsync({ id: editingSchool.id, ...formData, logoPreview });
      } else {
        await createSchool.mutateAsync({ ...formData, logoPreview });
      }
      setIsDialogOpen(false);
      setEditingSchool(null);
    } catch {
      // Error handled by mutation
    }
  }, [createSchool, updateSchool, editingSchool]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingSchool(null);
    }
  }, []);

  const handleImpersonate = useCallback((school: School) => {
    startImpersonation({ id: school.id, name: school.name });
    navigate('/admin/dashboard');
  }, [startImpersonation, navigate]);

  const handleToggleStatus = useCallback((school: School) => {
    setTogglingSchool(school);
  }, []);

  const handleConfirmToggle = useCallback(async () => {
    if (!togglingSchool) return;
    const newStatus = togglingSchool.is_active === false ? true : false;
    await toggleStatusMutation.mutateAsync({ schoolId: togglingSchool.id, isActive: newStatus });
    setTogglingSchool(null);
  }, [toggleStatusMutation, togglingSchool]);

  const isSubmitting = createSchool.isPending || updateSchool.isPending;
  const togglingSchoolIsActive = togglingSchool?.is_active !== false;

  return (
    <SuperAdminLayout title="Schools Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button onClick={handleOpenAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        </div>

        {/* Schools Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" />
              All Schools ({totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <div className="md:hidden"><CardSkeleton count={3} /></div>
                <div className="hidden md:block"><TableSkeleton rows={5} columns={6} /></div>
              </>
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : schools.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No schools found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Try a different search term' : 'Add your first school to get started'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {schools.map((school) => (
                    <SchoolCard
                      key={school.id}
                      school={school}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onImpersonate={handleImpersonate}
                      onToggleStatus={handleToggleStatus}
                      isToggling={toggleStatusMutation.isPending && togglingSchool?.id === school.id}
                    />
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <SchoolsTable
                    schools={schools}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onImpersonate={handleImpersonate}
                    onToggleStatus={handleToggleStatus}
                    isTogglingId={toggleStatusMutation.isPending ? togglingSchool?.id || null : null}
                  />
                </div>
              </>
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

        {/* Form Dialog */}
        <SchoolFormDialog
          open={isDialogOpen}
          onOpenChange={handleDialogChange}
          editingSchool={editingSchool}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteSchoolDialog
          open={!!deletingSchool}
          onOpenChange={(open) => !open && setDeletingSchool(null)}
          schoolName={deletingSchool?.name || ''}
          onConfirm={handleConfirmDelete}
        />

        {/* Toggle Status Confirmation Dialog */}
        <AlertDialog open={!!togglingSchool} onOpenChange={(open) => !open && setTogglingSchool(null)}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {togglingSchoolIsActive ? 'Disable School?' : 'Enable School?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {togglingSchoolIsActive
                  ? `Disabling "${togglingSchool?.name}" will prevent all users from logging in. The school's subdomain will show an inactive message.`
                  : `Enabling "${togglingSchool?.name}" will restore access for all users and reactivate the school's subdomain.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setTogglingSchool(null)} disabled={toggleStatusMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant={togglingSchoolIsActive ? 'destructive' : 'default'}
                onClick={handleConfirmToggle}
                disabled={toggleStatusMutation.isPending}
              >
                {toggleStatusMutation.isPending
                  ? 'Processing...'
                  : togglingSchoolIsActive ? 'Disable School' : 'Enable School'
                }
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperAdminLayout>
  );
}
