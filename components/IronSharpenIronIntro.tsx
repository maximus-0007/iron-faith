import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Shield, Swords, Target, TrendingUp, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSettings } from '../utils/settings';

interface IronSharpenIronIntroProps {
  onContinue: () => void;
}

export default function IronSharpenIronIntro({ onContinue }: IronSharpenIronIntroProps) {
  const { theme } = useSettings();
  const isDark = theme.background === '#0F172A';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.heroSection}>
          <View style={[
            styles.iconWrapper,
            { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.2)' : 'rgba(30, 45, 61, 0.1)' }
          ]}>
            <Swords size={64} color={theme.primary} strokeWidth={2} />
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Iron Sharpens Iron
          </Text>

          <Text style={[styles.verseReference, { color: theme.primary }]}>
            Proverbs 27:17
          </Text>

          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            "As iron sharpens iron, so one man sharpens another."
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.philosophySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            What This Means for You
          </Text>

          <View style={styles.principles}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(74, 107, 138, 0.15)', 'rgba(30, 45, 61, 0.25)']
                  : ['rgba(248, 250, 252, 1)', 'rgba(241, 245, 249, 1)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.principleCard,
                { borderColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(226, 232, 240, 1)' }
              ]}
            >
              <View style={[
                styles.principleIcon,
                { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(30, 45, 61, 0.1)' }
              ]}>
                <Shield size={24} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.principleContent}>
                <Text style={[styles.principleTitle, { color: theme.text }]}>
                  Truth Without Compromise
                </Text>
                <Text style={[styles.principleDescription, { color: theme.textSecondary }]}>
                  No sugar-coating. No excuses. Just biblical truth spoken with clarity and conviction. You need accountability, not enablement.
                </Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={
                isDark
                  ? ['rgba(74, 107, 138, 0.15)', 'rgba(30, 45, 61, 0.25)']
                  : ['rgba(248, 250, 252, 1)', 'rgba(241, 245, 249, 1)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.principleCard,
                { borderColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(226, 232, 240, 1)' }
              ]}
            >
              <View style={[
                styles.principleIcon,
                { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(30, 45, 61, 0.1)' }
              ]}>
                <Target size={24} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.principleContent}>
                <Text style={[styles.principleTitle, { color: theme.text }]}>
                  Challenge That Strengthens
                </Text>
                <Text style={[styles.principleDescription, { color: theme.textSecondary }]}>
                  Growth comes through friction. Expect to be challenged, convicted, and pushed toward godliness. Comfortable men don't become mighty men.
                </Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={
                isDark
                  ? ['rgba(74, 107, 138, 0.15)', 'rgba(30, 45, 61, 0.25)']
                  : ['rgba(248, 250, 252, 1)', 'rgba(241, 245, 249, 1)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.principleCard,
                { borderColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(226, 232, 240, 1)' }
              ]}
            >
              <View style={[
                styles.principleIcon,
                { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(30, 45, 61, 0.1)' }
              ]}>
                <TrendingUp size={24} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.principleContent}>
                <Text style={[styles.principleTitle, { color: theme.text }]}>
                  Practical Application
                </Text>
                <Text style={[styles.principleDescription, { color: theme.textSecondary }]}>
                  Biblical truth must transform daily life. Get specific guidance for leading your family, fighting sin, and walking worthy of your calling.
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.warningSection}>
          <Text style={[styles.warningTitle, { color: theme.text }]}>
            This Is Not For Everyone
          </Text>
          <Text style={[styles.warningText, { color: theme.textSecondary }]}>
            If you're looking for feel-good affirmations or worldly wisdom, this isn't the place. Iron Faith is for men who want the sharp edge of Scripture, even when it cuts deep. Are you ready?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actionSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ['#4A6B8A', '#3A5B7A'] : ['#1E2D3D', '#2E3D4D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>I'm Ready</Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.9,
  },
  verseReference: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  philosophySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.6,
  },
  principles: {
    gap: 16,
  },
  principleCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  principleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principleContent: {
    flex: 1,
  },
  principleTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  principleDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  warningSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 21,
  },
  actionSection: {
    width: '100%',
  },
  continueButton: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 14,
    shadowColor: '#4A6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
