import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Auto-creates group & broadcast conversations for each class/section
 * and an "All Teachers" group when the admin opens messages.
 * Runs fresh on every mount (page visit).
 */
export function useAutoCreateGroups() {
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();
  const runningRef = useRef(false); // prevent concurrent runs, NOT "already ran"

  useEffect(() => {
    if (!user?.id || !schoolId || runningRef.current) {
      console.log('[AutoGroups] Skipped:', { userId: user?.id, schoolId, running: runningRef.current });
      return;
    }
    runningRef.current = true;
    console.log('[AutoGroups] Running for school:', schoolId);

    const run = async () => {
      try {
        // 1. Get existing conversations for this school
        const { data: existing, error: existErr } = await supabase
          .from('conversations')
          .select('name, type')
          .eq('school_id', schoolId);

        if (existErr) {
          console.error('[AutoGroups] Failed to fetch existing conversations:', existErr);
          return;
        }
        console.log('[AutoGroups] Existing conversations:', existing?.length || 0);

        const existingKeys = new Set(
          (existing || []).map(c => `${c.type}::${c.name}`)
        );

        // 2. Get class/section combos
        const { data: students } = await supabase
          .from('students')
          .select('class_name, section, parent_email')
          .eq('school_id', schoolId)
          .eq('status', 'active');

        console.log('[AutoGroups] Students found:', students?.length || 0);
        const classMap = new Map<string, { className: string; section: string; parentEmails: Set<string> }>();
        (students || []).forEach(s => {
          const key = `${s.class_name}-${s.section}`;
          if (!classMap.has(key)) {
            classMap.set(key, { className: s.class_name, section: s.section, parentEmails: new Set() });
          }
          if (s.parent_email) classMap.get(key)!.parentEmails.add(s.parent_email);
        });
        console.log('[AutoGroups] Class/section combos:', [...classMap.keys()]);

        // 3. Get all teachers
        const { data: teachers } = await supabase
          .from('teachers')
          .select('user_id, classes')
          .eq('school_id', schoolId);

        const allTeacherIds = (teachers || []).map(t => t.user_id).filter(Boolean) as string[];
        console.log('[AutoGroups] Teachers found:', teachers?.length || 0, 'with user_ids:', allTeacherIds);

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

        // 4a. Clean up orphaned class/section groups (students deleted)
        const activeClassKeys = new Set([...classMap.keys()]);
        const orphanedConvs = (existing || []).filter(c => {
          if (c.type !== 'group' || !c.name) return false;
          // Match pattern "Class X - Y"
          const match = c.name.match(/^Class (.+) - (.+)$/);
          if (!match) return false;
          const key = `${match[1]}-${match[2]}`;
          return !activeClassKeys.has(key);
        });

        if (orphanedConvs.length > 0) {
          const orphanedNames = orphanedConvs.map(c => c.name);
          console.log('[AutoGroups] Cleaning up orphaned groups:', orphanedNames);
          
          // Get IDs of orphaned conversations
          const { data: orphanedRows } = await supabase
            .from('conversations')
            .select('id')
            .eq('school_id', schoolId)
            .in('name', orphanedNames)
            .eq('type', 'group');
          
          const orphanedIds = (orphanedRows || []).map(r => r.id);
          if (orphanedIds.length > 0) {
            await supabase.from('conversation_participants').delete().in('conversation_id', orphanedIds);
            await supabase.from('messages').delete().in('conversation_id', orphanedIds);
            await supabase.from('conversations').delete().in('id', orphanedIds);
          }
        }

        // 4b. Create class/section groups only (no class-wise broadcasts)
        for (const [, cs] of classMap) {
          const name = `Class ${cs.className} - ${cs.section}`;

          let parentIds: string[] = [];
          const emails = [...cs.parentEmails];
          if (emails.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id')
              .in('email', emails);
            parentIds = (profiles || []).map(p => p.id);
          }

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

        // 6. Create "All School" broadcast — includes ALL students, teachers, and parents
        if (!existingKeys.has('broadcast::All School')) {
          // Gather all student user_ids
          const { data: allStudentsWithIds } = await supabase
            .from('students')
            .select('user_id, parent_email')
            .eq('school_id', schoolId)
            .eq('status', 'active');

          const studentUserIds = (allStudentsWithIds || [])
            .map(s => s.user_id)
            .filter(Boolean) as string[];

          // Gather all parent profile IDs
          const allParentEmails = [...new Set(
            (allStudentsWithIds || []).map(s => s.parent_email).filter(Boolean) as string[]
          )];
          let parentProfileIds: string[] = [];
          if (allParentEmails.length > 0) {
            const { data: parentProfiles } = await supabase
              .from('profiles')
              .select('id')
              .in('email', allParentEmails);
            parentProfileIds = (parentProfiles || []).map(p => p.id);
          }

          const allSchoolMembers = [...new Set([...allTeacherIds, ...studentUserIds, ...parentProfileIds])];
          await createConv('broadcast', 'All School', allSchoolMembers);
          created++;
        }

        const totalChanges = created + orphanedConvs.length;
        console.log('[AutoGroups] Created:', created, 'Cleaned up:', orphanedConvs.length);
        if (totalChanges > 0) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      } catch (err) {
        console.error('[AutoGroups] Error:', err);
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [user?.id, schoolId, queryClient]);
}
