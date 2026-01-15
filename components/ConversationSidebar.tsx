import { useState, useMemo, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, X } from 'lucide-react-native';
import { DBConversation } from '../utils/supabase';
import ConversationListItem from './ConversationListItem';
import { SearchBar } from './SearchBar';
import { useSettings } from '../utils/settings';

interface ConversationSidebarProps {
  conversations: DBConversation[];
  activeConversationId: string | null;
  userId: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onTogglePin: (conversationId: string) => void;
  onClose: () => void;
  conversationPreviews?: Map<string, string>;
}

type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Older';

interface GroupedConversations {
  group: DateGroup;
  conversations: DBConversation[];
}

function getDateGroup(dateString: string): DateGroup {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  if (date >= today) {
    return 'Today';
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else if (date >= weekAgo) {
    return 'This Week';
  } else if (date >= monthAgo) {
    return 'This Month';
  }
  return 'Older';
}

function groupConversationsByDate(conversations: DBConversation[]): GroupedConversations[] {
  const groups: Map<DateGroup, DBConversation[]> = new Map();
  const groupOrder: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  groupOrder.forEach(group => groups.set(group, []));

  conversations.forEach(conv => {
    const group = getDateGroup(conv.updated_at);
    groups.get(group)?.push(conv);
  });

  return groupOrder
    .filter(group => (groups.get(group)?.length || 0) > 0)
    .map(group => ({
      group,
      conversations: groups.get(group) || [],
    }));
}

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  userId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onClose,
  conversationPreviews,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useSettings();

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedConversations = useMemo(
    () => groupConversationsByDate(filteredConversations),
    [filteredConversations]
  );

  const handleDelete = (conversationId: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteConversation(conversationId),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderRightColor: theme.border }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Chats</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={theme.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={onNewConversation}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newChatButton}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.newChatText}>New Chat</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <SearchBar
          userId={userId}
          onSelectConversation={(convId) => {
            onSelectConversation(convId);
            onClose();
          }}
        />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search size={18} color={theme.textTertiary} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { outline: 'none', color: theme.text } as any]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter by title..."
          placeholderTextColor={theme.textTertiary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={theme.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={styles.conversationList}
        data={filteredConversations.length === 0 ? [] : groupedConversations}
        keyExtractor={(item) => item.group}
        renderItem={({ item }) => (
          <View>
            <View style={styles.dateGroupHeader}>
              <Text style={[styles.dateGroupText, { color: theme.textTertiary }]}>
                {item.group}
              </Text>
            </View>
            {item.conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onPress={() => onSelectConversation(conversation.id)}
                onDelete={() => handleDelete(conversation.id, conversation.title)}
                onRename={() => onRenameConversation(conversation.id, conversation.title)}
                onTogglePin={() => onTogglePin(conversation.id)}
                preview={conversationPreviews?.get(conversation.id)}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet'}
            </Text>
            {!searchQuery && (
              <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                Start a new chat to begin
              </Text>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={11}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  conversationList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  dateGroupHeader: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dateGroupText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});
