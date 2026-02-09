import { useState, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Mail, Building2, ShieldAlert, GraduationCap, BookOpen, UserCheck, UserX } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { UserCard } from '@/components/super-admin/UserCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAllUsers } from '@/hooks/useAllUsers';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';

const getRoleBadgeVariant = (role: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  switch (role) {
    case 'super_admin': return 'destructive';
    case 'school_admin': return 'default';
    case 'teacher': return 'secondary';
    case 'parent': return 'outline';
    case 'student': return 'default';
    default: return 'outline';
  }
};

const ROLE_FILTERS = [
  { key: null, label: 'All', icon: Users, color: 'bg-primary/10 text-primary border-primary/30' },
  { key: 'super_admin', label: 'Super Admin', icon: ShieldAlert, color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  { key: 'school_admin', label: 'School Admin', icon: UserCheck, color: 'bg-teal-500/10 text-teal-600 border-teal-500/30' },
  { key: 'teacher', label: 'Teacher', icon: BookOpen, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { key: 'parent', label: 'Parent', icon: Users, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  { key: 'student', label: 'Student', icon: GraduationCap, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { key: 'no_role', label: 'No Role', icon: UserX, color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
] as const;

export default function AllUsersPage() {
  const { user: currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null);
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());
  const pagination = usePagination(25);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { users, totalCount, roleCounts, loading, refetch, removeUser } = useAllUsers({
    page: pagination.page,
    pageSize: pagination.pageSize,
    searchQuery: debouncedSearch,
    roleFilter: activeRoleFilter,
  });

  const handleRoleFilterChange = useCallback((key: string | null) => {
    setActiveRoleFilter(key);
    pagination.resetPage();
  }, [pagination]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    pagination.resetPage();
  }, [pagination]);

  const handleActionComplete = useCallback((action?: string, userId?: string) => {
    if (action === 'disable' && userId) {
      setDisabledUsers(prev => new Set(prev).add(userId));
    } else if (action === 'enable' && userId) {
      setDisabledUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else if (action === 'delete' && userId) {
      removeUser(userId);
      return;
    }
    refetch();
  }, [refetch, removeUser]);

  const getCountForFilter = (key: string | null) => {
    if (key === null) return roleCounts.all;
    return roleCounts[key as keyof typeof roleCounts] ?? 0;
  };

  return (
    <SuperAdminLayout title="All Users">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 -mx-1 px-1 overflow-x-auto pb-1">
          {ROLE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeRoleFilter === filter.key;
            const count = getCountForFilter(filter.key);
            return (
              <button
                key={filter.key ?? 'all'}
                onClick={() => handleRoleFilterChange(filter.key)}
                className={`
                  inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-all whitespace-nowrap shrink-0
                  ${isActive
                    ? `${filter.color} ring-2 ring-offset-1 ring-current shadow-sm`
                    : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">{filter.label.split(' ').pop()}</span>
                <span className={`
                  inline-flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 px-1 sm:px-1.5 rounded-full text-[10px] sm:text-xs font-semibold
                  ${isActive ? 'bg-background/50' : 'bg-muted'}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-5 h-5" />
              {activeRoleFilter
                ? `${ROLE_FILTERS.find(f => f.key === activeRoleFilter)?.label || ''} Users`
                : 'All System Users'
              } ({totalCount.toLocaleString()})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-16 bg-muted rounded-full animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No users found</p>
                <p className="text-sm mt-1">
                  {debouncedSearch ? 'Try a different search term' : 'No users in the system yet'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                {isMobile ? (
                  <div className="divide-y px-4 pb-2">
                    {users.map((user) => (
                      <div key={user.id} className="py-3 first:pt-0">
                        <UserCard
                          user={user}
                          isDisabled={disabledUsers.has(user.id)}
                          isSelf={currentUser?.id === user.id}
                          onActionComplete={handleActionComplete}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop/Tablet Table */
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>School</TableHead>
                          <TableHead className="w-12">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                    {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="w-3 h-3" />{user.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles.length > 0 ? (
                                  user.roles.map((role) => (
                                    <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                      {role.replace('_', ' ')}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No role</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.school_name ? (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Building2 className="w-3 h-3" />{user.school_name}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <UserActionsMenu
                                userId={user.id}
                                userName={user.full_name}
                                userEmail={user.email}
                                isDisabled={disabledUsers.has(user.id)}
                                isSelf={currentUser?.id === user.id}
                                onActionComplete={handleActionComplete}
                                currentFullName={user.full_name}
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
