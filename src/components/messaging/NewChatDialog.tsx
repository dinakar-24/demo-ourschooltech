import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, Users, Megaphone, ChevronDown, ChevronRight } from 'lucide-react';
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
  onCreated: () => void;
}

type ConvType = 'group' | 'broadcast';

interface UserWithClass {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  class_name: string | null;
  section: string | null;
}

export function NewChatDialog({ open, onOpenChange, onCreated }: NewChatDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const [convType, setConvType] = useState<ConvType>('group');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['school-users-for-chat', schoolId, search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, class_name, section')
        .eq('school_id', schoolId!)
        .neq('id', user!.id)
        .order('full_name')
        .limit(200);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as UserWithClass[];
    },
    enabled: open && !!schoolId,
  });

  // Group users by class-section
  const groupedUsers = useMemo(() => {
    const groups = new Map<string, UserWithClass[]>();
    
    users.forEach(u => {
      const key = u.class_name && u.section
        ? `Class ${u.class_name} - ${u.section}`
        : u.class_name
          ? `Class ${u.class_name}`
          : 'Other Staff';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(u);
    });

    // Sort keys: class groups first, "Other Staff" last
    const sorted = new Map(
      [...groups.entries()].sort((a, b) => {
        if (a[0] === 'Other Staff') return 1;
        if (b[0] === 'Other Staff') return -1;
        return a[0].localeCompare(b[0]);
      })
    );
    return sorted;
  }, [users]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupUsers: UserWithClass[]) => {
    const ids = groupUsers.map(u => u.id);
    const allSelected = ids.every(id => selectedUsers.has(id));
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const reset = () => {
    setName('');
    setSearch('');
    setSelectedUsers(new Set());
    setConvType('group');
    setExpandedSections(new Set());
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Please enter a name'); return; }
    if (selectedUsers.size === 0) { toast.error('Select at least one member'); return; }
    setCreating(true);
    try {
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          school_id: schoolId!,
          type: convType,
          name: name.trim(),
          created_by: user!.id,
        })
        .select()
        .single();
      if (convErr) throw convErr;

      const parts = [
        { conversation_id: conv.id, user_id: user!.id, role: 'admin' },
        ...[...selectedUsers].map(id => ({ conversation_id: conv.id, user_id: id, role: 'member' })),
      ];
      const { error: partErr } = await supabase.from('conversation_participants').insert(parts);
      if (partErr) throw partErr;

      toast.success(`${convType === 'group' ? 'Group' : 'Broadcast'} created!`);
      onCreated();
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={convType === 'group' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setConvType('group')}
        >
          <Users className="w-4 h-4 mr-1.5" />
          Group
        </Button>
        <Button
          type="button"
          variant={convType === 'broadcast' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setConvType('broadcast')}
        >
          <Megaphone className="w-4 h-4 mr-1.5" />
          Broadcast
        </Button>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs">{convType === 'group' ? 'Group' : 'Broadcast'} Name</Label>
        <Input
          placeholder={`e.g. ${convType === 'group' ? 'Study Group' : 'Fee Reminder'}`}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      {/* Search + select all */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={selectAll} className="text-xs text-primary hover:underline">
            {selectedUsers.size === users.length && users.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs text-muted-foreground">{selectedUsers.size} selected</span>
        </div>
      </div>

      {/* Grouped User List */}
      <ScrollArea className="h-56 rounded-md border border-border">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : groupedUsers.size === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No users found</p>
        ) : (
          [...groupedUsers.entries()].map(([groupName, groupUsers]) => {
            const isExpanded = expandedSections.has(groupName);
            const groupIds = groupUsers.map(u => u.id);
            const selectedInGroup = groupIds.filter(id => selectedUsers.has(id)).length;

            return (
              <div key={groupName}>
                {/* Group Header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border cursor-pointer hover:bg-muted/80 transition-colors sticky top-0 z-10"
                  onClick={() => toggleSection(groupName)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <Checkbox
                    checked={selectedInGroup === groupUsers.length && groupUsers.length > 0}
                    className="pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(groupUsers);
                    }}
                  />
                  <span className="text-xs font-semibold text-foreground flex-1">{groupName}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedInGroup > 0 ? `${selectedInGroup}/` : ''}{groupUsers.length}
                  </span>
                </div>

                {/* Group Members */}
                {isExpanded && groupUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-3 border-b border-border last:border-0 cursor-pointer pl-10",
                      selectedUsers.has(u.id) && "bg-accent/30"
                    )}
                  >
                    <Checkbox checked={selectedUsers.has(u.id)} className="pointer-events-none" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );

  const title = `New ${convType === 'group' ? 'Group' : 'Broadcast'}`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90dvh] flex flex-col bg-background">
          <DrawerHeader className="text-left"><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-4">{formContent}</div>
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim() || selectedUsers.size === 0} className="flex-1">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Create
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {formContent}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim() || selectedUsers.size === 0}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
