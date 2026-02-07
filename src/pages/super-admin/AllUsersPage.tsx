import { useState, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Mail, Building2, ShieldAlert, GraduationCap, BookOpen, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { useAuth } from '@/contexts/AuthContext';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  school_id: string | null;
  school_name?: string;
  roles: string[];
}

export default function AllUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null);
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());

  const handleActionComplete = (action?: string, userId?: string) => {
    if (action === 'disable' && userId) {
      setDisabledUsers(prev => new Set(prev).add(userId));
    } else if (action === 'enable' && userId) {
      setDisabledUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else if (action === 'delete' && userId) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, school_id')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch all schools
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name');

      if (schoolsError) throw schoolsError;

      // Combine data
      const usersWithRoles = (profiles || []).map((profile) => {
        const userRoles = (roles || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role);
        const school = schools?.find((s) => s.id === profile.school_id);

        return {
          ...profile,
          roles: userRoles,
          school_name: school?.name,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.roles.some((role) => role.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = !activeRoleFilter
      ? true
      : activeRoleFilter === 'no_role'
        ? user.roles.length === 0
        : user.roles.includes(activeRoleFilter);

    return matchesSearch && matchesRole;
  });

  // Role counts
  const roleCounts = {
    all: users.length,
    super_admin: users.filter(u => u.roles.includes('super_admin')).length,
    school_admin: users.filter(u => u.roles.includes('school_admin')).length,
    teacher: users.filter(u => u.roles.includes('teacher')).length,
    parent: users.filter(u => u.roles.includes('parent')).length,
    student: users.filter(u => u.roles.includes('student')).length,
    no_role: users.filter(u => u.roles.length === 0).length,
  };

  const roleFilters = [
    { key: null, label: 'All', count: roleCounts.all, icon: Users, color: 'bg-primary/10 text-primary border-primary/30' },
    { key: 'super_admin', label: 'Super Admin', count: roleCounts.super_admin, icon: ShieldAlert, color: 'bg-red-500/10 text-red-600 border-red-500/30' },
    { key: 'school_admin', label: 'School Admin', count: roleCounts.school_admin, icon: UserCheck, color: 'bg-teal-500/10 text-teal-600 border-teal-500/30' },
    { key: 'teacher', label: 'Teacher', count: roleCounts.teacher, icon: BookOpen, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    { key: 'parent', label: 'Parent', count: roleCounts.parent, icon: Users, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
    { key: 'student', label: 'Student', count: roleCounts.student, icon: GraduationCap, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    { key: 'no_role', label: 'No Role', count: roleCounts.no_role, icon: UserX, color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
  ] as const;

  const getRoleBadgeVariant = (role: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'school_admin':
        return 'default';
      case 'teacher':
        return 'secondary';
      case 'parent':
        return 'outline';
      case 'student':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <SuperAdminLayout title="All Users">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {roleFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeRoleFilter === filter.key;
            return (
              <button
                key={filter.key ?? 'all'}
                onClick={() => setActiveRoleFilter(filter.key)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
                  ${isActive
                    ? `${filter.color} ring-2 ring-offset-1 ring-current shadow-sm`
                    : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {filter.label}
                <span className={`
                  inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold
                  ${isActive ? 'bg-background/50' : 'bg-muted'}
                `}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All System Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No users found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Try a different search term' : 'No users in the system yet'}
                </p>
              </div>
            ) : (
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
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                              {user.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {user.email}
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
                              <Building2 className="w-3 h-3" />
                              {user.school_name}
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
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
