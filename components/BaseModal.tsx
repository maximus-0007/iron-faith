import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { ReactNode } from 'react';
import { useSettings } from '../utils/settings';

export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}

export default function BaseModal({
  visible,
  onClose,
  title,
  children,
  footer,
  maxHeight = '90%',
  showCloseButton = true,
  animationType = 'slide',
  scrollable = true,
  contentStyle,
}: BaseModalProps) {
  const { theme } = useSettings();

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[
          styles.container,
          { backgroundColor: theme.background, maxHeight: maxHeight as any }
        ]}>
          <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={24} color={theme.text} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {scrollable ? (
            <ScrollView
              style={[styles.content, contentStyle]}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, contentStyle]}>
              {children}
            </View>
          )}

          {footer && (
            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              {footer}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
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
  content: {
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});
