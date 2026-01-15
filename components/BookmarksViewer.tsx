import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { X, Bookmark, Trash2, MessageSquare } from 'lucide-react-native';
import { useSettings } from '../utils/settings';
import { getBookmarks, removeBookmark, type MessageBookmark } from '../utils/bookmarks';

interface BookmarksViewerProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onNavigateToMessage?: (conversationId: string, messageId: string) => void;
}

interface GroupedBookmarks {
  conversationId: string;
  conversationTitle?: string;
  bookmarks: MessageBookmark[];
}

export function BookmarksViewer({
  visible,
  userId,
  onClose,
  onNavigateToMessage,
}: BookmarksViewerProps) {
  const { theme } = useSettings();
  const [bookmarks, setBookmarks] = useState<MessageBookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadBookmarks();
    }
  }, [visible, userId]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const data = await getBookmarks(userId);
      setBookmarks(data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookmarkId: string, messageId: string) => {
    setDeletingId(bookmarkId);
    try {
      const success = await removeBookmark(userId, messageId);
      if (success) {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNavigate = (conversationId: string, messageId: string) => {
    if (onNavigateToMessage) {
      onNavigateToMessage(conversationId, messageId);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <Bookmark size={24} color={theme.primary} strokeWidth={2} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>Bookmarks</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading bookmarks...
              </Text>
            </View>
          )}

          {!loading && bookmarks.length === 0 && (
            <View style={styles.emptyContainer}>
              <Bookmark size={64} color={theme.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No bookmarks yet
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                Tap the bookmark icon on any message to save it here for quick access
              </Text>
            </View>
          )}

          {!loading && bookmarks.length > 0 && (
            <View style={styles.bookmarksList}>
              {bookmarks.map(bookmark => (
                <Pressable
                  key={bookmark.id}
                  style={({ pressed }) => [
                    styles.bookmarkItem,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    pressed && { backgroundColor: theme.surfaceSecondary }
                  ]}
                  onPress={() => handleNavigate(bookmark.conversation_id, bookmark.message_id)}
                >
                  <View style={styles.bookmarkContent}>
                    <View style={styles.bookmarkHeader}>
                      <MessageSquare size={16} color={theme.textSecondary} strokeWidth={2} />
                      <Text style={[styles.bookmarkDate, { color: theme.textSecondary }]}>
                        {formatDate(bookmark.created_at)}
                      </Text>
                    </View>

                    {bookmark.note && (
                      <Text style={[styles.bookmarkNote, { color: theme.text }]}>
                        {bookmark.note}
                      </Text>
                    )}

                    <Text style={[styles.bookmarkId, { color: theme.textTertiary }]}>
                      Message ID: {bookmark.message_id.substring(0, 8)}...
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(bookmark.id, bookmark.message_id)}
                    disabled={deletingId === bookmark.id}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {deletingId === bookmark.id ? (
                      <ActivityIndicator size="small" color={theme.error} />
                    ) : (
                      <Trash2 size={20} color={theme.error} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer info */}
        {!loading && bookmarks.length > 0 && (
          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bookmarksList: {
    padding: 16,
    gap: 12,
  },
  bookmarkItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  bookmarkContent: {
    flex: 1,
    gap: 8,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  bookmarkNote: {
    fontSize: 15,
    lineHeight: 22,
  },
  bookmarkId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  deleteButton: {
    padding: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});
