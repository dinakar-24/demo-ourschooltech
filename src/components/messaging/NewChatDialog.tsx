import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function NewChatDialog({ open, onOpenChange, onCreateDirect }: NewChatDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Fetch distinct classes/sections from profiles
  const { data: classOptions = [] } = useQuery({
    queryKey: ['chat-class-options', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class_name, section')
        .eq('school_id', schoolId!)
        .eq('status', 'active');
      if (error) throw error;

      const classSet = new Set<string>();
      const sectionMap = new Map<string, Set<string>>();
      (data || []).forEach(s => {
        classSet.add(s.class_name);
        if (!sectionMap.has(s.class_name)) sectionMap.set(s.class_name, new Set());
        sectionMap.get(s.class_name)!.add(s.section);
      });

      return Array.from(classSet)
        .sort((a, b) => {
          const an = parseInt(a), bn = parseInt(b);
          if (!isNaN(an) && !isNaN(bn)) return an - bn;
          return a.localeCompare(b);
        })
        .map(c => ({
          className: c,
          sections: Array.from(sectionMap.get(c) || []).sort(),
        }));
    },
    enabled: open && !!schoolId,
  });

  const sections = classFilter !== 'all'
    ? classOptions.find(c => c.className === classFilter)?.sections || []
    : [];

  // Fetch users filtered by class/section
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['school-users-for-chat', schoolId, search, classFilter, sectionFilter],
    queryFn: async () => {
      // If filtering by class/section, get parent emails from students table
      if (classFilter !== 'all') {
        let studentsQuery = supabase
          .from('students')
          .select('parent_email, parent_name')
          .eq('school_id', schoolId!)
          .eq('status', 'active')
          .eq('class_name', classFilter);
        
        if (sectionFilter !== 'all') {
          studentsQuery = studentsQuery.eq('section', sectionFilter);
        }

        const { data: studentData } = await studentsQuery;
        const parentEmails = [...new Set((studentData || []).map(s => s.parent_email).filter(Boolean))] as string[];
        
        if (parentEmails.length === 0) return [];

        let query = supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('email', parentEmails)
          .neq('id', user!.id)
          .order('full_name');

        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      }

      // Default: all school users
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
    setSelectedUser(null);
    setClassFilter('all');
    setSectionFilter('all');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = () => {
    if (selectedUser) {
      onCreateDirect(selectedUser);
      handleClose(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
      {/* Class / Section Filters */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Class</Label>
          <Select value={classFilter} onValueChange={v => { setClassFilter(v); setSectionFilter('all'); setSelectedUser(null); }}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classOptions.map(c => (
                <SelectItem key={c.className} value={c.className}>Class {c.className}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {classFilter !== 'all' && sections.length > 0 && (
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Section</Label>
            <Select value={sectionFilter} onValueChange={v => { setSectionFilter(v); setSelectedUser(null); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map(s => (
                  <SelectItem key={s} value={s}>Section {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
              onClick={() => setSelectedUser(prev => prev === u.id ? null : u.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors flex items-center justify-between border-b border-border last:border-0",
                selectedUser === u.id && "bg-accent font-medium"
              )}
            >
              <div>
                <p className="text-sm">{u.full_name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              {selectedUser === u.id && (
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
          <DrawerHeader className="text-left"><DrawerTitle>New Direct Message</DrawerTitle></DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-4">{formContent}</div>
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!selectedUser} className="flex-1">Start Chat</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Direct Message</DialogTitle></DialogHeader>
        {formContent}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedUser}>Start Chat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
