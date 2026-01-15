import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSettings } from '../utils/settings';
import { haptics } from '../utils/haptics';

interface MessageEditModalProps {
  visible: boolean;
  initialContent: string;
  onClose: () => void;
  onSave: (newContent: string) => void;
}

export default function MessageEditModal({
  visible,
  initialContent,
  onClose,
  onSave,
}: MessageEditModalProps) {
  const [content, setContent] = useState(initialContent);
  const { theme } = useSettings();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setContent(initialContent);
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.8, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, initialContent]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleSave = () => {
    if (!content.trim()) return;
    haptics.light();
    onSave(content.trim());
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Animated.View style={[styles.modalContainer, animatedStyle]}>
            <Pressable>
              <LinearGradient
                colors={theme.gradients.surface}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.modal, { borderColor: theme.border }]}
              >
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.text }]}>Edit Message</Text>
                  <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={20} color={theme.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.inputText,
                      borderColor: theme.inputBorder,
                      outline: 'none',
                    } as any,
                  ]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Edit your message..."
                  placeholderTextColor={theme.inputPlaceholder}
                  multiline
                  autoFocus
                  maxLength={500}
                  accessible={true}
                  accessibilityLabel="Edit message"
                  accessibilityHint="Modify your message text"
                />

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                    disabled={!content.trim()}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={content.trim() ? theme.gradients.primary : [theme.textTertiary, theme.textTertiary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveButtonGradient}
                    >
                      <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
  },
  modal: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  input: {
    minHeight: 120,
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
