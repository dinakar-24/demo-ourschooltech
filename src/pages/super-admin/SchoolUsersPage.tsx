import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, BookOpen, GraduationCap, ChevronDown, Mail, UserRound, ArrowLeft, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

interface SchoolUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  roles: string[];
  linked_parent_name?: string;
  linked_parent_email?: string;
}

const ROLE_GROUPS = [
  { role: 'school_admin', label: 'Admins', icon: UserCheck, color: 'text-teal-600', borderColor: 'border-teal-300' },
  { role: 'teacher', label: 'Teachers', icon: BookOpen, color: 'text-blue-600', borderColor: 'border-blue-300' },
  { role: 'student', label: 'Students', icon: GraduationCap, color: 'text-amber-600', borderColor: 'border-amber-300' },
];

export default function SchoolUsersPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchInput, 400);

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      // Fetch school name
      const { data: school } = await supabase.from('schools').select('name').eq('id', schoolId).single();
      setSchoolName(school?.name || 'Unknown School');

      // Fetch profiles
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('school_id', schoolId);

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      const { data: profiles, error } = await query.order('full_name');
      if (error) throw error;

      // Fetch roles
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles } = userIds.length > 0
        ? await supabase.from('user_roles').select('user_id, role').in('user_id', userIds)
        : { data: [] };

      const rolesMap = new Map<string, string[]>();
      (roles || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const usersWithRoles: SchoolUser[] = (profiles || []).map(p => ({
        ...p,
        roles: rolesMap.get(p.id) || [],
      }));

      // Enrich students with parent info
      const studentUsers = usersWithRoles.filter(u => u.roles.includes('student'));
      if (studentUsers.length > 0) {
        const studentUserIds = studentUsers.map(s => s.id);
        const { data: studentRecords } = await supabase
          .from('students')
          .select('parent_email, user_id')
          .in('user_id', studentUserIds);

        const parentEmails = [...new Set(
          (studentRecords || []).map(s => s.parent_email).filter(Boolean) as string[]
        )];

        if (parentEmails.length > 0) {
          const { data: parentProfiles } = await supabase
            .from('profiles')
            .select('email, full_name')
            .in('email', parentEmails);

          const parentNameMap = new Map<string, string>();
          (parentProfiles || []).forEach(p => parentNameMap.set(p.email, p.full_name));

          const userIdToParentEmail = new Map<string, string>();
          (studentRecords || []).forEach(s => {
            if (s.user_id && s.parent_email) {
              userIdToParentEmail.set(s.user_id, s.parent_email);
            }
          });

          usersWithRoles.forEach(u => {
            if (u.roles.includes('student')) {
              const parentEmail = userIdToParentEmail.get(u.id);
              if (parentEmail) {
                u.linked_parent_email = parentEmail;
                u.linked_parent_name = parentNameMap.get(parentEmail);
              }
            }
          });
        }
      }

      setUsers(usersWithRoles);
    } catch {
      toast.error('Failed to load school users');
    } finally {
      setLoading(false);
    }
  }, [schoolId, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleActionComplete = useCallback((action?: string, userId?: string) => {
    if (action === 'disable' && userId) {
      setDisabledUsers(prev => new Set(prev).add(userId));
    } else if (action === 'enable' && userId) {
      setDisabledUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else if (action === 'delete' && userId) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }
    fetchData();
  }, [fetchData]);

  const roleGroups = useMemo(() => {
    return ROLE_GROUPS.map(rg => ({
      ...rg,
      users: users.filter(u => u.roles.includes(rg.role)),
    })).filter(rg => rg.users.length > 0);
  }, [users]);

  return (
    <SuperAdminLayout title={schoolName}>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/super-admin/schools')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <Card>
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
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">
                {debouncedSearch ? 'Try a different search term' : 'No users in this school yet'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {roleGroups.map(rg => {
              const Icon = rg.icon;
              return (
                <Card key={rg.role}>
                  <Collapsible defaultOpen>
                    <CardHeader className="pb-3">
                      <CollapsibleTrigger className="flex items-center gap-2 w-full group/role">
                        <Icon className={`w-4 h-4 ${rg.color}`} />
                        <CardTitle className="text-sm">{rg.label}</CardTitle>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                          {rg.users.length}
                        </Badge>
                        <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/role:rotate-180" />
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-2">
                        {rg.users.map(user => {
                          const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);
                          return (
                            <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                              <Avatar className="w-9 h-9 shrink-0">
                                <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                                  <UserActionsMenu
                                    userId={user.id} userName={user.full_name} userEmail={user.email}
                                    isDisabled={disabledUsers.has(user.id)}
                                    isSelf={currentUser?.id === user.id}
                                    onActionComplete={handleActionComplete}
                                    currentFullName={user.full_name}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3 shrink-0" />{user.email}
                                </p>
                                {user.linked_parent_name && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <UserRound className="w-3 h-3 shrink-0 text-purple-500" />
                                    <span className="font-medium">Parent:</span> {user.linked_parent_name}
                                    {user.linked_parent_email && (
                                      <span className="truncate">({user.linked_parent_email})</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
