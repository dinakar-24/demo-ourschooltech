import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, Users, Megaphone, GraduationCap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDirect: (userId: string) => void;
  onCreateGroup: (name: string, participantIds: string[]) => void;
  onCreateBroadcast: (name: string, participantIds: string[]) => void;
}

interface ClassSection {
  className: string;
  section: string;
  studentCount: number;
}

export function NewChatDialog({ open, onOpenChange, onCreateDirect, onCreateGroup, onCreateBroadcast }: NewChatDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const [tab, setTab] = useState('direct');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Fetch school users for direct chat
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['school-users-for-chat', schoolId, search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('school_id', schoolId!)
        .neq('id', user!.id)
        .order('full_name')
        .limit(50);
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!schoolId && tab === 'direct',
  });

  // Fetch class/section combos with parent user IDs
  const { data: classSections = [], isLoading: classLoading } = useQuery({
    queryKey: ['class-sections-for-groups', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class_name, section')
        .eq('school_id', schoolId!)
        .eq('status', 'active');
      if (error) throw error;

      // Group by class_name + section
      const map = new Map<string, { className: string; section: string; count: number }>();
      (data || []).forEach(s => {
        const key = `${s.class_name}-${s.section}`;
        if (!map.has(key)) {
          map.set(key, { className: s.class_name, section: s.section, count: 0 });
        }
        map.get(key)!.count++;
      });

      return Array.from(map.values())
        .sort((a, b) => {
          const aNum = parseInt(a.className);
          const bNum = parseInt(b.className);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum || a.section.localeCompare(b.section);
          return a.className.localeCompare(b.className) || a.section.localeCompare(b.section);
        })
        .map(v => ({ className: v.className, section: v.section, studentCount: v.count } as ClassSection));
    },
    enabled: open && !!schoolId && (tab === 'group' || tab === 'broadcast'),
  });

  // Fetch teacher count
  const { data: teacherCount = 0 } = useQuery({
    queryKey: ['teacher-count-for-groups', schoolId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: open && !!schoolId && (tab === 'group' || tab === 'broadcast'),
  });

  const reset = () => {
    setSearch('');
    setSelectedUsers([]);
    setTab('direct');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleDirectSubmit = () => {
    if (selectedUsers.length === 1) {
      onCreateDirect(selectedUsers[0]);
      handleClose(false);
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev[0] === id ? [] : [id]);
  };

  // Create group/broadcast for a class-section
  const handleCreateClassGroup = async (cs: ClassSection, type: 'group' | 'broadcast') => {
    setCreating(true);
    try {
      // Get all parent user IDs for students in this class+section
      const { data: students } = await supabase
        .from('students')
        .select('parent_email')
        .eq('school_id', schoolId!)
        .eq('class_name', cs.className)
        .eq('section', cs.section)
        .eq('status', 'active');

      const parentEmails = [...new Set((students || []).map(s => s.parent_email).filter(Boolean))] as string[];

      let parentIds: string[] = [];
      if (parentEmails.length > 0) {
        const { data: parentProfiles } = await supabase
          .from('profiles')
          .select('id')
          .in('email', parentEmails);
        parentIds = (parentProfiles || []).map(p => p.id);
      }

      // Also get teacher user IDs assigned to this class
      const { data: teachers } = await supabase
        .from('teachers')
        .select('user_id')
        .eq('school_id', schoolId!)
        .contains('classes', [cs.className]);
      const teacherIds = (teachers || []).map(t => t.user_id).filter(Boolean) as string[];

      const allIds = [...new Set([...parentIds, ...teacherIds])];
      if (allIds.length === 0) {
        toast.error('No members found for this class/section');
        return;
      }

      const name = `Class ${cs.className} - ${cs.section}`;
      if (type === 'group') {
        onCreateGroup(name, allIds);
      } else {
        onCreateBroadcast(name, allIds);
      }
      toast.success(`${type === 'group' ? 'Group' : 'Broadcast'} "${name}" created`);
      handleClose(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  // Create "All Teachers" group
  const handleCreateTeachersGroup = async (type: 'group' | 'broadcast') => {
    setCreating(true);
    try {
      const { data: teachers } = await supabase
        .from('teachers')
        .select('user_id')
        .eq('school_id', schoolId!);

      const teacherIds = (teachers || []).map(t => t.user_id).filter(Boolean) as string[];
      if (teacherIds.length === 0) {
        toast.error('No teachers found');
        return;
      }

      const name = 'All Teachers';
      if (type === 'group') {
        onCreateGroup(name, teacherIds);
      } else {
        onCreateBroadcast(name, teacherIds);
      }
      toast.success(`${type === 'group' ? 'Group' : 'Broadcast'} "${name}" created`);
      handleClose(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const groupBroadcastContent = (type: 'group' | 'broadcast') => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {type === 'group' ? 'Create a group chat' : 'Create a broadcast channel'} — select a class/section or All Teachers below.
      </p>

      {/* All Teachers option */}
      <button
        type="button"
        disabled={creating}
        onClick={() => handleCreateTeachersGroup(type)}
        className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-accent/50 transition-colors flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">All Teachers</p>
          <p className="text-xs text-muted-foreground">{teacherCount} teacher(s)</p>
        </div>
        {creating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 border-t border-border" />
        <span>Class / Section Groups</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <ScrollArea className="h-56 rounded-md border border-border">
        {classLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : classSections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No classes found</p>
        ) : (
          classSections.map(cs => (
            <button
              key={`${cs.className}-${cs.section}`}
              type="button"
              disabled={creating}
              onClick={() => handleCreateClassGroup(cs, type)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-accent/50 transition-colors flex items-center gap-3 border-b border-border last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Class {cs.className} - {cs.section}</p>
                <p className="text-xs text-muted-foreground">{cs.studentCount} student(s)</p>
              </div>
              {creating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );

  const formContent = (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={v => { setTab(v); setSelectedUsers([]); setSearch(''); }}>
        <TabsList className="w-full">
          <TabsTrigger value="direct" className="flex-1">Direct</TabsTrigger>
          <TabsTrigger value="group" className="flex-1">Group</TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1">Broadcast</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'direct' && (
        <>
          <div className="space-y-1">
            <Label>Select User *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <ScrollArea className="h-48 rounded-md border border-border">
            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No users found</p>
            ) : (
              users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors flex items-center justify-between border-b border-border last:border-0",
                    selectedUsers.includes(u.id) && "bg-accent font-medium"
                  )}
                >
                  <div>
                    <p className="text-sm">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {selectedUsers.includes(u.id) && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </ScrollArea>
        </>
      )}

      {tab === 'group' && groupBroadcastContent('group')}
      {tab === 'broadcast' && groupBroadcastContent('broadcast')}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90dvh] flex flex-col bg-background">
          <DrawerHeader className="text-left"><DrawerTitle>New Conversation</DrawerTitle></DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-4">{formContent}</div>
          {tab === 'direct' && (
            <DrawerFooter className="flex-row gap-2">
              <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleDirectSubmit} disabled={selectedUsers.length !== 1} className="flex-1">Create</Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
        {formContent}
        {tab === 'direct' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button onClick={handleDirectSubmit} disabled={selectedUsers.length !== 1}>Create</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
