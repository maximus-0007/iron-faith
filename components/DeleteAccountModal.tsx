import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import { Theme } from '../utils/theme';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ error?: string }>;
  theme: Theme;
  userEmail: string;
}

export default function DeleteAccountModal({
  visible,
  onClose,
  onConfirm,
  theme,
  userEmail,
}: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const isConfirmValid = confirmText.toLowerCase() === 'delete';

  async function handleDelete() {
    if (!isConfirmValid) {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError('');

    const result = await onConfirm();

    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
    }
  }

  function handleClose() {
    if (!isDeleting) {
      setConfirmText('');
      setError('');
      onClose();
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.warningIconContainer}>
              <AlertTriangle size={24} color="#DC2626" strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Delete Account</Text>
            {!isDeleting && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <X size={24} color={theme.text} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.content}>
            <Text style={[styles.warning, { color: '#DC2626' }]}>
              Warning: This action cannot be undone
            </Text>

            <Text style={[styles.description, { color: theme.text }]}>
              Deleting your account will permanently remove:
            </Text>

            <View style={[styles.listContainer, { backgroundColor: theme.surface }]}>
              <Text style={[styles.listItem, { color: theme.text }]}>• All your conversations and messages</Text>
              <Text style={[styles.listItem, { color: theme.text }]}>• Your saved bookmarks and folders</Text>
              <Text style={[styles.listItem, { color: theme.text }]}>• Your profile and preferences</Text>
              <Text style={[styles.listItem, { color: theme.text }]}>• Your subscription (if active)</Text>
              <Text style={[styles.listItem, { color: theme.text }]}>• All other personal data</Text>
            </View>

            <Text style={[styles.emailLabel, { color: theme.textSecondary }]}>
              Account to be deleted:
            </Text>
            <View style={[styles.emailContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.emailText, { color: theme.text }]}>{userEmail}</Text>
            </View>

            <Text style={[styles.confirmLabel, { color: theme.text }]}>
              Type <Text style={styles.deleteText}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: error ? '#DC2626' : theme.border,
                },
              ]}
              value={confirmText}
              onChangeText={(text) => {
                setConfirmText(text);
                setError('');
              }}
              placeholder="Type DELETE"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              editable={!isDeleting}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: theme.border },
                isDeleting && styles.buttonDisabled,
              ]}
              onPress={handleClose}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                !isConfirmValid && styles.buttonDisabled,
              ]}
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={!isConfirmValid || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Forever</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  warningIconContainer: {
    width: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
    width: 32,
  },
  content: {
    padding: 20,
  },
  warning: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  listContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
  emailLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  emailContainer: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '500',
  },
  confirmLabel: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
  },
  deleteText: {
    fontWeight: '700',
    color: '#DC2626',
  },
  confirmInput: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 8,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 2,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
