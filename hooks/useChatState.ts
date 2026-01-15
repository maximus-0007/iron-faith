import { useState, useRef } from 'react';
import { FlatList } from 'react-native';
import { Message } from '../components/ChatBubble';
import { DBConversation, DBMessage } from '../utils/supabase';
import { FeedbackType } from '../utils/feedback';
import { SubscriptionInfo } from '../utils/revenueCat';

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [showPhilosophyIntro, setShowPhilosophyIntro] = useState(false);
  const [showSampleQuestions, setShowSampleQuestions] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<Map<string, FeedbackType>>(new Map());
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [undoData, setUndoData] = useState<{ conversationId: string; title: string; messages: DBMessage[] } | null>(null);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renamingConversation, setRenamingConversation] = useState<{ id: string; title: string } | null>(null);
  const [conversationPreviews, setConversationPreviews] = useState<Map<string, string>>(new Map());

  const flatListRef = useRef<FlatList>(null);
  const conversationIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const contentHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  return {
    state: {
      messages,
      conversations,
      isLoading,
      isInitializing,
      isSidebarVisible,
      isSettingsVisible,
      isPaywallVisible,
      isFirstMessage,
      showScrollButton,
      isNearBottom,
      isSearchVisible,
      searchQuery,
      searchResults,
      currentSearchIndex,
      isExportModalVisible,
      editingMessageId,
      editingMessageContent,
      userProfile,
      retryingMessageId,
      showPhilosophyIntro,
      showSampleQuestions,
      messageFeedback,
      isSyncingQueue,
      subscription,
      undoData,
      isRenameModalVisible,
      renamingConversation,
      conversationPreviews,
    },
    setters: {
      setMessages,
      setConversations,
      setIsLoading,
      setIsInitializing,
      setIsSidebarVisible,
      setIsSettingsVisible,
      setIsPaywallVisible,
      setIsFirstMessage,
      setShowScrollButton,
      setIsNearBottom,
      setIsSearchVisible,
      setSearchQuery,
      setSearchResults,
      setCurrentSearchIndex,
      setIsExportModalVisible,
      setEditingMessageId,
      setEditingMessageContent,
      setUserProfile,
      setRetryingMessageId,
      setShowPhilosophyIntro,
      setShowSampleQuestions,
      setMessageFeedback,
      setIsSyncingQueue,
      setSubscription,
      setUndoData,
      setIsRenameModalVisible,
      setRenamingConversation,
      setConversationPreviews,
    },
    refs: {
      flatListRef,
      conversationIdRef,
      userIdRef,
      contentHeightRef,
      scrollOffsetRef,
      abortControllerRef,
    },
  };
}
