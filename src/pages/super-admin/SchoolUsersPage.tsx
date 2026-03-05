import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, BookOpen, GraduationCap, UserRound, ArrowLeft, Users, School, ChevronRight, ChevronDown, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

type ViewMode = 'overview' | 'admins' | 'teachers' | 'students' | 'parents' | 'classes';

interface SchoolUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  roles: string[];
  linked_parent_name?: string;
  linked_parent_email?: string;
}

interface ClassSection {
  className: string;
  sections: {
    name: string;
    studentCount: number;
    classTeacher?: string;
  }[];
}

const CATEGORY_TILES = [
  { key: 'admins' as ViewMode, label: 'Admins', icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', role: 'school_admin' },
  { key: 'teachers' as ViewMode, label: 'Teachers', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', role: 'teacher' },
  { key: 'students' as ViewMode, label: 'Students', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', role: 'student' },
  { key: 'parents' as ViewMode, label: 'Parents', icon: UserRound, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', role: 'parent' },
  { key: 'classes' as ViewMode, label: 'Classes & Sections', icon: School, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', role: '' },
];

export default function SchoolUsersPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [view, setView] = useState<ViewMode>('overview');
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Fetch school name and role counts on mount
  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const { data: school } = await supabase.from('schools').select('name').eq('id', schoolId).single();
      setSchoolName(school?.name || 'Unknown School');

      // Get all profiles for this school to count roles
      const { data: profiles } = await supabase.from('profiles').select('id').eq('school_id', schoolId);
      if (!profiles?.length) return;

      const userIds = profiles.map(p => p.id);
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);

      const roleCounts: Record<string, number> = {};
      (roles || []).forEach(r => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      setCounts(roleCounts);
    })();
  }, [schoolId]);

  // Fetch users for a specific role view
  const fetchUsers = useCallback(async (role: string) => {
    if (!schoolId) return;
    setLoading(true);
    try {
      // Get user IDs with this role
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('school_id', schoolId);

      if (!allProfiles?.length) { setUsers([]); setLoading(false); return; }

      const allIds = allProfiles.map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role as 'school_admin' | 'teacher' | 'student' | 'parent' | 'super_admin')
        .in('user_id', allIds);

      const roleUserIds = (rolesData || []).map(r => r.user_id);
      if (!roleUserIds.length) { setUsers([]); setLoading(false); return; }

      let query = supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', roleUserIds);

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      const { data: profiles, error } = await query.order('full_name');
      if (error) throw error;

      const usersWithRoles: SchoolUser[] = (profiles || []).map(p => ({
        ...p,
        roles: [role],
      }));

      // Enrich students with parent info
      if (role === 'student' && usersWithRoles.length > 0) {
        const studentUserIds = usersWithRoles.map(u => u.id);
        const { data: studentRecords } = await supabase
          .from('students')
          .select('parent_email, user_id')
          .in('user_id', studentUserIds);

        const parentEmails = [...new Set((studentRecords || []).map(s => s.parent_email).filter(Boolean) as string[])];
        if (parentEmails.length > 0) {
          const { data: parentProfiles } = await supabase
            .from('profiles')
            .select('email, full_name')
            .in('email', parentEmails);

          const parentNameMap = new Map<string, string>();
          (parentProfiles || []).forEach(p => parentNameMap.set(p.email, p.full_name));

          const userIdToParentEmail = new Map<string, string>();
          (studentRecords || []).forEach(s => {
            if (s.user_id && s.parent_email) userIdToParentEmail.set(s.user_id, s.parent_email);
          });

          usersWithRoles.forEach(u => {
            const parentEmail = userIdToParentEmail.get(u.id);
            if (parentEmail) {
              u.linked_parent_email = parentEmail;
              u.linked_parent_name = parentNameMap.get(parentEmail);
            }
          });
        }
      }

      // Enrich parents with linked student names
      if (role === 'parent' && usersWithRoles.length > 0) {
        const parentEmails = usersWithRoles.map(u => u.email);
        const { data: studentRecords } = await supabase
          .from('students')
          .select('full_name, parent_email')
          .eq('school_id', schoolId)
          .in('parent_email', parentEmails);

        const emailToStudents = new Map<string, string[]>();
        (studentRecords || []).forEach(s => {
          if (s.parent_email) {
            const existing = emailToStudents.get(s.parent_email) || [];
            existing.push(s.full_name);
            emailToStudents.set(s.parent_email, existing);
          }
        });

        usersWithRoles.forEach(u => {
          const students = emailToStudents.get(u.email);
          if (students) {
            u.linked_parent_name = students.join(', '); // reusing field for "linked students"
          }
        });
      }

      setUsers(usersWithRoles);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [schoolId, debouncedSearch]);

  // Fetch classes/sections data
  const fetchClasses = useCallback(async () => {
    if (!schoolId) return;
    setClassesLoading(true);
    try {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('display_order');

      if (!classes?.length) { setClassSections([]); setClassesLoading(false); return; }

      const classIds = classes.map(c => c.id);
      const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id, class_teacher_id')
        .in('class_id', classIds)
        .order('name');

      // Get teacher names for class teachers
      const teacherIds = (sections || []).map(s => s.class_teacher_id).filter(Boolean) as string[];
      let teacherMap = new Map<string, string>();
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from('teachers')
          .select('id, full_name')
          .in('id', teacherIds);
        (teachers || []).forEach(t => teacherMap.set(t.id, t.full_name));
      }

      // Get student counts per class/section
      const { data: countData } = await supabase.rpc('get_student_counts_by_class', { p_school_id: schoolId });
      const countMap = new Map<string, number>();
      (countData || []).forEach((c: { class_name: string; section: string; count: number }) => {
        countMap.set(`${c.class_name}|${c.section}`, Number(c.count));
      });

      const result: ClassSection[] = classes.map(cls => ({
        className: cls.name,
        sections: (sections || [])
          .filter(s => s.class_id === cls.id)
          .map(s => ({
            name: s.name,
            studentCount: countMap.get(`${cls.name}|${s.name}`) || 0,
            classTeacher: s.class_teacher_id ? teacherMap.get(s.class_teacher_id) : undefined,
          })),
      }));

      setClassSections(result);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  }, [schoolId]);

  // Load data when view changes
  useEffect(() => {
    if (view === 'overview') return;
    if (view === 'classes') {
      fetchClasses();
    } else {
      const tile = CATEGORY_TILES.find(t => t.key === view);
      if (tile?.role) fetchUsers(tile.role);
    }
  }, [view, fetchUsers, fetchClasses]);

  // Re-fetch on search change (for user views)
  useEffect(() => {
    if (view !== 'overview' && view !== 'classes') {
      const tile = CATEGORY_TILES.find(t => t.key === view);
      if (tile?.role) fetchUsers(tile.role);
    }
  }, [debouncedSearch]);

  const handleActionComplete = useCallback((action?: string, userId?: string) => {
    if (action === 'disable' && userId) {
      setDisabledUsers(prev => new Set(prev).add(userId));
    } else if (action === 'enable' && userId) {
      setDisabledUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else if (action === 'delete' && userId) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }
    const tile = CATEGORY_TILES.find(t => t.key === view);
    if (tile?.role) fetchUsers(tile.role);
  }, [view, fetchUsers]);

  const handleBack = () => {
    if (view === 'overview') {
      navigate('/super-admin/schools');
    } else {
      setView('overview');
      setSearchInput('');
      setUsers([]);
    }
  };

  const currentTile = CATEGORY_TILES.find(t => t.key === view);

  return (
    <SuperAdminLayout title={schoolName}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {view !== 'overview' && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${currentTile?.label || ''}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          {view === 'overview' && (
            <h2 className="text-lg font-semibold">{schoolName}</h2>
          )}
        </div>

        {/* Overview Tiles */}
        {view === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {CATEGORY_TILES.map(tile => {
              const Icon = tile.icon;
              const count = tile.role ? (counts[tile.role] || 0) : undefined;
              return (
                <Card
                  key={tile.key}
                  className={`cursor-pointer hover:shadow-md transition-shadow border ${tile.border} ${tile.bg}`}
                  onClick={() => setView(tile.key)}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2">
                    <Icon className={`w-8 h-8 ${tile.color}`} />
                    <p className="font-semibold text-sm">{tile.label}</p>
                    {count !== undefined && (
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* User List View (Admins / Teachers / Students / Parents) */}
        {view !== 'overview' && view !== 'classes' && (
          <>
            {loading ? (
              <Card>
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4].map(i => (
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
                  <p className="font-medium">No {currentTile?.label?.toLowerCase()} found</p>
                  <p className="text-sm mt-1">
                    {debouncedSearch ? 'Try a different search term' : `No ${currentTile?.label?.toLowerCase()} in this school yet`}
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {currentTile && <currentTile.icon className={`w-4 h-4 ${currentTile.color}`} />}
                    {currentTile?.label}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{users.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {users.map(user => {
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
                          {/* Student: show parent info */}
                          {view === 'students' && user.linked_parent_name && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <UserRound className="w-3 h-3 shrink-0 text-purple-500" />
                              <span className="font-medium">Parent:</span> {user.linked_parent_name}
                              {user.linked_parent_email && (
                                <span className="truncate">({user.linked_parent_email})</span>
                              )}
                            </p>
                          )}
                          {/* Parent: show linked students */}
                          {view === 'parents' && user.linked_parent_name && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <GraduationCap className="w-3 h-3 shrink-0 text-amber-500" />
                              <span className="font-medium">Children:</span> {user.linked_parent_name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Classes & Sections View */}
        {view === 'classes' && (
          <>
            {classesLoading ? (
              <Card>
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </Card>
            ) : classSections.length === 0 ? (
              <Card>
                <div className="text-center py-12 text-muted-foreground">
                  <School className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No classes found</p>
                  <p className="text-sm mt-1">No classes configured for this school yet</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {classSections.map(cls => (
                  <Card key={cls.className}>
                    <Collapsible defaultOpen>
                      <CardHeader className="pb-3">
                        <CollapsibleTrigger className="flex items-center gap-2 w-full group/cls">
                          <School className="w-4 h-4 text-emerald-600" />
                          <CardTitle className="text-sm">Class {cls.className}</CardTitle>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                            {cls.sections.reduce((sum, s) => sum + s.studentCount, 0)} students
                          </Badge>
                          <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/cls:rotate-180" />
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {cls.sections.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">No sections configured</p>
                          ) : (
                            <div className="grid gap-2">
                              {cls.sections.map(sec => (
                                <div key={sec.name} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                  <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Section {sec.name}</p>
                                    {sec.classTeacher && (
                                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <BookOpen className="w-3 h-3 shrink-0 text-blue-500" />
                                        Class Teacher: {sec.classTeacher}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      <GraduationCap className="w-3 h-3 mr-1" />
                                      {sec.studentCount}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}
