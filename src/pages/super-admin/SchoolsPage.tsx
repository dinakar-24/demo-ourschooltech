import { useState, useCallback, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building2, Loader2 } from 'lucide-react';
import { useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool, School, SchoolFormData } from '@/hooks/useSchools';
import { SchoolFormDialog } from '@/components/super-admin/schools/SchoolFormDialog';
import { SchoolsTable } from '@/components/super-admin/schools/SchoolsTable';
import { SchoolCard } from '@/components/super-admin/schools/SchoolCard';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

export default function SchoolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const pagination = usePagination(25);

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery]);

  const { data: result, isLoading } = useSchools({ search: searchQuery, page: pagination.page, pageSize: pagination.pageSize });
  const schools = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();
  const deleteSchoolMutation = useDeleteSchool();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const handleOpenAddDialog = useCallback(() => {
    setEditingSchool(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((school: School) => {
    setEditingSchool(school);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return;
    }
    await deleteSchoolMutation.mutateAsync(id);
  }, [deleteSchoolMutation]);

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

  const isSubmitting = createSchool.isPending || updateSchool.isPending;

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
              All Schools ({schools.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
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
                    />
                  ))}
                </div>

                {/* Desktop Table View - No horizontal scroll */}
                <div className="hidden md:block">
                  <SchoolsTable
                    schools={schools}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
      </div>
    </SuperAdminLayout>
  );
}
