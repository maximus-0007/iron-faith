import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import { colors } from '../utils/theme';
import { ALL_TRANSLATIONS, FREE_TRANSLATIONS, PREMIUM_TRANSLATIONS } from '../utils/bible';

export default function AboutTranslationsScreen() {
  const router = useRouter();

  const handleOpenUrl = async (url: string | undefined) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const renderTranslation = (translation: typeof ALL_TRANSLATIONS[0]) => (
    <View key={translation.id} style={styles.translationCard}>
      <View style={styles.translationHeader}>
        <View style={styles.translationTitleContainer}>
          <Text style={styles.translationAbbr}>{translation.abbreviation}</Text>
          {translation.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>
        <Text style={styles.translationName}>{translation.name}</Text>
      </View>

      {translation.copyright && (
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightLabel}>Copyright:</Text>
          <Text style={styles.copyrightText}>{translation.copyright}</Text>
        </View>
      )}

      {translation.copyrightUrl && (
        <TouchableOpacity
          style={styles.urlButton}
          onPress={() => handleOpenUrl(translation.copyrightUrl)}
        >
          <Text style={styles.urlButtonText}>Learn More</Text>
          <ExternalLink size={16} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Translations</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            Iron Faith uses Bible translations provided by API.Bible. Each translation
            has its own copyright and licensing terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Translations</Text>
          <Text style={styles.sectionDescription}>
            Available to all users without a subscription
          </Text>
          {FREE_TRANSLATIONS.map(renderTranslation)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Translations</Text>
          <Text style={styles.sectionDescription}>
            Available with a Premium subscription
          </Text>
          {PREMIUM_TRANSLATIONS.map(renderTranslation)}
        </View>

        <View style={styles.attributionSection}>
          <Text style={styles.attributionTitle}>API.Bible</Text>
          <Text style={styles.attributionText}>
            All Bible text is provided through API.Bible, a service of the American
            Bible Society. Scripture quotations marked with translation abbreviations
            are taken from the respective translations listed above.
          </Text>
          <TouchableOpacity
            style={styles.urlButton}
            onPress={() => handleOpenUrl('https://scripture.api.bible/')}
          >
            <Text style={styles.urlButtonText}>Visit API.Bible</Text>
            <ExternalLink size={16} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            When you copy or share verses from Iron Faith, proper copyright
            attributions are automatically included.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  translationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  translationHeader: {
    marginBottom: 12,
  },
  translationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  translationAbbr: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  premiumBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  translationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  copyrightSection: {
    marginBottom: 12,
  },
  copyrightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  urlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  attributionSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  attributionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  attributionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
