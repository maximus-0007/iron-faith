import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, ActivityIndicator } from 'react-native';
import { FileText, FileCode, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { useSettings } from '../utils/settings';
import { haptics } from '../utils/haptics';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (format: 'text' | 'markdown') => Promise<void>;
}

export default function ExportModal({ visible, onClose, onExport }: ExportModalProps) {
  const { theme } = useSettings();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      setIsExporting(false);
      setExportSuccess(false);
    } else {
      scale.value = withTiming(0.8, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleExport = async (format: 'text' | 'markdown') => {
    if (isExporting) return;

    haptics.light();

    setIsExporting(true);

    try {
      await onExport(format);
      setExportSuccess(true);

      haptics.success();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);

      haptics.error();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <LinearGradient
            colors={theme.gradients.surface}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.modal, { borderColor: theme.border }]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Export Conversation</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={theme.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {exportSuccess ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconContainer, { backgroundColor: '#10B981' }]}>
                  <Check size={48} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>Export Complete!</Text>
                <Text style={[styles.successDescription, { color: theme.textSecondary }]}>
                  Your conversation has been saved
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                  Choose a format to export your conversation
                </Text>

                <View style={styles.options}>
                  <TouchableOpacity
                    style={[
                      styles.option,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        opacity: isExporting ? 0.6 : 1
                      }
                    ]}
                    onPress={() => handleExport('text')}
                    activeOpacity={0.7}
                    disabled={isExporting}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                      {isExporting ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <FileText size={24} color={theme.primary} strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: theme.text }]}>Plain Text</Text>
                      <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                        {isExporting ? 'Exporting...' : 'Simple text format, easy to read'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.option,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        opacity: isExporting ? 0.6 : 1
                      }
                    ]}
                    onPress={() => handleExport('markdown')}
                    activeOpacity={0.7}
                    disabled={isExporting}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                      {isExporting ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <FileCode size={24} color={theme.primary} strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: theme.text }]}>Markdown</Text>
                      <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                        {isExporting ? 'Exporting...' : 'Formatted text with styling'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  modalContainer: {
    width: '100%',
    maxWidth: 400,
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
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  successDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});
