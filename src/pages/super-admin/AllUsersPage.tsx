import { useState, useCallback, useMemo } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Mail, Building2, ShieldAlert, GraduationCap, BookOpen, UserCheck, UserX, ChevronDown, UserRound } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { UserCard } from '@/components/super-admin/UserCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAllUsers } from '@/hooks/useAllUsers';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  { key: null, label: 'All', shortLabel: 'All', icon: Users, color: 'bg-primary/10 text-primary border-primary/30' },
  { key: 'super_admin', label: 'Super Admin', shortLabel: 'Super', icon: ShieldAlert, color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  { key: 'school_admin', label: 'School Admin', shortLabel: 'Admin', icon: UserCheck, color: 'bg-teal-500/10 text-teal-600 border-teal-500/30' },
  { key: 'teacher', label: 'Teacher', shortLabel: 'Teacher', icon: BookOpen, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { key: 'parent', label: 'Parent', shortLabel: 'Parent', icon: Users, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  { key: 'student', label: 'Student', shortLabel: 'Student', icon: GraduationCap, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { key: 'no_role', label: 'No Role', shortLabel: 'None', icon: UserX, color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
] as const;

const ROLE_SUB_GROUPS = [
  { role: 'school_admin', label: 'Admins', icon: UserCheck, color: 'text-teal-600' },
  { role: 'teacher', label: 'Teachers', icon: BookOpen, color: 'text-blue-600' },
  { role: 'student', label: 'Students', icon: GraduationCap, color: 'text-amber-600' },
];

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

  // Hierarchical grouping for mobile
  const hierarchicalGroups = useMemo(() => {
    // Platform users: no school_id (super admins, no-role)
    const platformUsers = users.filter(u => !u.school_id);
    
    // School groups
    const schoolMap = new Map<string, { schoolName: string; users: typeof users }>();
    users.forEach(user => {
      if (!user.school_id) return;
      const key = user.school_id;
      if (!schoolMap.has(key)) {
        schoolMap.set(key, { schoolName: user.school_name || 'Unknown School', users: [] });
      }
      schoolMap.get(key)!.users.push(user);
    });

    const schoolGroups = Array.from(schoolMap.values()).map(({ schoolName, users: schoolUsers }) => ({
      schoolName,
      roleGroups: ROLE_SUB_GROUPS.map(rg => ({
        ...rg,
        users: schoolUsers.filter(u => u.roles.includes(rg.role)),
      })).filter(rg => rg.users.length > 0),
    }));

    return { platformUsers, schoolGroups };
  }, [users]);

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
        <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-1.5 sm:gap-2 sm:flex-wrap w-max sm:w-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {ROLE_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeRoleFilter === filter.key;
              const count = getCountForFilter(filter.key);
              return (
                <button
                  key={filter.key ?? 'all'}
                  onClick={() => handleRoleFilterChange(filter.key)}
                  className={`
                    inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap shrink-0
                    ${isActive
                      ? `${filter.color} ring-2 ring-offset-1 ring-current shadow-sm`
                      : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <Icon className="w-3 h-3" />
                  <span className="sm:hidden">{filter.shortLabel}</span>
                  <span className="hidden sm:inline">{filter.label}</span>
                  <span className={`
                    inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold
                    ${isActive ? 'bg-background/50' : 'bg-muted'}
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Layout */}
        {isMobile ? (
          loading ? (
            <Card>
              <CardContent className="p-4 space-y-3">
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
              </CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No users found</p>
                <p className="text-sm mt-1">
                  {debouncedSearch ? 'Try a different search term' : 'No users in the system yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Platform Users Card */}
              {hierarchicalGroups.platformUsers.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ShieldAlert className="w-4 h-4 text-destructive" />
                      Platform Users
                      <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
                        {hierarchicalGroups.platformUsers.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {hierarchicalGroups.platformUsers.map(user => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isDisabled={disabledUsers.has(user.id)}
                        isSelf={currentUser?.id === user.id}
                        onActionComplete={handleActionComplete}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Per-School Cards */}
              {hierarchicalGroups.schoolGroups.map(({ schoolName, roleGroups }) => (
                <Card key={schoolName}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-primary" />
                      {schoolName}
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                        {roleGroups.reduce((sum, rg) => sum + rg.users.length, 0)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {roleGroups.map(rg => {
                      const Icon = rg.icon;
                      return (
                        <Collapsible key={rg.role} defaultOpen>
                          <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1.5 group/sub">
                            <Icon className={`w-3.5 h-3.5 ${rg.color}`} />
                            <span className="text-xs font-semibold text-muted-foreground">{rg.label}</span>
                            <span className="text-[10px] text-muted-foreground">({rg.users.length})</span>
                            <ChevronDown className="w-3 h-3 ml-auto text-muted-foreground transition-transform group-data-[state=open]/sub:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-2 mt-1 ml-1 border-l-2 border-muted pl-3">
                              {rg.users.map(user => (
                                <UserCard
                                  key={user.id}
                                  user={user}
                                  isDisabled={disabledUsers.has(user.id)}
                                  isSelf={currentUser?.id === user.id}
                                  onActionComplete={handleActionComplete}
                                />
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}

              <PaginationControls
                page={pagination.page}
                pageSize={pagination.pageSize}
                totalCount={totalCount}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                isLoading={loading}
              />
            </div>
          )
        ) : (
          /* Desktop Card with Table */
          <Card>
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-lg">
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>School</TableHead>
                          <TableHead>Parent</TableHead>
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
                              {user.linked_parent_name ? (
                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                  <UserRound className="w-3 h-3 text-purple-500" />
                                  {user.linked_parent_name}
                                </div>
                              ) : user.linked_students && user.linked_students.length > 0 ? (
                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                  <GraduationCap className="w-3 h-3" />
                                  {user.linked_students.join(', ')}
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
        )}
      </div>
    </SuperAdminLayout>
  );
}
