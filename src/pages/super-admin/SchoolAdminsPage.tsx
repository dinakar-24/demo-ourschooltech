import { useState, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Building2, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSchoolUser } from '@/hooks/useCreateSchoolUser';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { AdminCard } from '@/components/super-admin/AdminCard';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [disabledAdmins, setDisabledAdmins] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', schoolId: '',
  });

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

  const { createUser, isCreating } = useCreateSchoolUser();

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain a special character';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolId) { toast.error('Please select a school'); return; }
    const passwordError = validatePassword(formData.password);
    if (passwordError) { toast.error(passwordError); return; }

    const success = await createUser({
      email: formData.email, password: formData.password,
      full_name: formData.fullName, role: 'school_admin', school_id: formData.schoolId,
    });

    if (success) {
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', fullName: '', schoolId: '' });
      refetch();
    }
  };

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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Add School Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add School Admin</DialogTitle>
                <DialogDescription>Create a new school administrator account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@school.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 8 chars, upper, lower, number, special" minLength={8} required />
                    <p className="text-xs text-muted-foreground">
                      Must include uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="school">Assign to School *</Label>
                    <Select value={formData.schoolId}
                      onValueChange={(value) => setFormData({ ...formData, schoolId: value })} required>
                      <SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name} ({school.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Admin'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
