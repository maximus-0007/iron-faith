import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { MessageSquare, Trash2, Edit3, Pin } from 'lucide-react-native';
import { DBConversation } from '../utils/supabase';
import { useSettings } from '../utils/settings';
import { useReducedMotion, animationConfig } from '../utils/accessibility';

interface ConversationListItemProps {
  conversation: DBConversation & { pinned?: boolean };
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  preview?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ConversationListItem({
  conversation,
  isActive,
  onPress,
  onDelete,
  onRename,
  onTogglePin,
  preview
}: ConversationListItemProps) {
  const { theme } = useSettings();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(1);
  const renameScale = useSharedValue(1);
  const pinScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  const renameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: renameScale.value }],
  }));

  const pinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, animationConfig.quick(reduceMotion));
  };

  const handlePressOut = () => {
    if (reduceMotion) {
      scale.value = withTiming(1, animationConfig.quick(reduceMotion));
    } else {
      scale.value = withSpring(1, animationConfig.spring(reduceMotion));
    }
  };

  const handleDeletePressIn = () => {
    deleteScale.value = withTiming(0.85, animationConfig.quick(reduceMotion));
  };

  const handleDeletePressOut = () => {
    if (reduceMotion) {
      deleteScale.value = withTiming(1, animationConfig.quick(reduceMotion));
    } else {
      deleteScale.value = withSpring(1, animationConfig.spring(reduceMotion));
    }
  };

  const handleRenamePressIn = () => {
    renameScale.value = withTiming(0.85, animationConfig.quick(reduceMotion));
  };

  const handleRenamePressOut = () => {
    if (reduceMotion) {
      renameScale.value = withTiming(1, animationConfig.quick(reduceMotion));
    } else {
      renameScale.value = withSpring(1, animationConfig.spring(reduceMotion));
    }
  };

  const handlePinPressIn = () => {
    pinScale.value = withTiming(0.85, animationConfig.quick(reduceMotion));
  };

  const handlePinPressOut = () => {
    if (reduceMotion) {
      pinScale.value = withTiming(1, animationConfig.quick(reduceMotion));
    } else {
      pinScale.value = withSpring(1, animationConfig.spring(reduceMotion));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <AnimatedPressable
        style={[
          styles.itemButton,
          isActive && { backgroundColor: theme.activeItem },
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Conversation: ${conversation.title}`}
        accessibilityHint={`Last updated ${formatDate(conversation.updated_at)}`}
        accessibilityState={{ selected: isActive }}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: isActive ? theme.primary + '20' : theme.surfaceSecondary }
        ]}>
          <MessageSquare
            size={16}
            color={isActive ? theme.activeItemText : theme.textSecondary}
            strokeWidth={2}
          />
        </View>
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.text },
              isActive && { color: theme.activeItemText, fontWeight: '700' }
            ]}
            numberOfLines={1}
          >
            {conversation.title}
          </Text>
          {preview ? (
            <Text style={[styles.preview, { color: theme.textTertiary }]} numberOfLines={1}>
              {preview}
            </Text>
          ) : null}
          <Text style={[styles.timestamp, { color: theme.textTertiary }]}>
            {formatDate(conversation.updated_at)}
          </Text>
        </View>
      </AnimatedPressable>
      <View style={styles.actions}>
        <AnimatedPressable
          style={[styles.actionButton, pinAnimatedStyle]}
          onPress={onTogglePin}
          onPressIn={handlePinPressIn}
          onPressOut={handlePinPressOut}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
          accessibilityHint={conversation.pinned ? 'Remove from pinned conversations' : 'Keep conversation at the top'}
        >
          <Pin
            size={14}
            color={conversation.pinned ? theme.primary : theme.textSecondary}
            strokeWidth={2}
            fill={conversation.pinned ? theme.primary : 'none'}
          />
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.actionButton, renameAnimatedStyle]}
          onPress={onRename}
          onPressIn={handleRenamePressIn}
          onPressOut={handleRenamePressOut}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Rename conversation"
          accessibilityHint={`Change title from ${conversation.title}`}
        >
          <Edit3 size={14} color={theme.textSecondary} strokeWidth={2} />
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.actionButton, deleteAnimatedStyle]}
          onPress={onDelete}
          onPressIn={handleDeletePressIn}
          onPressOut={handleDeletePressOut}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Delete conversation"
          accessibilityHint={`Delete ${conversation.title} permanently`}
        >
          <Trash2 size={14} color="#EF4444" strokeWidth={2} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

export default memo(ConversationListItem, (prevProps, nextProps) => {
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.title === nextProps.conversation.title &&
    prevProps.conversation.updated_at === nextProps.conversation.updated_at &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.preview === nextProps.preview
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  preview: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
});
