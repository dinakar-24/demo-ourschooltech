import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';

/**
 * Auto-creates group & broadcast conversations for each class/section
 * and an "All Teachers" group when the admin opens messages.
 */
export function useAutoCreateGroups() {
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['auto-create-groups', schoolId],
    queryFn: async () => {
      if (!user?.id || !schoolId) return null;

      // 1. Get existing conversations for this school
      const { data: existing, error: existErr } = await supabase
        .from('conversations')
        .select('name, type')
        .eq('school_id', schoolId);

      if (existErr) {
        console.error('Failed to fetch existing conversations:', existErr);
        throw existErr;
      }

      const existingKeys = new Set(
        (existing || []).map(c => `${c.type}::${c.name}`)
      );

      // 2. Get class/section combos
      const { data: students } = await supabase
        .from('students')
        .select('class_name, section, parent_email')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      const classMap = new Map<string, { className: string; section: string; parentEmails: Set<string> }>();
      (students || []).forEach(s => {
        const key = `${s.class_name}-${s.section}`;
        if (!classMap.has(key)) {
          classMap.set(key, { className: s.class_name, section: s.section, parentEmails: new Set() });
        }
        if (s.parent_email) classMap.get(key)!.parentEmails.add(s.parent_email);
      });

      // 3. Get all teachers
      const { data: teachers } = await supabase
        .from('teachers')
        .select('user_id, classes')
        .eq('school_id', schoolId);

      const allTeacherIds = (teachers || []).map(t => t.user_id).filter(Boolean) as string[];

      // Helper to create a conversation with participants
      const createConv = async (
        type: 'group' | 'broadcast',
        name: string,
        participantIds: string[],
        className?: string,
        section?: string
      ) => {
        const uniqueIds = [...new Set(participantIds.filter(Boolean).filter(id => id !== user!.id))];

        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            school_id: schoolId,
            type,
            name,
            created_by: user!.id,
            class_name: className || null,
            section: section || null,
          })
          .select()
          .single();

        if (convErr) {
          console.error('Conv create error:', convErr);
          return;
        }

        const parts = [
          { conversation_id: conv.id, user_id: user!.id, role: 'admin' },
          ...uniqueIds.map(id => ({ conversation_id: conv.id, user_id: id, role: 'member' })),
        ];
        const { error: partErr } = await supabase.from('conversation_participants').insert(parts);
        if (partErr) console.error('Participant insert error:', partErr);
      };

      let created = 0;

      // 4. Create class/section groups & broadcasts
      for (const [, cs] of classMap) {
        const name = `Class ${cs.className} - ${cs.section}`;

        // Resolve parent emails to user IDs
        let parentIds: string[] = [];
        const emails = [...cs.parentEmails];
        if (emails.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .in('email', emails);
          parentIds = (profiles || []).map(p => p.id);
        }

        // Teachers assigned to this class
        const classTeacherIds = (teachers || [])
          .filter(t => {
            if (!t.classes || !t.user_id) return false;
            return t.classes.some((c: string) => {
              const lower = c.toLowerCase();
              const target = cs.className.toLowerCase();
              const targetFull = `${cs.className}-${cs.section}`.toLowerCase();
              return lower === target || lower === targetFull;
            });
          })
          .map(t => t.user_id) as string[];

        const memberIds = [...new Set([...parentIds, ...classTeacherIds])];

        if (!existingKeys.has(`group::${name}`)) {
          await createConv('group', name, memberIds, cs.className, cs.section);
          created++;
        }
        if (!existingKeys.has(`broadcast::${name}`)) {
          await createConv('broadcast', name, memberIds, cs.className, cs.section);
          created++;
        }
      }

      // 5. Create "All Teachers" group & broadcast
      if (!existingKeys.has('group::All Teachers')) {
        await createConv('group', 'All Teachers', allTeacherIds);
        created++;
      }
      if (!existingKeys.has('broadcast::All Teachers')) {
        await createConv('broadcast', 'All Teachers', allTeacherIds);
        created++;
      }

      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }

      return { created };
    },
    enabled: !!user?.id && !!schoolId,
    staleTime: Infinity, // Only run once per mount
    retry: 2,
  });
}
