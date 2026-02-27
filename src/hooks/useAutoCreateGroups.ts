import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Auto-creates group & broadcast conversations for each class/section (students only),
 * plus "All Teachers", "All Parents", "All Students", "All School" broadcasts.
 * Syncs participants when students are added/deleted.
 */
export function useAutoCreateGroups() {
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!user?.id || !schoolId || runningRef.current) return;
    runningRef.current = true;

    const run = async () => {
      try {
        // 1. Get existing conversations
        const { data: existing, error: existErr } = await supabase
          .from('conversations')
          .select('id, name, type')
          .eq('school_id', schoolId);
        if (existErr) { console.error('[AutoGroups]', existErr); return; }

        const existingMap = new Map(
          (existing || []).map(c => [`${c.type}::${c.name}`, c])
        );

        // 2. Get active students with user_id
        const { data: students } = await supabase
          .from('students')
          .select('id, user_id, class_name, section, parent_email')
          .eq('school_id', schoolId)
          .eq('status', 'active');

        // Build class-section map with student user_ids
        const classMap = new Map<string, { className: string; section: string; studentUserIds: string[]; parentEmails: Set<string> }>();
        (students || []).forEach(s => {
          if (!s.user_id) return;
          const key = `${s.class_name}-${s.section}`;
          if (!classMap.has(key)) {
            classMap.set(key, { className: s.class_name, section: s.section, studentUserIds: [], parentEmails: new Set() });
          }
          classMap.get(key)!.studentUserIds.push(s.user_id);
          if (s.parent_email) classMap.get(key)!.parentEmails.add(s.parent_email);
        });

        // 3. Get all teachers
        const { data: teachers } = await supabase
          .from('teachers')
          .select('user_id')
          .eq('school_id', schoolId);
        const allTeacherIds = (teachers || []).map(t => t.user_id).filter(Boolean) as string[];

        // All student user_ids
        const allStudentUserIds = (students || []).map(s => s.user_id).filter(Boolean) as string[];

        // All parent profile IDs
        const allParentEmails = [...new Set((students || []).map(s => s.parent_email).filter(Boolean) as string[])];
        let parentProfileIds: string[] = [];
        if (allParentEmails.length > 0) {
          const { data: parentProfiles } = await supabase.from('profiles').select('id').in('email', allParentEmails);
          parentProfileIds = (parentProfiles || []).map(p => p.id);
        }

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
            .insert({ school_id: schoolId, type, name, created_by: user!.id, class_name: className || null, section: section || null })
            .select()
            .single();
          if (convErr) { console.error('[AutoGroups] Conv error:', convErr); return; }

          const parts = [
            { conversation_id: conv.id, user_id: user!.id, role: 'admin' },
            ...uniqueIds.map(id => ({ conversation_id: conv.id, user_id: id, role: 'member' })),
          ];
          await supabase.from('conversation_participants').insert(parts);
        };

        let changes = 0;

        // 4. Clean up orphaned class groups/broadcasts
        const activeClassKeys = new Set([...classMap.keys()]);
        const orphanedConvs = (existing || []).filter(c => {
          if (!c.name) return false;
          const match = c.name.match(/^Class (.+) - (.+)$/);
          if (!match) return false;
          const key = `${match[1]}-${match[2]}`;
          return !activeClassKeys.has(key);
        });

        if (orphanedConvs.length > 0) {
          const orphanedIds = orphanedConvs.map(c => c.id);
          await supabase.from('conversation_participants').delete().in('conversation_id', orphanedIds);
          await supabase.from('messages').delete().in('conversation_id', orphanedIds);
          await supabase.from('conversations').delete().in('id', orphanedIds);
          changes += orphanedConvs.length;
        }

        // 5. Create/sync class groups (STUDENTS ONLY)
        for (const [, cs] of classMap) {
          const convName = `Class ${cs.className} - ${cs.section}`;
          const groupKey = `group::${convName}`;

          if (!existingMap.has(groupKey)) {
            await createConv('group', convName, cs.studentUserIds, cs.className, cs.section);
            changes++;
          } else {
            // Sync participants - add/remove students
            await syncParticipants(existingMap.get(groupKey)!.id, cs.studentUserIds, user!.id);
          }
        }

        // 6. "All Teachers" group & broadcast
        if (!existingMap.has('group::All Teachers')) {
          await createConv('group', 'All Teachers', allTeacherIds);
          changes++;
        }
        if (!existingMap.has('broadcast::All Teachers')) {
          await createConv('broadcast', 'All Teachers', allTeacherIds);
          changes++;
        }

        // 7. "All Parents" broadcast
        if (!existingMap.has('broadcast::All Parents') && parentProfileIds.length > 0) {
          await createConv('broadcast', 'All Parents', parentProfileIds);
          changes++;
        } else if (existingMap.has('broadcast::All Parents')) {
          await syncParticipants(existingMap.get('broadcast::All Parents')!.id, parentProfileIds, user!.id);
        }

        // 8. "All Students" broadcast
        if (!existingMap.has('broadcast::All Students') && allStudentUserIds.length > 0) {
          await createConv('broadcast', 'All Students', allStudentUserIds);
          changes++;
        } else if (existingMap.has('broadcast::All Students')) {
          await syncParticipants(existingMap.get('broadcast::All Students')!.id, allStudentUserIds, user!.id);
        }

        // 9. "All School" broadcast
        if (!existingMap.has('broadcast::All School')) {
          const allMembers = [...new Set([...allTeacherIds, ...allStudentUserIds, ...parentProfileIds])];
          await createConv('broadcast', 'All School', allMembers);
          changes++;
        } else {
          const allMembers = [...new Set([...allTeacherIds, ...allStudentUserIds, ...parentProfileIds])];
          await syncParticipants(existingMap.get('broadcast::All School')!.id, allMembers, user!.id);
        }

        if (changes > 0) {
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

/**
 * Sync conversation participants: add missing members, remove deleted ones.
 * Preserves the admin user.
 */
async function syncParticipants(conversationId: string, expectedUserIds: string[], adminUserId: string) {
  const { data: currentParts } = await supabase
    .from('conversation_participants')
    .select('id, user_id, role')
    .eq('conversation_id', conversationId);

  const currentMap = new Map((currentParts || []).map(p => [p.user_id, p]));
  const expectedSet = new Set(expectedUserIds);

  // Remove participants who are no longer expected (but not admin)
  const toRemove = (currentParts || []).filter(
    p => p.user_id !== adminUserId && p.role !== 'admin' && !expectedSet.has(p.user_id)
  );
  if (toRemove.length > 0) {
    await supabase.from('conversation_participants').delete().in('id', toRemove.map(p => p.id));
  }

  // Add new participants
  const toAdd = expectedUserIds.filter(id => id !== adminUserId && !currentMap.has(id));
  if (toAdd.length > 0) {
    await supabase.from('conversation_participants').insert(
      toAdd.map(id => ({ conversation_id: conversationId, user_id: id, role: 'member' }))
    );
  }
}
