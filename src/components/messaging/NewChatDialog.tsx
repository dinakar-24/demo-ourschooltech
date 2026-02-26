import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDirect: (userId: string) => void;
  onCreateGroup: (name: string, participantIds: string[]) => void;
  onCreateBroadcast: (name: string, participantIds: string[]) => void;
}

export function NewChatDialog({ open, onOpenChange, onCreateDirect, onCreateGroup, onCreateBroadcast }: NewChatDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const [tab, setTab] = useState('direct');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // Fetch school users
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
    enabled: open && !!schoolId,
  });

  const reset = () => {
    setSearch('');
    setSelectedUsers([]);
    setGroupName('');
    setTab('direct');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = () => {
    if (tab === 'direct' && selectedUsers.length === 1) {
      onCreateDirect(selectedUsers[0]);
    } else if (tab === 'group' && selectedUsers.length > 0 && groupName) {
      onCreateGroup(groupName, selectedUsers);
    } else if (tab === 'broadcast' && selectedUsers.length > 0 && groupName) {
      onCreateBroadcast(groupName, selectedUsers);
    }
    handleClose(false);
  };

  const toggleUser = (id: string) => {
    if (tab === 'direct') {
      setSelectedUsers(prev => prev[0] === id ? [] : [id]);
    } else {
      setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
    }
  };

  const canSubmit = tab === 'direct' 
    ? selectedUsers.length === 1 
    : selectedUsers.length > 0 && groupName.trim().length > 0;

  const formContent = (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={v => { setTab(v); setSelectedUsers([]); setGroupName(''); }}>
        <TabsList className="w-full">
          <TabsTrigger value="direct" className="flex-1">Direct</TabsTrigger>
          <TabsTrigger value="group" className="flex-1">Group</TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1">Broadcast</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab !== 'direct' && (
        <div className="space-y-1">
          <Label>{tab === 'group' ? 'Group Name' : 'Broadcast Name'} *</Label>
          <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={`e.g. Class 10 ${tab === 'group' ? 'Discussion' : 'Updates'}`} />
        </div>
      )}

      <div className="space-y-1">
        <Label>{tab === 'direct' ? 'Select User' : 'Add Members'} *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {selectedUsers.length > 0 && tab !== 'direct' && (
        <p className="text-xs text-muted-foreground">{selectedUsers.length} member(s) selected</p>
      )}

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
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90dvh] flex flex-col bg-background">
          <DrawerHeader className="text-left"><DrawerTitle>New Conversation</DrawerTitle></DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-4">{formContent}</div>
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1">Create</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
        {formContent}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
