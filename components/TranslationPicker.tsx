import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Plus, Crown, Minus, Check, Lock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Theme } from '../utils/theme';
import { ALL_TRANSLATIONS, Translation, canAccessTranslation } from '../utils/bible';
import { getUserTranslationPreferences, addUserTranslation, removeUserTranslation, UserTranslationPreference } from '../utils/database';

interface TranslationPickerProps {
  userId: string;
  isPremium: boolean;
  isOnTrial?: boolean;
  theme: Theme;
  onOpenPricing?: () => void;
}

export default function TranslationPicker({ userId, isPremium, isOnTrial = false, theme, onOpenPricing }: TranslationPickerProps) {
  const [userPreferences, setUserPreferences] = useState<UserTranslationPreference[]>([]);
  const [availableTranslations, setAvailableTranslations] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId, isPremium, isOnTrial]);

  async function loadPreferences() {
    try {
      setIsLoading(true);
      const prefs = await getUserTranslationPreferences(userId);
      setUserPreferences(prefs);
      setAvailableTranslations(ALL_TRANSLATIONS);
    } catch (error) {
      console.error('Failed to load translation preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleTranslation(translation: Translation, isActive: boolean) {
    if (processingId) return;

    if (!isActive) {
      if (!canAccessTranslation(translation.id, isPremium, isOnTrial)) {
        onOpenPricing?.();
        return;
      }
      if (userPreferences.length >= 5) {
        return;
      }
    } else {
      if (userPreferences.length <= 1) {
        return;
      }
    }

    setProcessingId(translation.id);
    try {
      if (isActive) {
        await removeUserTranslation(userId, translation.id);
      } else {
        await addUserTranslation(userId, translation.id, translation.name, translation.abbreviation);
      }
      await loadPreferences();
    } catch (error) {
      console.error('Failed to toggle translation:', error);
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.buttonPrimary} />
      </View>
    );
  }

  const enabledTranslationIds = new Set(userPreferences.map(p => p.translation_id));
  const isAtLimit = userPreferences.length >= 5;
  const canRemove = userPreferences.length > 1;

  const freeTranslations = availableTranslations.filter(t => !t.isPremium);
  const premiumTranslations = availableTranslations.filter(t => t.isPremium);

  function renderTranslationRow(translation: Translation) {
    const isActive = enabledTranslationIds.has(translation.id);
    const hasAccess = canAccessTranslation(translation.id, isPremium, isOnTrial);
    const isProcessing = processingId === translation.id;
    const canToggle = isActive ? canRemove : (!isAtLimit && hasAccess);

    return (
      <TouchableOpacity
        key={translation.id}
        style={[
          styles.translationRow,
          {
            backgroundColor: isActive ? `${theme.buttonPrimary}15` : theme.surface,
            borderColor: isActive ? theme.buttonPrimary : theme.border,
          }
        ]}
        onPress={() => {
          if (!hasAccess && !isActive) {
            onOpenPricing?.();
          } else if (canToggle) {
            handleToggleTranslation(translation, isActive);
          }
        }}
        activeOpacity={0.7}
        disabled={isProcessing}
      >
        <View style={styles.translationDetails}>
          <View style={styles.translationNameRow}>
            <Text style={[styles.translationName, { color: theme.text }]}>
              {translation.name}
            </Text>
            <View style={[styles.abbrevBadge, {
              backgroundColor: isActive ? theme.buttonPrimary : theme.border
            }]}>
              <Text style={[styles.abbrevText, {
                color: isActive ? '#FFFFFF' : theme.textSecondary
              }]}>
                {translation.abbreviation}
              </Text>
            </View>
          </View>

          {!hasAccess && !isActive && (
            <View style={styles.premiumIndicator}>
              <Crown size={12} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
              <Text style={styles.premiumLabel}>Premium</Text>
            </View>
          )}
        </View>

        <View style={styles.actionArea}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={theme.buttonPrimary} />
          ) : isActive ? (
            <View style={[styles.actionButton, styles.removeAction, {
              opacity: canRemove ? 1 : 0.4
            }]}>
              {canRemove ? (
                <Minus size={16} color="#DC2626" strokeWidth={2.5} />
              ) : (
                <Check size={16} color={theme.buttonPrimary} strokeWidth={2.5} />
              )}
            </View>
          ) : hasAccess ? (
            <View style={[styles.actionButton, styles.addAction, {
              backgroundColor: isAtLimit ? theme.border : theme.buttonPrimary,
              opacity: isAtLimit ? 0.5 : 1
            }]}>
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          ) : (
            <View style={[styles.actionButton, { backgroundColor: theme.border }]}>
              <Lock size={14} color={theme.textSecondary} strokeWidth={2} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { color: theme.textSecondary }]}>
          Tap to add or remove translations
        </Text>
        <View style={[styles.counterPill, {
          backgroundColor: isAtLimit ? '#FEF3C7' : `${theme.buttonPrimary}20`,
          borderColor: isAtLimit ? '#F59E0B' : theme.buttonPrimary
        }]}>
          <Text style={[styles.counterValue, {
            color: isAtLimit ? '#B45309' : theme.buttonPrimary
          }]}>
            {userPreferences.length}/5
          </Text>
        </View>
      </View>

      {isAtLimit && (
        <View style={[styles.limitBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Text style={styles.limitBannerText}>
            Maximum reached. Remove a translation to add another.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.translationsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <Text style={[styles.groupLabel, { color: theme.text }]}>Free Translations</Text>
        {freeTranslations.map(renderTranslationRow)}

        <Text style={[styles.groupLabel, { color: theme.text, marginTop: 20 }]}>
          Premium Translations
          {!isPremium && !isOnTrial && (
            <Text style={[styles.groupSubLabel, { color: theme.textSecondary }]}>
              {' '}(Upgrade to access)
            </Text>
          )}
        </Text>
        {premiumTranslations.map(renderTranslationRow)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  counterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  counterValue: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  limitBanner: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  limitBannerText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500',
    textAlign: 'center',
  },
  translationsList: {
    maxHeight: 350,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  groupSubLabel: {
    fontWeight: '400',
    fontSize: 13,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  translationDetails: {
    flex: 1,
    marginRight: 12,
  },
  translationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  translationName: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    flex: 1,
  },
  abbrevBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  abbrevText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  premiumIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  premiumLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    letterSpacing: -0.1,
  },
  actionArea: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAction: {
    backgroundColor: '#2563EB',
  },
  removeAction: {
    backgroundColor: '#FEE2E2',
  },
});
