import { useState, useCallback, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldAlert, Mail, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserActionsMenu } from '@/components/super-admin/UserActionsMenu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  roles: string[];
}

export default function PlatformUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchInput, 400);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .is('school_id', null);

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      const { data: profiles, error } = await query.order('full_name');
      if (error) throw error;

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

      setUsers((profiles || []).map(p => ({
        ...p,
        roles: rolesMap.get(p.id) || [],
      })));
    } catch {
      toast.error('Failed to load platform users');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleActionComplete = useCallback((action?: string, userId?: string) => {
    if (action === 'disable' && userId) {
      setDisabledUsers(prev => new Set(prev).add(userId));
    } else if (action === 'enable' && userId) {
      setDisabledUsers(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else if (action === 'delete' && userId) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }
    fetchUsers();
  }, [fetchUsers]);

  const getRoleBadge = (role: string) => {
    if (role === 'super_admin') return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Super Admin</Badge>;
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{role.replace('_', ' ')}</Badge>;
  };

  return (
    <SuperAdminLayout title="Platform Users">
      <div className="space-y-4 sm:space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search platform users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Platform Users
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">
                {users.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No platform users found</p>
                <p className="text-sm mt-1">
                  {debouncedSearch ? 'Try a different search term' : 'No platform-level users yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{user.full_name}</p>
                            {user.roles.map(r => <span key={r}>{getRoleBadge(r)}</span>)}
                          </div>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
