import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, Users, Megaphone } from 'lucide-react';
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

export function NewChatDialog({ open, onOpenChange, onCreated }: NewChatDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const [convType, setConvType] = useState<ConvType>('group');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  // Fetch all school users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['school-users-for-chat', schoolId, search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('school_id', schoolId!)
        .neq('id', user!.id)
        .order('full_name')
        .limit(100);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!schoolId,
  });

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

      {/* User List */}
      <ScrollArea className="h-56 rounded-md border border-border">
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
                "w-full text-left px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors flex items-center gap-3 border-b border-border last:border-0",
                selectedUsers.has(u.id) && "bg-accent/30"
              )}
            >
              <Checkbox checked={selectedUsers.has(u.id)} className="pointer-events-none" />
              <div className="min-w-0">
                <p className="text-sm truncate">{u.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
            </button>
          ))
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
