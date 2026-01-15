import { useCallback } from 'react';
import { Message } from '../components/ChatBubble';
import {
  createConversation,
  getUserConversations,
  getConversationMessages,
  deleteConversation,
  updateConversationTitle,
  toggleConversationPin,
} from '../utils/database';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
import { getConversationFeedback } from '../utils/feedback';

interface ConversationHandlersParams {
  conversationIdRef: React.MutableRefObject<string | null>;
  userIdRef: React.MutableRefObject<string | null>;
  flatListRef: React.MutableRefObject<any>;
  user: User | null;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setConversations: (conversations: any[]) => void;
  setConversationPreviews: (previews: Map<string, string>) => void;
  setIsFirstMessage: (value: boolean) => void;
  setMessageFeedback: (feedback: any) => void;
  setIsSidebarVisible: (visible: boolean) => void;
  setUndoData: (data: any) => void;
  setRenamingConversation: (data: any) => void;
  setIsRenameModalVisible: (visible: boolean) => void;
}

export function useConversationHandlers(params: ConversationHandlersParams) {
  const {
    conversationIdRef,
    userIdRef,
    flatListRef,
    user,
    setMessages,
    setConversations,
    setConversationPreviews,
    setIsFirstMessage,
    setMessageFeedback,
    setIsSidebarVisible,
    setUndoData,
    setRenamingConversation,
    setIsRenameModalVisible,
  } = params;

  const refreshConversations = useCallback(async () => {
    if (!userIdRef.current) return;
    try {
      const updatedConversations = await getUserConversations(userIdRef.current);
      setConversations(updatedConversations);

      const previews = new Map<string, string>();
      for (const conv of updatedConversations) {
        const messages = await getConversationMessages(conv.id);
        if (messages.length > 0) {
          const lastUserMessage = messages.reverse().find(m => m.role === 'user');
          if (lastUserMessage) {
            const preview = lastUserMessage.content.substring(0, 60);
            previews.set(conv.id, preview.length < lastUserMessage.content.length ? `${preview}...` : preview);
          }
        }
      }
      setConversationPreviews(previews);
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  }, [userIdRef, setConversations, setConversationPreviews]);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      conversationIdRef.current = conversationId;
      const dbMessages = await getConversationMessages(conversationId);

      const formattedMessages: Message[] = dbMessages.map((msg: any) => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: msg.created_at,
      }));

      setMessages(formattedMessages);
      setIsFirstMessage(formattedMessages.length === 0);

      if (userIdRef.current) {
        const feedback = await getConversationFeedback(conversationId, userIdRef.current);
        setMessageFeedback(feedback);
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [conversationIdRef, userIdRef, flatListRef, setMessages, setIsFirstMessage, setMessageFeedback]);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    if (conversationId === conversationIdRef.current) {
      setIsSidebarVisible(false);
      return;
    }
    await loadConversation(conversationId);
    setIsSidebarVisible(false);
  }, [conversationIdRef, loadConversation, setIsSidebarVisible]);

  const handleNewConversation = useCallback(async () => {
    if (!userIdRef.current) return;
    try {
      const conversationId = await createConversation(userIdRef.current);
      conversationIdRef.current = conversationId;
      setMessages([]);
      setMessageFeedback(new Map());
      setIsFirstMessage(true);
      await refreshConversations();
      setIsSidebarVisible(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, [userIdRef, conversationIdRef, setMessages, setMessageFeedback, setIsFirstMessage, refreshConversations, setIsSidebarVisible]);

  const handleDeleteConversation = useCallback(async (conversationId: string, conversations: any[]) => {
    if (!user) return;

    try {
      const conversationMessages = await getConversationMessages(conversationId);
      const conversation = conversations.find(c => c.id === conversationId);

      if (conversation) {
        setUndoData({
          conversationId,
          title: conversation.title,
          messages: conversationMessages,
        });
      }

      await deleteConversation(conversationId, user.id);
      await refreshConversations();

      if (conversationId === conversationIdRef.current) {
        if (conversations.length > 1) {
          const remainingConversations = conversations.filter(c => c.id !== conversationId);
          if (remainingConversations.length > 0) {
            await loadConversation(remainingConversations[0].id);
          } else {
            await handleNewConversation();
          }
        } else {
          await handleNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [user, conversationIdRef, setUndoData, refreshConversations, loadConversation, handleNewConversation]);

  const handleUndoDelete = useCallback(async (undoData: any) => {
    if (!undoData || !user) return;

    try {
      const { error: convError } = await supabase
        .from('conversations')
        .insert({
          id: undoData.conversationId,
          user_id: user.id,
          title: undoData.title,
        });

      if (convError) throw convError;

      if (undoData.messages.length > 0) {
        const { error: msgError } = await supabase
          .from('messages')
          .insert(undoData.messages.map((msg: any) => ({
            id: msg.id,
            conversation_id: msg.conversation_id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
          })));

        if (msgError) throw msgError;
      }

      await refreshConversations();
      setUndoData(null);
    } catch (error) {
      console.error('Failed to undo delete:', error);
    }
  }, [user, refreshConversations, setUndoData]);

  const handleRenameConversation = useCallback((conversationId: string, currentTitle: string) => {
    setRenamingConversation({ id: conversationId, title: currentTitle });
    setIsRenameModalVisible(true);
  }, [setRenamingConversation, setIsRenameModalVisible]);

  const handleSaveRename = useCallback(async (renamingConversation: any, newTitle: string) => {
    if (!renamingConversation) return;

    try {
      await updateConversationTitle(renamingConversation.id, newTitle);
      await refreshConversations();
      setIsRenameModalVisible(false);
      setRenamingConversation(null);
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  }, [refreshConversations, setIsRenameModalVisible, setRenamingConversation]);

  const handleTogglePin = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await toggleConversationPin(conversationId, user.id);
      await refreshConversations();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  }, [user, refreshConversations]);

  return {
    refreshConversations,
    loadConversation,
    handleSelectConversation,
    handleNewConversation,
    handleDeleteConversation,
    handleUndoDelete,
    handleRenameConversation,
    handleSaveRename,
    handleTogglePin,
  };
}
