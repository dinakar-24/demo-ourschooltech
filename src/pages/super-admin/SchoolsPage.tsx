import { useState, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building2 } from 'lucide-react';
import { useSchools, School, SchoolFormData } from '@/hooks/useSchools';
import { SchoolFormDialog } from '@/components/super-admin/schools/SchoolFormDialog';
import { SchoolsTable } from '@/components/super-admin/schools/SchoolsTable';
import { SchoolCard } from '@/components/super-admin/schools/SchoolCard';

export default function SchoolsPage() {
  const {
    schools,
    loading,
    searchQuery,
    setSearchQuery,
    saveSchool,
    deleteSchool,
    isSubmitting,
  } = useSchools();

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
    await deleteSchool(id);
  }, [deleteSchool]);

  const handleSubmit = useCallback(async (formData: SchoolFormData, logoPreview: string | null) => {
    const success = await saveSchool(formData, logoPreview, editingSchool);
    if (success) {
      setIsDialogOpen(false);
      setEditingSchool(null);
    }
  }, [saveSchool, editingSchool]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingSchool(null);
    }
  }, []);

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
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
