import { useState, useCallback, useMemo } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Building2, ShieldAlert, GraduationCap, BookOpen, UserCheck, ChevronDown, UserRound, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useAllUsers } from '@/hooks/useAllUsers';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ROLE_SUB_GROUPS = [
  { role: 'school_admin', label: 'Admins', icon: UserCheck, color: 'text-teal-600', borderColor: 'border-teal-300' },
  { role: 'teacher', label: 'Teachers', icon: BookOpen, color: 'text-blue-600', borderColor: 'border-blue-300' },
  { role: 'student', label: 'Students', icon: GraduationCap, color: 'text-amber-600', borderColor: 'border-amber-300' },
];

function UserCardItem({ user, isDisabled, isSelf, onActionComplete }: {
  user: {
    id: string; email: string; full_name: string; avatar_url?: string | null;
    school_name?: string; roles: string[];
    linked_students?: string[]; linked_parent_name?: string; linked_parent_email?: string;
  };
  isDisabled: boolean; isSelf: boolean;
  onActionComplete: (action?: string, userId?: string) => void;
}) {
  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{user.full_name}</p>
          <UserActionsMenu
            userId={user.id} userName={user.full_name} userEmail={user.email}
            isDisabled={isDisabled} isSelf={isSelf} onActionComplete={onActionComplete}
            currentFullName={user.full_name}
          />
        </div>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Mail className="w-3 h-3 shrink-0" />{user.email}
        </p>
        {/* Show linked parent for students */}
        {user.linked_parent_name && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <UserRound className="w-3 h-3 shrink-0 text-purple-500" />
            <span className="font-medium">Parent:</span> {user.linked_parent_name}
            {user.linked_parent_email && (
              <span className="truncate">({user.linked_parent_email})</span>
            )}
          </p>
        )}
        {/* Show linked students for parents */}
        {user.linked_students && user.linked_students.length > 0 && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <GraduationCap className="w-3 h-3 shrink-0" />
            {user.linked_students.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

function RoleGroupSection({ roleGroup, users, currentUserId, disabledUsers, onActionComplete, defaultOpen = true }: {
  roleGroup: typeof ROLE_SUB_GROUPS[number];
  users: any[];
  currentUserId?: string;
  disabledUsers: Set<string>;
  onActionComplete: (action?: string, userId?: string) => void;
  defaultOpen?: boolean;
}) {
  const Icon = roleGroup.icon;
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1.5 group/sub">
        <Icon className={`w-3.5 h-3.5 ${roleGroup.color}`} />
        <span className="text-xs font-semibold text-muted-foreground">{roleGroup.label}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{users.length}</Badge>
        <ChevronDown className="w-3 h-3 ml-auto text-muted-foreground transition-transform group-data-[state=open]/sub:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`space-y-2 mt-1 ml-1 border-l-2 ${roleGroup.borderColor} pl-3`}>
          {users.map(user => (
            <UserCardItem
              key={user.id} user={user}
              isDisabled={disabledUsers.has(user.id)}
              isSelf={currentUserId === user.id}
              onActionComplete={onActionComplete}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AllUsersPage() {
  const { user: currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState('');
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());
  const pagination = usePagination(50);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { users, totalCount, loading, refetch, removeUser } = useAllUsers({
    page: pagination.page,
    pageSize: pagination.pageSize,
    searchQuery: debouncedSearch,
    roleFilter: null,
  });

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

  // Hierarchical grouping
  const hierarchicalGroups = useMemo(() => {
    const platformUsers = users.filter(u => !u.school_id);

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
      totalCount: schoolUsers.filter(u => !u.roles.includes('parent')).length,
      roleGroups: ROLE_SUB_GROUPS.map(rg => ({
        ...rg,
        users: schoolUsers.filter(u => u.roles.includes(rg.role)),
      })).filter(rg => rg.users.length > 0),
    }));

    return { platformUsers, schoolGroups };
  }, [users]);

  const LoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12 text-muted-foreground">
      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p className="font-medium">No users found</p>
      <p className="text-sm mt-1">
        {debouncedSearch ? 'Try a different search term' : 'No users in the system yet'}
      </p>
    </div>
  );

  return (
    <SuperAdminLayout title="All Users">
      <div className="space-y-4 sm:space-y-6">
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

        {loading ? (
          <Card><LoadingSkeleton /></Card>
        ) : users.length === 0 ? (
          <Card><EmptyState /></Card>
        ) : (
          <div className="space-y-4">
            {/* Platform Users */}
            {hierarchicalGroups.platformUsers.length > 0 && (
              <Card>
                <Collapsible defaultOpen>
                  <CardHeader className="pb-3">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full group/platform">
                      <ShieldAlert className="w-4 h-4 text-destructive" />
                      <CardTitle className="text-sm">Platform Users</CardTitle>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">
                        {hierarchicalGroups.platformUsers.length}
                      </Badge>
                      <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/platform:rotate-180" />
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-2">
                      {hierarchicalGroups.platformUsers.map(user => (
                        <UserCardItem
                          key={user.id} user={user}
                          isDisabled={disabledUsers.has(user.id)}
                          isSelf={currentUser?.id === user.id}
                          onActionComplete={handleActionComplete}
                        />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Schools Header */}
            {hierarchicalGroups.schoolGroups.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Schools</h2>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {hierarchicalGroups.schoolGroups.length}
                </Badge>
              </div>
            )}

            {/* Per-School Cards */}
            {hierarchicalGroups.schoolGroups.map(({ schoolName, totalCount: schoolTotal, roleGroups }) => (
              <Card key={schoolName}>
                <Collapsible defaultOpen={hierarchicalGroups.schoolGroups.length <= 3}>
                  <CardHeader className="pb-3">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full group/school">
                      <Building2 className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm">{schoolName}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                        {schoolTotal}
                      </Badge>
                      <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/school:rotate-180" />
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {roleGroups.map(rg => (
                        <RoleGroupSection
                          key={rg.role}
                          roleGroup={rg}
                          users={rg.users}
                          currentUserId={currentUser?.id}
                          disabledUsers={disabledUsers}
                          onActionComplete={handleActionComplete}
                        />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
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
        )}
      </div>
    </SuperAdminLayout>
  );
}
