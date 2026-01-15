import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { X, Sun, Moon, User, FileText, LogOut, Shield, Scale, Mail, Book, Info, Crown, Zap, Trash2, ExternalLink, RefreshCcw, Download, Edit2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useSettings, ResponseLength, responseLengthDescriptions, Settings } from '../utils/settings';
import { useAuth } from '../utils/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { getSubscriptionStatus, SubscriptionInfo, openManageSubscriptions, restorePurchases } from '../utils/revenueCat';
import TranslationPicker from './TranslationPicker';
import DeleteAccountModal from './DeleteAccountModal';
import UserDataExportModal from './UserDataExportModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  onOpenPaywall?: () => void;
}

export default function SettingsModal({ visible, onClose, userId, onOpenPaywall }: SettingsModalProps) {
  const { settings, theme, updateSettings, toggleColorScheme } = useSettings();
  const { signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const [tempSettings, setTempSettings] = useState<Settings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempSettings(settings);
      setHasChanges(false);
      loadUserInfo();
      loadSubscriptionStatus();
    }
  }, [visible, settings]);

  async function loadSubscriptionStatus() {
    try {
      const subStatus = await getSubscriptionStatus();
      setSubscription(subStatus);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    }
  }

  async function loadUserInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setNewEmail(user.email);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  }

  function handleTempUpdate(newSettings: Partial<Settings>) {
    setTempSettings(prev => ({ ...prev, ...newSettings }));
    setHasChanges(true);
  }

  async function handleSave() {
    if (!hasChanges) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings(tempSettings, userId);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setTempSettings(settings);
    setHasChanges(false);
    onClose();
  }

  async function handleUpdateEmail() {
    if (!newEmail || newEmail === userEmail) {
      setIsEditingEmail(false);
      return;
    }

    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      Alert.alert(
        'Verification Email Sent',
        `A verification link has been sent to ${newEmail}. Please check your email to confirm the change.`,
        [{ text: 'OK', onPress: () => setIsEditingEmail(false) }]
      );
    } catch (error: any) {
      console.error('Failed to update email:', error);
      Alert.alert('Error', error.message || 'Failed to update email. Please try again.');
    } finally {
      setIsUpdatingEmail(false);
    }
  }

  async function handleDeleteAccount() {
    const result = await deleteAccount();

    if (result.error) {
      return result;
    }

    setShowDeleteModal(false);
    onClose();
    return {};
  }

  async function handleManageSubscription() {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Subscription management is only available on mobile devices.');
        return;
      }
      await openManageSubscriptions();
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      Alert.alert('Error', 'Failed to open subscription management. Please try again.');
    }
  }

  async function handleRestorePurchases() {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Restore purchases is only available on mobile devices.');
        return;
      }

      const success = await restorePurchases();

      if (success) {
        await loadSubscriptionStatus();
        Alert.alert('Success', 'Your purchase has been restored successfully!');
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  }

  function renderOption<T extends string>(
    label: string,
    options: readonly T[],
    currentValue: T,
    onSelect: (value: T) => void,
    descriptions: Record<T, string>
  ) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>{label}</Text>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              {
                backgroundColor: currentValue === option ? theme.activeItem : theme.surface,
                borderColor: theme.border,
              }
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                { color: currentValue === option ? theme.activeItemText : theme.text }
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
              <Text style={[
                styles.optionDescription,
                { color: currentValue === option ? theme.activeItemText : theme.textSecondary }
              ]}>
                {descriptions[option]}
              </Text>
            </View>
            {currentValue === option && (
              <View style={[styles.selectedIndicator, { backgroundColor: theme.buttonPrimary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <X size={24} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.section, styles.profileSection]}>
              <View style={styles.profileSectionHeader}>
                <User size={20} color={theme.text} strokeWidth={2} />
                <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0, marginLeft: 8 }]}>
                  Account Information
                </Text>
              </View>
              <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                Your account details and personal preferences
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelRow}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
                  {!isEditingEmail && (
                    <TouchableOpacity
                      onPress={() => setIsEditingEmail(true)}
                      style={styles.editButton}
                    >
                      <Edit2 size={14} color={theme.primary} strokeWidth={2.5} />
                      <Text style={[styles.editButtonText, { color: theme.primary }]}>
                        Change
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {isEditingEmail ? (
                  <View style={styles.emailEditContainer}>
                    <TextInput
                      style={[styles.textInput, {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        flex: 1
                      }]}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      placeholder="Enter new email"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.emailButtonsRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setNewEmail(userEmail);
                          setIsEditingEmail(false);
                        }}
                        style={[styles.emailButton, styles.emailCancelButton]}
                      >
                        <Text style={[styles.emailButtonText, { color: theme.textSecondary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleUpdateEmail}
                        disabled={isUpdatingEmail}
                        style={[styles.emailButton, { backgroundColor: theme.primary }]}
                      >
                        {isUpdatingEmail ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.emailButtonText}>Update</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.readOnlyField, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }]}>
                    <Mail size={16} color={theme.textSecondary} strokeWidth={2} />
                    <Text style={[styles.readOnlyText, { color: theme.text }]}>
                      {userEmail || 'Loading...'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Display Name</Text>
                <TextInput
                  style={[styles.textInput, {
                    color: theme.text,
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }]}
                  value={tempSettings.name}
                  onChangeText={(text) => handleTempUpdate({ name: text })}
                  placeholder="Your name (optional)"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelRow}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>About You</Text>
                  <Text style={[styles.characterCount, { color: theme.textSecondary }]}>
                    {tempSettings.about.length}/200
                  </Text>
                </View>
                <TextInput
                  style={[styles.textAreaInput, {
                    color: theme.text,
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }]}
                  value={tempSettings.about}
                  onChangeText={(text) => handleTempUpdate({ about: text.slice(0, 200) })}
                  placeholder="Share your struggles, goals, and what you're working on so I can hold you accountable (optional)"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={[styles.section, styles.themeSection]}>
              <View style={styles.themeSectionHeader}>
                <View style={styles.themeLabelContainer}>
                  {tempSettings.colorScheme === 'light' ? (
                    <Sun size={20} color={theme.text} strokeWidth={2} />
                  ) : (
                    <Moon size={20} color={theme.text} strokeWidth={2} />
                  )}
                  <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0 }]}>
                    Appearance
                  </Text>
                </View>
                <Switch
                  value={tempSettings.colorScheme === 'dark'}
                  onValueChange={async () => {
                    const newScheme = tempSettings.colorScheme === 'light' ? 'dark' : 'light';
                    handleTempUpdate({ colorScheme: newScheme });
                    await toggleColorScheme();
                  }}
                  trackColor={{ false: theme.border, true: theme.buttonPrimary }}
                  thumbColor={theme.surface}
                />
              </View>
              <Text style={[styles.themeDescription, { color: theme.textSecondary }]}>
                {tempSettings.colorScheme === 'light' ? 'Light mode active' : 'Dark mode active'}
              </Text>
            </View>

            {renderOption(
              'Response Length',
              ['concise', 'balanced', 'detailed'] as const,
              tempSettings.responseLength,
              (value: ResponseLength) => handleTempUpdate({ responseLength: value }),
              responseLengthDescriptions
            )}

            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0 }]}>
                    Scripture References
                  </Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                    Include biblical citations in responses
                  </Text>
                </View>
                <Switch
                  value={tempSettings.includeScriptureReferences}
                  onValueChange={(value) => handleTempUpdate({ includeScriptureReferences: value })}
                  trackColor={{ false: theme.border, true: theme.buttonPrimary }}
                  thumbColor={theme.surface}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0 }]}>
                    Clarifying Questions
                  </Text>
                  <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                    Allow AI to ask follow-up questions for better guidance
                  </Text>
                </View>
                <Switch
                  value={tempSettings.askClarifyingQuestions}
                  onValueChange={(value) => handleTempUpdate({ askClarifyingQuestions: value })}
                  trackColor={{ false: theme.border, true: theme.buttonPrimary }}
                  thumbColor={theme.surface}
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.section}>
              <View style={styles.translationHeader}>
                <Book size={20} color={theme.text} strokeWidth={2} />
                <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0, marginLeft: 8 }]}>
                  Bible Translations
                </Text>
              </View>
              <Text style={[styles.sectionDescription, { color: theme.textSecondary, marginBottom: 16 }]}>
                Manage your preferred Bible translations
              </Text>

              {userId && (
                <TranslationPicker
                  userId={userId}
                  isPremium={subscription?.isPremium || false}
                  isOnTrial={subscription?.isOnTrial || false}
                  theme={theme}
                  onOpenPricing={() => {
                    onClose();
                    onOpenPaywall?.();
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.legalButton, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 16 }]}
                onPress={() => {
                  onClose();
                  router.push('/about-translations');
                }}
                activeOpacity={0.7}
              >
                <Info size={20} color={theme.text} strokeWidth={2} />
                <Text style={[styles.legalButtonText, { color: theme.text }]}>About Translations</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>Subscription</Text>

              {subscription?.isActive ? (
                <View>
                  <View style={[styles.subscriptionCard, {
                    backgroundColor: theme.buttonPrimary,
                    borderColor: theme.buttonPrimary
                  }]}>
                    <Crown size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                    <View style={styles.subscriptionInfo}>
                      <Text style={styles.subscriptionTitle}>Premium Member</Text>
                      <Text style={styles.subscriptionPrice}>
                        Unlimited conversations
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.manageButton, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 12 }]}
                    onPress={handleManageSubscription}
                    activeOpacity={0.7}
                  >
                    <ExternalLink size={20} color={theme.text} strokeWidth={2} />
                    <Text style={[styles.manageButtonText, { color: theme.text }]}>Manage Subscription</Text>
                  </TouchableOpacity>
                </View>
              ) : subscription?.isOnTrial ? (
                <View style={styles.trialContainer}>
                  <View style={[styles.subscriptionCard, {
                    backgroundColor: '#10B981',
                    borderColor: '#10B981'
                  }]}>
                    <Zap size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                    <View style={styles.subscriptionInfo}>
                      <Text style={styles.subscriptionTitle}>Free Trial Active</Text>
                      <Text style={styles.subscriptionPrice}>
                        {subscription?.trialEndDate
                          ? `${Math.ceil((subscription.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                          : 'Trial active'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: theme.buttonPrimary, marginTop: 12 }]}
                    onPress={() => {
                      onClose();
                      onOpenPaywall?.();
                    }}
                    activeOpacity={0.7}
                  >
                    <Crown size={20} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                    <Text style={styles.upgradeButtonText}>Subscribe to Premium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.restoreButton, { marginTop: 12 }]}
                    onPress={handleRestorePurchases}
                    activeOpacity={0.7}
                  >
                    <RefreshCcw size={18} color={theme.buttonPrimary} strokeWidth={2} />
                    <Text style={[styles.restoreButtonText, { color: theme.buttonPrimary }]}>Restore Purchases</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.freeUserContainer}>
                  <View style={[styles.freeTierCard, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }]}>
                    <Text style={[styles.freeTierText, { color: theme.text }]}>
                      Free Plan - 2 messages per day
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: theme.buttonPrimary, marginTop: 12 }]}
                    onPress={() => {
                      onClose();
                      onOpenPaywall?.();
                    }}
                    activeOpacity={0.7}
                  >
                    <Zap size={20} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
                    <Text style={styles.upgradeButtonText}>Subscribe to Premium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.restoreButton, { marginTop: 12 }]}
                    onPress={handleRestorePurchases}
                    activeOpacity={0.7}
                  >
                    <RefreshCcw size={18} color={theme.buttonPrimary} strokeWidth={2} />
                    <Text style={[styles.restoreButtonText, { color: theme.buttonPrimary }]}>Restore Purchases</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>Legal</Text>

              <TouchableOpacity
                style={[styles.legalButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  onClose();
                  router.push('/privacy-policy');
                }}
                activeOpacity={0.7}
              >
                <Shield size={20} color={theme.text} strokeWidth={2} />
                <Text style={[styles.legalButtonText, { color: theme.text }]}>Privacy Policy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.legalButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  onClose();
                  router.push('/terms-of-service');
                }}
                activeOpacity={0.7}
              >
                <Scale size={20} color={theme.text} strokeWidth={2} />
                <Text style={[styles.legalButtonText, { color: theme.text }]}>Terms of Service</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.signOutButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={async () => {
                  await signOut();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <LogOut size={20} color="#DC2626" strokeWidth={2} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowExportModal(true)}
                activeOpacity={0.7}
              >
                <Download size={20} color={theme.primary} strokeWidth={2} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Export My Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteAccountButton, { backgroundColor: theme.surface, borderColor: '#DC2626' }]}
                onPress={() => setShowDeleteModal(true)}
                activeOpacity={0.7}
              >
                <Trash2 size={20} color="#DC2626" strokeWidth={2} />
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          <DeleteAccountModal
            visible={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteAccount}
            theme={theme}
            userEmail={userEmail}
          />

          {userId && (
            <UserDataExportModal
              visible={showExportModal}
              userId={userId}
              onClose={() => setShowExportModal(false)}
            />
          )}

          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton, { borderColor: theme.border }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.saveButton,
                { backgroundColor: hasChanges ? theme.buttonPrimary : theme.border }
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                  {hasChanges ? 'Save Changes' : 'Close'}
                </Text>
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
    maxHeight: '90%',
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
  section: {
    marginTop: 24,
  },
  profileSection: {
    marginTop: 20,
  },
  profileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textAreaInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  readOnlyText: {
    fontSize: 15,
    flex: 1,
  },
  divider: {
    height: 1,
    marginTop: 24,
  },
  themeSection: {
    marginTop: 20,
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeDescription: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 30,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  saveButton: {
    minHeight: 48,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
    marginBottom: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    letterSpacing: -0.3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emailEditContainer: {
    gap: 12,
  },
  emailButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  emailButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  emailCancelButton: {
    backgroundColor: 'transparent',
  },
  emailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    letterSpacing: -0.3,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 10,
  },
  legalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 14,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: -0.2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  trialContainer: {
    width: '100%',
  },
  freeUserContainer: {
    width: '100%',
  },
  freeTierCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  freeTierText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
