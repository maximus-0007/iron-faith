import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView } from 'react-native';
import { Shield, MessageCircle, Sparkles, Book } from 'lucide-react-native';
import { useSettings } from '../utils/settings';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import TestimonialsSection from './TestimonialsSection';
import HowItWorksSection from './HowItWorksSection';
import FAQSection from './FAQSection';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { theme } = useSettings();

  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslate = useSharedValue(20);
  const feature1Opacity = useSharedValue(0);
  const feature1Translate = useSharedValue(30);
  const feature2Opacity = useSharedValue(0);
  const feature2Translate = useSharedValue(30);
  const feature3Opacity = useSharedValue(0);
  const feature3Translate = useSharedValue(30);
  const sparkleRotate = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    iconRotate.value = withSequence(
      withTiming(5, { duration: 300 }),
      withTiming(-5, { duration: 300 }),
      withTiming(0, { duration: 300 })
    );

    titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    titleTranslate.value = withDelay(200, withSpring(0, { damping: 15 }));

    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    subtitleTranslate.value = withDelay(400, withSpring(0, { damping: 15 }));

    feature1Opacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    feature1Translate.value = withDelay(600, withSpring(0, { damping: 15 }));

    feature2Opacity.value = withDelay(750, withTiming(1, { duration: 500 }));
    feature2Translate.value = withDelay(750, withSpring(0, { damping: 15 }));

    feature3Opacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    feature3Translate.value = withDelay(900, withSpring(0, { damping: 15 }));

    sparkleRotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslate.value }],
  }));

  const feature1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature1Opacity.value,
    transform: [{ translateX: feature1Translate.value }],
  }));

  const feature2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature2Opacity.value,
    transform: [{ translateX: feature2Translate.value }],
  }));

  const feature3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature3Opacity.value,
    transform: [{ translateX: feature3Translate.value }],
  }));

  const isDark = theme.background === '#0F172A';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
            <Sparkles
              size={80}
              color={isDark ? 'rgba(74, 107, 138, 0.2)' : 'rgba(30, 45, 61, 0.15)'}
              strokeWidth={1.5}
            />
          </Animated.View>
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <Image
              source={require('../assets/images/your_paragraph_text_(10).png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.title, { color: theme.text }, titleAnimatedStyle]}>
          Welcome to Iron Faith
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { color: theme.textSecondary }, subtitleAnimatedStyle]}>
          Iron sharpens iron. Your AI accountability partner for biblical masculinity and spiritual discipline.
        </Animated.Text>

        <View style={styles.features}>
          <Animated.View style={[styles.feature, feature1AnimatedStyle]}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(74, 107, 138, 0.2)', 'rgba(30, 45, 61, 0.3)']
                  : ['rgba(30, 45, 61, 0.08)', 'rgba(74, 107, 138, 0.12)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featureCard}
            >
              <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(30, 45, 61, 0.1)' }]}>
                <Book size={28} color={theme.buttonPrimary} strokeWidth={2.5} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  Truth Without Apology
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  Direct, Scripture-grounded answers that don't sugarcoat the truth
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.feature, feature2AnimatedStyle]}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(74, 107, 138, 0.2)', 'rgba(30, 45, 61, 0.3)']
                  : ['rgba(30, 45, 61, 0.08)', 'rgba(74, 107, 138, 0.12)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featureCard}
            >
              <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(30, 45, 61, 0.1)' }]}>
                <Shield size={28} color={theme.buttonPrimary} strokeWidth={2.5} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  Iron Sharpens Iron
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  Accountability and challenge to become the man God called you to be
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.feature, feature3AnimatedStyle]}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(74, 107, 138, 0.2)', 'rgba(30, 45, 61, 0.3)']
                  : ['rgba(30, 45, 61, 0.08)', 'rgba(74, 107, 138, 0.12)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featureCard}
            >
              <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(30, 45, 61, 0.1)' }]}>
                <MessageCircle size={28} color={theme.buttonPrimary} strokeWidth={2.5} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  No-Nonsense Guidance
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  Practical wisdom for leading your family, fighting sin, and walking with God
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />

      <View style={styles.ctaSection}>
        <Text style={[styles.ctaTitle, { color: theme.text }]}>
          Ready to Grow?
        </Text>
        <Text style={[styles.ctaSubtitle, { color: theme.textSecondary }]}>
          Join men who are done making excuses and ready for biblical accountability
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
    alignSelf: 'center',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    height: 160,
    width: 160,
  },
  sparkleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
  },
  iconContainer: {
    zIndex: 2,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
    paddingHorizontal: 8,
  },
  features: {
    width: '100%',
    gap: 20,
  },
  feature: {
    width: '100%',
  },
  featureCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  ctaSection: {
    paddingHorizontal: 32,
    paddingVertical: 64,
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.8,
  },
  ctaSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
  },
});
