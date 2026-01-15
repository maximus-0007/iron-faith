import { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Pressable, Share } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { haptics } from '../utils/haptics';
import * as Clipboard from 'expo-clipboard';
import { useSettings } from '../utils/settings';
import { VerseViewer } from './VerseViewer';
import { parseScriptureReferences, isSingleVerse } from '../utils/bible';
import MessageActionsMenu from './MessageActionsMenu';
import { setMessageFeedback, removeMessageFeedback, FeedbackType } from '../utils/feedback';
import MessageRetryButton from './MessageRetryButton';

export type MessageStatus = 'sent' | 'sending' | 'failed' | 'queued';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  status?: MessageStatus;
  error?: string;
}

interface ChatBubbleProps {
  message: Message;
  conversationId: string;
  isBookmarked?: boolean;
  onToggleBookmark?: (messageId: string) => void;
  userId?: string;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  initialFeedback?: FeedbackType | null;
  onRetry?: (messageId: string) => void;
  isRetrying?: boolean;
}

function ChatBubble({
  message,
  conversationId,
  isBookmarked = false,
  onToggleBookmark,
  userId,
  onDelete,
  onRegenerate,
  onEdit,
  initialFeedback = null,
  onRetry,
  isRetrying = false
}: ChatBubbleProps) {
  const isUser = message.type === 'user';
  const { theme } = useSettings();
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType | null>(initialFeedback);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const processContentWithVerseLinks = (content: string): string => {
    const references = parseScriptureReferences(content);
    const singleVerseRefs = references.filter(ref => isSingleVerse(ref));
    let processedContent = content;

    singleVerseRefs.forEach(ref => {
      const regex = new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedContent = processedContent.replace(
        regex,
        `[${ref}](verse://${encodeURIComponent(ref)})`
      );
    });

    return processedContent;
  };

  const handleLinkPress = (url: string) => {
    if (url.startsWith('verse://')) {
      const reference = decodeURIComponent(url.replace('verse://', ''));
      setSelectedVerse(reference);
      return false;
    }
    return true;
  };

  const handleBookmarkPress = () => {
    if (onToggleBookmark) {
      onToggleBookmark(message.id);
      haptics.light();
    }
  };

  const handleLongPress = () => {
    haptics.medium();
    setShowActionsMenu(true);
  };

  const handlePress = () => {
    setShowTimestamp(!showTimestamp);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(message.content);
      } else {
        await Share.share({
          message: message.content,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message.id);
    }
  };

  const handleFeedback = async (type: FeedbackType) => {
    if (!userId) return;

    haptics.light();

    if (feedback === type) {
      setFeedback(null);
      await removeMessageFeedback(message.id, userId);
    } else {
      setFeedback(type);
      await setMessageFeedback(message.id, userId, type);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const dynamicMarkdownStyles = {
    body: {
      color: theme.aiBubbleText,
      fontSize: 16,
      lineHeight: 25,
      backgroundColor: 'transparent',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 12,
      backgroundColor: 'transparent',
      padding: 0,
    },
    text: {
      backgroundColor: 'transparent',
      padding: 0,
      margin: 0,
    },
    textgroup: {
      backgroundColor: 'transparent',
      padding: 0,
      margin: 0,
      borderWidth: 0,
    },
    strong: {
      fontWeight: '700' as const,
      backgroundColor: 'transparent',
      color: theme.text,
    },
    em: {
      fontStyle: 'italic' as const,
      backgroundColor: 'transparent',
    },
    heading1: {
      fontSize: 22,
      fontWeight: '800' as const,
      marginBottom: 12,
      marginTop: 8,
      lineHeight: 28,
      color: theme.text,
    },
    heading2: {
      fontSize: 20,
      fontWeight: '700' as const,
      marginBottom: 10,
      marginTop: 8,
      lineHeight: 26,
      color: theme.text,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '700' as const,
      marginBottom: 8,
      marginTop: 6,
      lineHeight: 24,
      color: theme.text,
    },
    bullet_list: {
      marginBottom: 12,
      marginTop: 4,
      backgroundColor: 'transparent',
    },
    ordered_list: {
      marginBottom: 12,
      marginTop: 4,
      backgroundColor: 'transparent',
    },
    list_item: {
      marginBottom: 6,
      backgroundColor: 'transparent',
      paddingLeft: 4,
    },
    code_inline: {
      backgroundColor: theme.markdown.codeBackground,
      color: theme.markdown.codeText,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 5,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
      fontSize: 14,
    },
    code_block: {
      backgroundColor: theme.markdown.codeBackground,
      color: theme.markdown.codeText,
      padding: 12,
      borderRadius: 10,
      marginBottom: 12,
      marginTop: 6,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
      fontSize: 14,
      lineHeight: 20,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    link: {
      color: theme.markdown.linkText,
      textDecorationLine: 'underline' as const,
      backgroundColor: 'transparent',
      fontWeight: '600' as const,
      padding: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      margin: 0,
      marginHorizontal: 0,
      marginVertical: 0,
      borderWidth: 0,
    },
    blockquote: {
      backgroundColor: 'rgba(0, 74, 173, 0.06)',
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      paddingLeft: 12,
      paddingRight: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 6,
    },
    fence: {
      backgroundColor: theme.markdown.codeBackground,
      color: theme.markdown.codeText,
      padding: 12,
      borderRadius: 10,
      marginBottom: 12,
      marginTop: 6,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
      fontSize: 14,
      lineHeight: 20,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    hr: {
      backgroundColor: theme.border,
      height: 1,
      marginVertical: 12,
    },
    hardbreak: {
      backgroundColor: 'transparent',
    },
    softbreak: {
      backgroundColor: 'transparent',
    },
  };

  const customRenderRules = {
    link: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text
          key={node.key}
          onPress={() => handleLinkPress(node.attributes.href)}
          style={{
            color: theme.markdown.linkText,
            textDecorationLine: 'underline',
            fontWeight: '600',
          }}
        >
          {children}
        </Text>
      );
    },
  };

  const processedContent = !isUser
    ? processContentWithVerseLinks(message.content)
    : message.content;

  return (
    <>
      <Animated.View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={styles.bubbleWrapper}
          accessible={true}
          accessibilityLabel={isUser ? "Your message" : "Assistant response"}
          accessibilityValue={{ text: message.content }}
          accessibilityRole="text"
          accessibilityHint="Tap to show timestamp, long press for options"
        >
          <LinearGradient
            colors={isUser ? theme.gradients.userBubble : theme.gradients.aiBubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.bubble,
              !isUser && { borderWidth: 0.5, borderColor: 'rgba(0, 74, 173, 0.2)' },
              isUser && styles.userBubbleShadow,
              !isUser && styles.aiBubbleShadow,
            ]}
          >
            {isUser ? (
              <Text style={[styles.userText, { color: theme.userBubbleText }]}>
                {message.content}
              </Text>
            ) : (
              <Markdown
                style={dynamicMarkdownStyles}
                mergeStyle={false}
                rules={customRenderRules}
              >
                {processedContent}
              </Markdown>
            )}
          </LinearGradient>

          {showTimestamp && (
            <View style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAi]}>
              <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
                {formatTimestamp(message.timestamp)}
              </Text>
            </View>
          )}

          {onToggleBookmark && (
            <TouchableOpacity
              style={[
                styles.bookmarkButton,
                { backgroundColor: theme.surface },
                isUser && styles.bookmarkButtonUser
              ]}
              onPress={handleBookmarkPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityLabel={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              accessibilityHint={isBookmarked ? "Removes this message from bookmarks" : "Saves this message to bookmarks"}
              accessibilityRole="button"
            >
              {isBookmarked ? (
                <BookmarkCheck
                  size={16}
                  color={theme.primary}
                  strokeWidth={2}
                  fill={theme.primary}
                />
              ) : (
                <Bookmark
                  size={16}
                  color={theme.textSecondary}
                  strokeWidth={2}
                />
              )}
            </TouchableOpacity>
          )}
        </Pressable>

        {!isUser && userId && message.content.length > 0 && (
          <View style={styles.feedbackContainer}>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                { backgroundColor: theme.surface },
                feedback === 'positive' && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }
              ]}
              onPress={() => handleFeedback('positive')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityLabel="Helpful response"
              accessibilityRole="button"
            >
              <ThumbsUp
                size={14}
                color={feedback === 'positive' ? '#10B981' : theme.textTertiary}
                strokeWidth={2}
                fill={feedback === 'positive' ? '#10B981' : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                { backgroundColor: theme.surface },
                feedback === 'negative' && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
              ]}
              onPress={() => handleFeedback('negative')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityLabel="Not helpful response"
              accessibilityRole="button"
            >
              <ThumbsDown
                size={14}
                color={feedback === 'negative' ? '#EF4444' : theme.textTertiary}
                strokeWidth={2}
                fill={feedback === 'negative' ? '#EF4444' : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        )}

        {message.status === 'failed' && onRetry && (
          <MessageRetryButton
            onRetry={() => onRetry(message.id)}
            isRetrying={isRetrying}
          />
        )}
      </Animated.View>

      <MessageActionsMenu
        visible={showActionsMenu}
        onClose={() => setShowActionsMenu(false)}
        onCopy={handleCopy}
        onShare={handleShare}
        onRegenerate={!isUser ? handleRegenerate : undefined}
        onDelete={handleDelete}
        onEdit={isUser ? handleEdit : undefined}
        isUserMessage={isUser}
      />

      {selectedVerse && (
        <VerseViewer
          visible={!!selectedVerse}
          reference={selectedVerse}
          onClose={() => setSelectedVerse(null)}
          userId={userId}
        />
      )}
    </>
  );
}

export default memo(ChatBubble, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.initialFeedback === nextProps.initialFeedback
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubbleWrapper: {
    position: 'relative',
    maxWidth: '85%',
  },
  bubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  userBubbleShadow: {
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiBubbleShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  bookmarkButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookmarkButtonUser: {
    right: 'auto',
    left: -8,
  },
  timestamp: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timestampUser: {
    alignSelf: 'flex-end',
  },
  timestampAi: {
    alignSelf: 'flex-start',
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '500',
  },
  feedbackContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingLeft: 4,
  },
  feedbackButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
