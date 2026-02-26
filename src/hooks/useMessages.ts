import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useEffect } from 'react';

export interface Conversation {
  id: string;
  school_id: string;
  type: 'direct' | 'group' | 'broadcast';
  name: string | null;
  created_by: string;
  class_name: string | null;
  section: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  participants?: ConversationParticipant[];
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  is_muted: boolean;
  last_read_at: string;
  joined_at: string;
  profile?: { full_name: string; avatar_url: string | null; email: string };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachment_url: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: { full_name: string; avatar_url: string | null };
}

// Fetch all conversations for the current user
export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      
      // Get participants for each conversation
      const convIds = (data || []).map(c => c.id);
      if (convIds.length === 0) return [] as Conversation[];
      
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('*')
        .in('conversation_id', convIds);
      
      // Get participant profiles
      const participantUserIds = [...new Set((participants || []).map(p => p.user_id))];
      const { data: profiles } = participantUserIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, avatar_url, email').in('id', participantUserIds)
        : { data: [] };
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      // Calculate unread counts
      const myParticipations = (participants || []).filter(p => p.user_id === user?.id);
      
      return (data || []).map(conv => {
        const convParticipants = (participants || [])
          .filter(p => p.conversation_id === conv.id)
          .map(p => ({ ...p, profile: profileMap.get(p.user_id) }));
        
        const myParticipation = myParticipations.find(p => p.conversation_id === conv.id);
        // Simple unread: if last_message_at > last_read_at
        const unreadCount = myParticipation && conv.last_message_at && myParticipation.last_read_at
          ? new Date(conv.last_message_at) > new Date(myParticipation.last_read_at) ? 1 : 0
          : 0;
        
        return { ...conv, participants: convParticipants, unread_count: unreadCount } as Conversation;
      });
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

// Fetch messages for a conversation
export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: profiles } = senderIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', senderIds)
        : { data: [] };
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      return (data || []).map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id) || { full_name: 'Unknown', avatar_url: null },
      })) as Message[];
    },
    enabled: !!conversationId,
  });
}

// Real-time subscription for messages
export function useRealtimeMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!conversationId) return;
    
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);
}

// Real-time subscription for conversation list updates
export function useRealtimeConversations() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}

// Send a message
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ conversationId, content, messageType = 'text', attachmentUrl }: {
      conversationId: string;
      content: string;
      messageType?: string;
      attachmentUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content,
          message_type: messageType,
          attachment_url: attachmentUrl || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Create a conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  
  return useMutation({
    mutationFn: async ({ type, name, participantIds, className, section }: {
      type: 'direct' | 'group' | 'broadcast';
      name?: string;
      participantIds: string[];
      className?: string;
      section?: string;
    }) => {
      // For direct messages, check if conversation already exists
      if (type === 'direct' && participantIds.length === 1) {
        const otherId = participantIds[0];
        const { data: existing } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user!.id);
        
        if (existing && existing.length > 0) {
          const myConvIds = existing.map(e => e.conversation_id);
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', otherId)
            .in('conversation_id', myConvIds);
          
          if (otherParticipant && otherParticipant.length > 0) {
            // Check if any of these are direct conversations
            const { data: directConvs } = await supabase
              .from('conversations')
              .select('id')
              .eq('type', 'direct')
              .in('id', otherParticipant.map(p => p.conversation_id));
            
            if (directConvs && directConvs.length > 0) {
              return directConvs[0];
            }
          }
        }
      }

      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          school_id: schoolId!,
          type,
          name: name || null,
          created_by: user!.id,
          class_name: className || null,
          section: section || null,
        })
        .select()
        .single();
      if (convError) throw convError;

      // Add creator as admin participant
      const allParticipants = [
        { conversation_id: conv.id, user_id: user!.id, role: 'admin' as const },
        ...participantIds
          .filter(id => id !== user!.id)
          .map(id => ({ conversation_id: conv.id, user_id: id, role: 'member' as const })),
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(allParticipants);
      if (partError) throw partError;

      return conv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Mark conversation as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Delete a message (soft delete)
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true, content: 'This message was deleted' })
        .eq('id', messageId);
      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
