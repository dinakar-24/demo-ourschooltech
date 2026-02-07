import { useState, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Building2, Mail } from 'lucide-react';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { AdminCard } from '@/components/super-admin/AdminCard';
import { CreateSchoolAdminDialog } from '@/components/super-admin/CreateSchoolAdminDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolAdmins } from '@/hooks/useSchoolAdmins';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SchoolAdminsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState('');
  const [disabledAdmins, setDisabledAdmins] = useState<Set<string>>(new Set());

  const pagination = usePagination(25);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { admins, schools, totalCount, loading, refetch, removeAdmin } = useSchoolAdmins({
    page: pagination.page,
    pageSize: pagination.pageSize,
    searchQuery: debouncedSearch,
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    pagination.resetPage();
  }, [pagination]);

  const handleActionComplete = useCallback((action?: string, userId?: string) => {
    if (action === 'disable' && userId) {
      setDisabledAdmins(prev => new Set(prev).add(userId));
    } else if (action === 'enable' && userId) {
      setDisabledAdmins(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else if (action === 'delete' && userId) {
      removeAdmin(userId);
      return;
    }
    refetch();
  }, [refetch, removeAdmin]);

  return (
    <SuperAdminLayout title="School Admins">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          <CreateSchoolAdminDialog schools={schools} onSuccess={refetch} />
        </div>

        {/* Content */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-5 h-5" />
              School Administrators ({totalCount.toLocaleString()})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground px-4">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No school admins found</p>
                <p className="text-sm mt-1">
                  {debouncedSearch ? 'Try a different search term' : 'Add a school admin to get started'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                {isMobile ? (
                  <div className="divide-y px-4 pb-2">
                    {admins.map((admin) => (
                      <div key={admin.id} className="py-3 first:pt-0">
                        <AdminCard
                          admin={admin}
                          isDisabled={disabledAdmins.has(admin.id)}
                          isSelf={user?.id === admin.id}
                          onActionComplete={handleActionComplete}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop/Tablet Table Layout */
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Assigned School</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                  {admin.full_name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="font-medium">{admin.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="w-3 h-3" />{admin.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {admin.school ? (
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span>{admin.school.name}</span>
                                  <span className="text-xs text-muted-foreground">({admin.school.code})</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={disabledAdmins.has(admin.id) ? 'destructive' : 'default'}>
                                {disabledAdmins.has(admin.id) ? 'Disabled' : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <UserActionsMenu
                                userId={admin.id}
                                userName={admin.full_name}
                                userEmail={admin.email}
                                isDisabled={disabledAdmins.has(admin.id)}
                                isSelf={user?.id === admin.id}
                                onActionComplete={handleActionComplete}
                                currentFullName={admin.full_name}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <PaginationControls
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalCount={totalCount}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  isLoading={loading}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
