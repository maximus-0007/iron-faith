import { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSettings } from '../utils/settings';
import { haptics } from '../utils/haptics';

interface RenameConversationModalProps {
  visible: boolean;
  initialTitle: string;
  onClose: () => void;
  onSave: (newTitle: string) => void;
}

export default function RenameConversationModal({
  visible,
  initialTitle,
  onClose,
  onSave,
}: RenameConversationModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const { theme } = useSettings();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      scale.value = withTiming(0.8, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, initialTitle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleSave = () => {
    if (!title.trim()) return;
    haptics.light();
    onSave(title.trim());
    onClose();
  };

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centered}
        >
          <Animated.View style={[styles.modalContainer, animatedStyle]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <LinearGradient
                colors={theme.gradients.surface}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.modal}
              >
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Rename Conversation
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    accessible={true}
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                  >
                    <X size={20} color={theme.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <View style={styles.content}>
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        color: theme.inputText,
                        borderColor: theme.border,
                      },
                    ]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter conversation title"
                    placeholderTextColor={theme.inputPlaceholder}
                    maxLength={100}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    selectTextOnFocus
                    accessible={true}
                    accessibilityLabel="Conversation title input"
                  />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={[styles.button, styles.cancelButton]}
                    accessible={true}
                    accessibilityLabel="Cancel"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.buttonText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={!title.trim()}
                    accessible={true}
                    accessibilityLabel="Save"
                    accessibilityRole="button"
                  >
                    <LinearGradient
                      colors={title.trim() ? theme.gradients.primary : [theme.textTertiary, theme.textTertiary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.button}
                    >
                      <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  input: {
    fontSize: 15,
    fontWeight: '400',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
