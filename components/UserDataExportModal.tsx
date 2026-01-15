import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Share, Platform, Pressable } from 'react-native';
import { X, Download, FileText, CheckCircle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSettings } from '../utils/settings';
import { downloadUserDataAsJSON } from '../utils/userDataExport';
import { haptics } from '../utils/haptics';

interface UserDataExportModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

export default function UserDataExportModal({
  visible,
  userId,
  onClose,
}: UserDataExportModalProps) {
  const { theme } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useState(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      setExportComplete(false);
    } else {
      scale.value = withTiming(0.8, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      haptics.light();

      const jsonData = await downloadUserDataAsJSON(userId);
      const fileName = `iron-faith-data-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonData, {
          encoding: 'utf8' as any,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Your Data',
          });
        } else {
          Alert.alert(
            'Export Complete',
            `Your data has been saved to:\n${fileUri}`
          );
        }
      }

      setExportComplete(true);
      haptics.success();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert(
        'Export Failed',
        'Failed to export your data. Please try again.'
      );
      haptics.error();
    } finally {
      setIsExporting(false);
    }
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
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={theme.gradients.surface}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.modal}
            >
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <FileText size={24} color={theme.primary} strokeWidth={2.5} />
                  <Text style={[styles.title, { color: theme.text }]}>
                    Export Your Data
                  </Text>
                </View>
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

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                  Download a complete copy of your data including:
                </Text>

                <View style={styles.dataList}>
                  <DataItem text="Profile information" theme={theme} />
                  <DataItem text="All conversations and messages" theme={theme} />
                  <DataItem text="Bookmarks and notes" theme={theme} />
                  <DataItem text="Translation preferences" theme={theme} />
                  <DataItem text="Subscription status" theme={theme} />
                  <DataItem text="Usage statistics" theme={theme} />
                </View>

                <View style={[styles.infoBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    Your data will be exported as a JSON file that you can save, backup, or transfer.
                    This complies with GDPR data portability requirements.
                  </Text>
                </View>

                {exportComplete && (
                  <View style={styles.successContainer}>
                    <CheckCircle size={48} color="#10B981" strokeWidth={2} />
                    <Text style={[styles.successText, { color: theme.text }]}>
                      Export Complete!
                    </Text>
                  </View>
                )}
              </ScrollView>

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
                  onPress={handleExport}
                  disabled={isExporting || exportComplete}
                  accessible={true}
                  accessibilityLabel="Export data"
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={isExporting || exportComplete ? [theme.textTertiary, theme.textTertiary] : theme.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                  >
                    {isExporting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Download size={18} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.exportButtonText}>
                          {exportComplete ? 'Exported' : 'Export Data'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function DataItem({ text, theme }: { text: string; theme: any }) {
  return (
    <View style={styles.dataItem}>
      <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
      <Text style={[styles.dataItemText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 480,
    maxHeight: '80%',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    maxHeight: 400,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 16,
  },
  dataList: {
    gap: 10,
    marginBottom: 20,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dataItemText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
