import { useCallback } from 'react';
import { Message, MessageStatus } from '../components/ChatBubble';
import {
  saveMessage,
  updateConversationTitle,
  generateConversationTitle,
  getUserTranslationPreferences,
} from '../utils/database';
import { sendChatMessage } from '../utils/api';
import { categorizeError } from '../utils/errorHandler';
import { prefetchAndCacheVerses } from '../utils/bible';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

interface MessageHandlersParams {
  conversationIdRef: React.MutableRefObject<string | null>;
  flatListRef: React.MutableRefObject<any>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  user: User | null;
  userProfile: any;
  messages: Message[];
  isFirstMessage: boolean;
  settings: any;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFirstMessage: (value: boolean) => void;
  setIsPaywallVisible: (visible: boolean) => void;
  setEditingMessageId: (id: string | null) => void;
  setEditingMessageContent: (content: string) => void;
  setRetryingMessageId: (id: string | null) => void;
  refreshConversations: () => Promise<void>;
}

export function useMessageHandlers(params: MessageHandlersParams) {
  const {
    conversationIdRef,
    flatListRef,
    abortControllerRef,
    user,
    userProfile,
    messages,
    isFirstMessage,
    settings,
    setMessages,
    setIsLoading,
    setIsFirstMessage,
    setIsPaywallVisible,
    setEditingMessageId,
    setEditingMessageContent,
    setRetryingMessageId,
    refreshConversations,
  } = params;

  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationIdRef.current) {
      console.error('No conversation initialized');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, aiMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await saveMessage(conversationIdRef.current, 'user', content);

      if (isFirstMessage) {
        const generatedTitle = generateConversationTitle(content);
        await updateConversationTitle(conversationIdRef.current, generatedTitle);
        await refreshConversations();
        setIsFirstMessage(false);

        if (user?.id && userProfile && !userProfile.first_message_sent_at) {
          await supabase
            .from('user_profiles')
            .update({ first_message_sent_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }
      }

      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      let accumulatedContent = '';
      let updateTimeout: ReturnType<typeof setTimeout> | null = null;
      let pendingChunks = '';

      const flushUpdate = () => {
        const contentToFlush = accumulatedContent;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: contentToFlush }
              : msg
          )
        );
        updateTimeout = null;
      };

      const response = await sendChatMessage(
        content,
        conversationHistory,
        settings,
        (chunk: string) => {
          accumulatedContent += chunk;
          pendingChunks += chunk;

          const lastSpaceIndex = pendingChunks.lastIndexOf(' ');
          const lastNewlineIndex = pendingChunks.lastIndexOf('\n');
          const lastBreakIndex = Math.max(lastSpaceIndex, lastNewlineIndex);

          if (lastBreakIndex > 0 || pendingChunks.length > 30) {
            if (updateTimeout) {
              clearTimeout(updateTimeout);
            }

            updateTimeout = setTimeout(flushUpdate, 200);
            pendingChunks = '';
          }
        },
        userProfile,
        conversationIdRef.current || undefined
      );

      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      flushUpdate();

      await saveMessage(conversationIdRef.current, 'assistant', response.answer);

      if (user?.id) {
        try {
          const userPrefs = await getUserTranslationPreferences(user.id);
          const translationIds = userPrefs.length > 0
            ? userPrefs.map(p => p.translation_id)
            : ['9879dbb7cfe39e4d-01', 'de4e12af7f28f599-02'];

          prefetchAndCacheVerses(response.answer, user.id, translationIds).catch(err => {
            console.warn('Background verse prefetching failed (non-critical):', err);
          });
        } catch (prefetchError) {
          console.warn('Failed to start verse prefetching:', prefetchError);
        }
      }
    } catch (error: any) {
      const appError = categorizeError(error);

      if (appError.type === 'rate_limit') {
        setMessages(prev => prev.slice(0, -2));
        setIsPaywallVisible(true);
      } else {
        setMessages(prev =>
          prev.map((msg, index) =>
            index === prev.length - 2
              ? { ...msg, status: 'failed' as MessageStatus, error: appError.userMessage }
              : msg
          ).slice(0, -1)
        );

        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: appError.userMessage,
          timestamp: new Date().toISOString(),
          status: 'failed' as MessageStatus,
          error: appError.userMessage,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    conversationIdRef,
    flatListRef,
    user,
    userProfile,
    messages,
    isFirstMessage,
    settings,
    setMessages,
    setIsLoading,
    setIsFirstMessage,
    setIsPaywallVisible,
    refreshConversations,
  ]);

  const handleCancelAI = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    setMessages(prev => {
      const filtered = prev.filter(msg => msg.status !== 'sending');
      if (filtered.length > 0 && filtered[filtered.length - 1].type === 'ai' && !filtered[filtered.length - 1].content) {
        return filtered.slice(0, -1);
      }
      return filtered;
    });
  }, [abortControllerRef, setIsLoading, setMessages]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, [setMessages]);

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const previousMessage = messages[messageIndex - 1];
    if (previousMessage.type !== 'user') return;

    setMessages(prev => prev.slice(0, messageIndex));
    await handleSendMessage(previousMessage.content);
  }, [messages, setMessages, handleSendMessage]);

  const handleEditMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.type === 'user') {
      setEditingMessageId(messageId);
      setEditingMessageContent(message.content);
    }
  }, [messages, setEditingMessageId, setEditingMessageContent]);

  const handleSaveEdit = useCallback(async (editingMessageId: string | null, newContent: string) => {
    if (!editingMessageId) return;

    const messageIndex = messages.findIndex(m => m.id === editingMessageId);
    if (messageIndex === -1) return;

    setMessages(prev => prev.slice(0, messageIndex));
    setEditingMessageId(null);
    setEditingMessageContent('');

    await handleSendMessage(newContent);
  }, [messages, setMessages, setEditingMessageId, setEditingMessageContent, handleSendMessage]);

  const handleRetryMessage = useCallback(async (messageId: string) => {
    const failedMessageIndex = messages.findIndex(m => m.id === messageId);
    if (failedMessageIndex === -1 || failedMessageIndex === 0) return;

    const previousMessage = messages[failedMessageIndex - 1];
    if (previousMessage.type !== 'user') return;

    setRetryingMessageId(messageId);
    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      await handleSendMessage(previousMessage.content);
    } finally {
      setRetryingMessageId(null);
    }
  }, [messages, setMessages, setRetryingMessageId, handleSendMessage]);

  return {
    handleSendMessage,
    handleCancelAI,
    handleDeleteMessage,
    handleRegenerateMessage,
    handleEditMessage,
    handleSaveEdit,
    handleRetryMessage,
  };
}
