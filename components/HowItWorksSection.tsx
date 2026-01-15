import { View, Text, StyleSheet } from 'react-native';
import { MessageSquare, Zap, BookMarked, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../utils/settings';

interface Step {
  number: number;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: MessageSquare,
    title: 'Ask Anything',
    description: 'Bring your toughest questions about faith, sin, relationships, and leadership',
  },
  {
    number: 2,
    icon: Zap,
    title: 'Get Biblical Truth',
    description: 'Receive direct, Scripture-grounded answers that challenge you to grow',
  },
  {
    number: 3,
    icon: BookMarked,
    title: 'Build Your Arsenal',
    description: 'Bookmark insights and verses to revisit when temptation or doubt strikes',
  },
  {
    number: 4,
    icon: TrendingUp,
    title: 'Walk in Obedience',
    description: 'Apply what you learn and become the man God called you to be',
  },
];

export default function HowItWorksSection() {
  const { theme } = useSettings();
  const isDark = theme.background === '#0F172A';

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>How It Works</Text>
      <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
        Simple, direct, transformational
      </Text>

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.number} style={styles.stepWrapper}>
            <View style={styles.stepContent}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(74, 107, 138, 0.3)', 'rgba(30, 45, 61, 0.4)']
                    : ['rgba(30, 45, 61, 0.1)', 'rgba(74, 107, 138, 0.15)']
                }
                style={styles.iconContainer}
              >
                <View style={[styles.numberBadge, { backgroundColor: theme.buttonPrimary }]}>
                  <Text style={styles.numberText}>{step.number}</Text>
                </View>
                <step.icon size={32} color={theme.buttonPrimary} strokeWidth={2} />
              </LinearGradient>

              <View style={styles.textContent}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                  {step.description}
                </Text>
              </View>
            </View>

            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(30, 45, 61, 0.2)' },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  sectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  stepsContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  stepWrapper: {
    marginBottom: 8,
  },
  stepContent: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  numberBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  textContent: {
    flex: 1,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  connector: {
    width: 3,
    height: 32,
    marginLeft: 38.5,
    marginVertical: 4,
  },
});
