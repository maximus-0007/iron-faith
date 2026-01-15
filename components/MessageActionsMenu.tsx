import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform, Share } from 'react-native';
import { Copy, Share2, RotateCcw, Trash2, X, Edit3 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { haptics } from '../utils/haptics';
import { useSettings } from '../utils/settings';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

interface MessageActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
  onRegenerate?: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  isUserMessage: boolean;
}

export default function MessageActionsMenu({
  visible,
  onClose,
  onCopy,
  onShare,
  onRegenerate,
  onDelete,
  onEdit,
  isUserMessage,
}: MessageActionsMenuProps) {
  const { theme } = useSettings();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.8, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleAction = (action: () => void) => {
    haptics.light();
    action();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.menuContainer, animatedStyle]}>
          <LinearGradient
            colors={theme.gradients.surface}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.menu, { borderColor: theme.border }]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Message Actions</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={theme.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.action, { borderBottomColor: theme.border }]}
                onPress={() => handleAction(onCopy)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                  <Copy size={18} color={theme.primary} strokeWidth={2} />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Copy Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.action, { borderBottomColor: theme.border }]}
                onPress={() => handleAction(onShare)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                  <Share2 size={18} color={theme.primary} strokeWidth={2} />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
              </TouchableOpacity>

              {isUserMessage && onEdit && (
                <TouchableOpacity
                  style={[styles.action, { borderBottomColor: theme.border }]}
                  onPress={() => handleAction(onEdit)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                    <Edit3 size={18} color={theme.primary} strokeWidth={2} />
                  </View>
                  <Text style={[styles.actionText, { color: theme.text }]}>Edit Message</Text>
                </TouchableOpacity>
              )}

              {!isUserMessage && onRegenerate && (
                <TouchableOpacity
                  style={[styles.action, { borderBottomColor: theme.border }]}
                  onPress={() => handleAction(onRegenerate)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                    <RotateCcw size={18} color={theme.primary} strokeWidth={2} />
                  </View>
                  <Text style={[styles.actionText, { color: theme.text }]}>Regenerate Response</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.action}
                onPress={() => handleAction(onDelete)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <Trash2 size={18} color="#DC2626" strokeWidth={2} />
                </View>
                <Text style={[styles.actionText, { color: '#DC2626' }]}>Delete Message</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 340,
  },
  menu: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  actions: {
    paddingBottom: 8,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
