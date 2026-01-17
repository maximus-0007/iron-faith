import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, SafeAreaView, TouchableOpacity, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Menu, Settings, Search, Download, Lightbulb } from 'lucide-react-native';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import ConversationSidebar from '../components/ConversationSidebar';
import SettingsModal from '../components/SettingsModal';
import PaywallModal from '../components/PaywallModal';
import ThinkingIndicator from '../components/ThinkingIndicator';
import ScrollToBottomButton from '../components/ScrollToBottomButton';
import DateSeparator from '../components/DateSeparator';
import ConversationSearchBar from '../components/ConversationSearchBar';
import ExportModal from '../components/ExportModal';
import MessageEditModal from '../components/MessageEditModal';
import RenameConversationModal from '../components/RenameConversationModal';
import UndoSnackbar from '../components/UndoSnackbar';
import NetworkStatusBanner from '../components/NetworkStatusBanner';
import SubscriptionBanner from '../components/SubscriptionBanner';
import IronSharpenIronIntro from '../components/IronSharpenIronIntro';
import SampleQuestions from '../components/SampleQuestions';
import { getSubscriptionStatus } from '../utils/revenueCat';
import { useAuth } from '../utils/AuthContext';
import { exportConversation } from '../utils/exportConversation';
import { createConversation, getUserConversations } from '../utils/database';
import { supabase } from '../utils/supabase';
import { useSettings } from '../utils/settings';
import { processMessageQueue, hasQueuedMessages } from '../utils/messageQueue';
import { useNetworkStatus, addNetworkListener } from '../utils/networkStatus';
import { insertDateSeparators } from '../utils/chatUtils';
import { useChatState } from '../hooks/useChatState';
import { useConversationHandlers } from '../hooks/useConversationHandlers';
import { useMessageHandlers } from '../hooks/useMessageHandlers';
import { useSearchHandlers } from '../hooks/useSearchHandlers';

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768 && Platform.OS === 'ios';
  const isPersistentSidebar = isTablet && width >= 1024;

  const { settings, theme, loadProfileFromDatabase } = useSettings();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const { state, setters, refs } = useChatState();
  const {
    messages,
    conversations,
    isLoading,
    isInitializing,
    isSidebarVisible,
    isSettingsVisible,
    isPaywallVisible,
    isFirstMessage,
    showScrollButton,
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
  } = state;

  const {
    setMessages,
    setConversations,
    setIsLoading,
    setIsInitializing,
    setIsSidebarVisible,
    setIsSettingsVisible,
    setIsPaywallVisible,
    setIsFirstMessage,
    setShowScrollButton,
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
  } = setters;

  const {
    flatListRef,
    conversationIdRef,
    userIdRef,
    contentHeightRef,
    scrollOffsetRef,
    abortControllerRef,
  } = refs;

  useEffect(() => {
    setIsSidebarVisible(isPersistentSidebar);
  }, [isPersistentSidebar]);

  const conversationHandlers = useConversationHandlers({
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
  });

  const messageHandlers = useMessageHandlers({
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
    refreshConversations: conversationHandlers.refreshConversations,
  });

  const searchHandlers = useSearchHandlers({
    flatListRef,
    messages,
    searchResults,
    currentSearchIndex,
    setSearchQuery,
    setSearchResults,
    setCurrentSearchIndex,
    setIsSearchVisible,
  });

  useEffect(() => {
    if (user?.id) {
      initializeChat();
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = addNetworkListener(async (online) => {
      if (online) {
        const hasQueued = await hasQueuedMessages();
        if (hasQueued) {
          await syncQueuedMessages();
        }
      }
    });

    return unsubscribe;
  }, [user?.id]);

  async function initializeChat() {
    if (!user?.id) {
      setIsInitializing(false);
      return;
    }

    try {
      console.log('[ChatScreen] Initializing chat for user:', user.id);
      userIdRef.current = user.id;

      await loadProfileFromDatabase(user.id);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('relationship_status, has_children, career_stage, spiritual_struggles, onboarding_completed, first_message_sent_at')
        .eq('user_id', user.id)
        .maybeSingle();

      setUserProfile(profile);

      if (profile && !profile.onboarding_completed && !profile.first_message_sent_at) {
        setShowPhilosophyIntro(true);
      }

      const existingConversations = await getUserConversations(user.id);
      console.log('[ChatScreen] Found conversations:', existingConversations.length);
      setConversations(existingConversations);

      if (existingConversations.length > 0) {
        console.log('[ChatScreen] Loading existing conversation:', existingConversations[0].id);
        await conversationHandlers.loadConversation(existingConversations[0].id);
      } else {
        console.log('[ChatScreen] Creating new conversation');
        const conversationId = await createConversation(user.id);
        conversationIdRef.current = conversationId;
        console.log('[ChatScreen] Created conversation:', conversationId);
        await conversationHandlers.refreshConversations();
      }

      const hasQueued = await hasQueuedMessages();
      if (hasQueued && isOnline) {
        await syncQueuedMessages();
      }

      const subStatus = await getSubscriptionStatus();
      setSubscription(subStatus);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setIsInitializing(false);
    }
  }

  async function refreshSubscriptionStatus() {
    try {
      const subStatus = await getSubscriptionStatus();
      setSubscription(subStatus);
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
    }
  }

  async function syncQueuedMessages() {
    if (isSyncingQueue) return;

    try {
      setIsSyncingQueue(true);
      await processMessageQueue();
      await conversationHandlers.refreshConversations();
      if (conversationIdRef.current) {
        await conversationHandlers.loadConversation(conversationIdRef.current);
      }
    } catch (error) {
      console.error('Failed to sync queued messages:', error);
    } finally {
      setIsSyncingQueue(false);
    }
  }

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollOffsetRef.current = contentOffset.y;
    contentHeightRef.current = contentSize.height;

    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    const nearBottom = distanceFromBottom < 100;

    setShowScrollButton(!nearBottom && messages.length > 3);
  }, [messages.length, scrollOffsetRef, contentHeightRef, setShowScrollButton]);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [flatListRef]);

  const handleExport = useCallback(async (format: 'text' | 'markdown'): Promise<void> => {
    try {
      const currentConversation = conversations.find(c => c.id === conversationIdRef.current);
      const title = currentConversation?.title || 'Iron Faith Conversation';
      await exportConversation(messages, format, title);
    } catch (error) {
      console.error('Failed to export conversation:', error);
      throw error;
    }
  }, [conversations, conversationIdRef, messages]);

  const handlePhilosophyContinue = useCallback(() => {
    setShowPhilosophyIntro(false);
    setShowSampleQuestions(true);
  }, [setShowPhilosophyIntro, setShowSampleQuestions]);

  const handleSelectSampleQuestion = useCallback(async (question: string) => {
    console.log('[ChatScreen] Sample question selected', {
      question: question.substring(0, 50),
      conversationId: conversationIdRef.current
    });

    setShowSampleQuestions(false);

    if (user?.id) {
      await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    if (!conversationIdRef.current) {
      console.error('[ChatScreen] No conversation when selecting sample question, creating one');
      if (user?.id) {
        const conversationId = await createConversation(user.id);
        conversationIdRef.current = conversationId;
        await conversationHandlers.refreshConversations();
      }
    }

    await messageHandlers.handleSendMessage(question);
  }, [user, setShowSampleQuestions, messageHandlers, conversationIdRef, conversationHandlers]);

  const handleSkipOnboarding = useCallback(async () => {
    setShowPhilosophyIntro(false);
    setShowSampleQuestions(false);

    if (user?.id) {
      await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }
  }, [user, setShowPhilosophyIntro, setShowSampleQuestions]);

  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.loadingIndicator} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Preparing your chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sidebarWidth = width < 768 ? width * 0.85 : 300;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <NetworkStatusBanner isSyncing={isSyncingQueue} />
      <SubscriptionBanner
        subscription={subscription}
        onUpgrade={() => setIsPaywallVisible(true)}
        theme={theme}
      />
      <View style={styles.mainContainer}>
        {isSidebarVisible && (
          <View style={[styles.sidebar, { width: sidebarWidth }]}>
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={conversationIdRef.current}
              userId={user?.id || ''}
              onSelectConversation={conversationHandlers.handleSelectConversation}
              onNewConversation={conversationHandlers.handleNewConversation}
              onDeleteConversation={(id) => conversationHandlers.handleDeleteConversation(id, conversations)}
              onRenameConversation={conversationHandlers.handleRenameConversation}
              onTogglePin={conversationHandlers.handleTogglePin}
              onClose={() => setIsSidebarVisible(false)}
              conversationPreviews={conversationPreviews}
            />
          </View>
        )}

        <View style={styles.chatContainer}>
          <LinearGradient
            colors={theme.gradients.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.header, { borderBottomColor: theme.border }]}
          >
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsSidebarVisible(!isSidebarVisible)}
              activeOpacity={0.7}
            >
              <Menu size={24} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.headerTitleContainer}>
                <Image
                  source={require('../assets/images/your_paragraph_text_(10).png')}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.headerTitle, { color: theme.text }]}>Iron Faith</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {!showPhilosophyIntro && !showSampleQuestions && messages.length === 0 && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowSampleQuestions(true)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityLabel="Show sample questions"
                  accessibilityRole="button"
                >
                  <Lightbulb size={22} color={theme.primary} strokeWidth={2} />
                </TouchableOpacity>
              )}
              {messages.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setIsSearchVisible(!isSearchVisible)}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityLabel="Search conversation"
                    accessibilityRole="button"
                  >
                    <Search size={22} color={theme.text} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setIsExportModalVisible(true)}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityLabel="Export conversation"
                    accessibilityRole="button"
                  >
                    <Download size={22} color={theme.text} strokeWidth={2} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsSettingsVisible(true)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Settings"
                accessibilityRole="button"
              >
                <Settings size={22} color={theme.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ConversationSearchBar
            visible={isSearchVisible}
            onClose={searchHandlers.handleCloseSearch}
            onSearch={searchHandlers.handleSearch}
            currentIndex={currentSearchIndex}
            totalResults={searchResults.length}
            onNavigate={searchHandlers.handleSearchNavigate}
          />

          {showPhilosophyIntro ? (
            <IronSharpenIronIntro onContinue={handlePhilosophyContinue} />
          ) : showSampleQuestions ? (
            <SampleQuestions onSelectQuestion={handleSelectSampleQuestion} />
          ) : messages.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Image
                  source={require('../assets/images/your_paragraph_text_(10).png')}
                  style={styles.emptyLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Start a Conversation</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Type your question below or ask for suggestions
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={insertDateSeparators(messages)}
                renderItem={({ item }) => {
                  if ('type' in item && item.type === 'date') {
                    return <DateSeparator date={item.date} />;
                  }
                  const message = item;
                  return (
                    <ChatBubble
                      message={message}
                      conversationId={conversationIdRef.current || ''}
                      userId={user?.id}
                      onDelete={messageHandlers.handleDeleteMessage}
                      onRegenerate={messageHandlers.handleRegenerateMessage}
                      onEdit={messageHandlers.handleEditMessage}
                      onRetry={messageHandlers.handleRetryMessage}
                      isRetrying={retryingMessageId === message.id}
                      initialFeedback={messageFeedback.get(message.id) || null}
                    />
                  );
                }}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={15}
                windowSize={21}
              />
              <ScrollToBottomButton
                visible={showScrollButton}
                onPress={scrollToBottom}
              />
            </>
          )}

          {isLoading && <ThinkingIndicator />}

          {!showPhilosophyIntro && !showSampleQuestions && (
            <ChatInput
              onSend={messageHandlers.handleSendMessage}
              disabled={isLoading}
              loading={isLoading}
              onStop={messageHandlers.handleCancelAI}
              userId={user?.id || null}
              onLimitReached={() => setIsPaywallVisible(true)}
            />
          )}
        </View>
      </View>

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        userId={userIdRef.current || undefined}
        onOpenPaywall={() => setIsPaywallVisible(true)}
      />

      <PaywallModal
        visible={isPaywallVisible}
        onClose={() => setIsPaywallVisible(false)}
        onSuccess={async () => {
          await refreshSubscriptionStatus();
          setIsPaywallVisible(false);
        }}
        theme={theme}
      />

      <ExportModal
        visible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        onExport={handleExport}
      />

      <MessageEditModal
        visible={!!editingMessageId}
        initialContent={editingMessageContent}
        onClose={() => {
          setEditingMessageId(null);
          setEditingMessageContent('');
        }}
        onSave={(newContent) => messageHandlers.handleSaveEdit(editingMessageId, newContent)}
      />

      <RenameConversationModal
        visible={isRenameModalVisible}
        initialTitle={renamingConversation?.title || ''}
        onClose={() => {
          setIsRenameModalVisible(false);
          setRenamingConversation(null);
        }}
        onSave={(newTitle) => conversationHandlers.handleSaveRename(renamingConversation, newTitle)}
      />

      <UndoSnackbar
        visible={!!undoData}
        message={`Deleted "${undoData?.title || 'conversation'}"`}
        onUndo={() => conversationHandlers.handleUndoDelete(undoData)}
        onDismiss={() => setUndoData(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chatContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
    width: 40,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  messageList: {
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    marginBottom: 24,
  },
  emptyLogo: {
    width: 100,
    height: 100,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 300,
  },
  loadingText: {
    fontSize: 14,
  },
});
