import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MessageCircle, Shield, Heart, Briefcase, Users, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettings } from '../utils/settings';

interface SampleQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const sampleQuestions = [
  {
    category: 'Leadership',
    icon: Shield,
    color: '#4A6B8A',
    questions: [
      'How can I lead my family with biblical authority without being domineering?',
      'What does it mean to be the spiritual head of my household?',
      'How do I balance firmness and gentleness as a father?',
    ],
  },
  {
    category: 'Purity',
    icon: Heart,
    color: '#5A7B9A',
    questions: [
      'How do I fight lust and pornography in a hypersexualized culture?',
      'What are practical steps to guard my eyes and mind?',
      'How can I rebuild trust after failing in sexual purity?',
    ],
  },
  {
    category: 'Work',
    icon: Briefcase,
    color: '#6A8BAA',
    questions: [
      'How should a Christian man approach his career and ambition?',
      'What does the Bible say about working hard vs. being workaholic?',
      'How do I find purpose in mundane or difficult work?',
    ],
  },
  {
    category: 'Relationships',
    icon: Users,
    color: '#7A9BBA',
    questions: [
      'How do I build genuine friendships with other men?',
      'What does biblical masculinity look like in dating and marriage?',
      'How should I handle conflict with my wife or family?',
    ],
  },
  {
    category: 'Spiritual Growth',
    icon: BookOpen,
    color: '#8AABCA',
    questions: [
      'How do I develop a consistent prayer and Bible study habit?',
      'What does it mean to deny myself and take up my cross?',
      'How can I grow spiritually when I feel spiritually dry?',
    ],
  },
];

export default function SampleQuestions({ onSelectQuestion }: SampleQuestionsProps) {
  const { theme } = useSettings();
  const isDark = theme.background === '#0F172A';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MessageCircle size={32} color={theme.primary} strokeWidth={2.5} />
        <Text style={[styles.title, { color: theme.text }]}>
          Get Started with These Questions
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Tap any question to begin your conversation, or ask your own
        </Text>
      </View>

      <View style={styles.categories}>
        {sampleQuestions.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <Animated.View
              key={category.category}
              entering={FadeInDown.delay(categoryIndex * 100).duration(400)}
              style={styles.categorySection}
            >
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryIconWrapper,
                    { backgroundColor: isDark ? 'rgba(74, 107, 138, 0.2)' : 'rgba(30, 45, 61, 0.1)' }
                  ]}
                >
                  <IconComponent size={20} color={category.color} strokeWidth={2.5} />
                </View>
                <Text style={[styles.categoryTitle, { color: theme.text }]}>
                  {category.category}
                </Text>
              </View>

              <View style={styles.questionsList}>
                {category.questions.map((question, questionIndex) => (
                  <TouchableOpacity
                    key={questionIndex}
                    style={styles.questionButton}
                    onPress={() => onSelectQuestion(question)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? ['rgba(74, 107, 138, 0.15)', 'rgba(30, 45, 61, 0.25)']
                          : ['rgba(248, 250, 252, 1)', 'rgba(241, 245, 249, 1)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.questionCard,
                        {
                          borderColor: isDark ? 'rgba(74, 107, 138, 0.3)' : 'rgba(226, 232, 240, 1)',
                        }
                      ]}
                    >
                      <Text
                        style={[styles.questionText, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {question}
                      </Text>
                      <View style={styles.questionArrow}>
                        <MessageCircle
                          size={16}
                          color={theme.primary}
                          strokeWidth={2}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
          These are just starting points. Ask anything about faith, relationships, work, or life.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  categories: {
    paddingHorizontal: 20,
    gap: 32,
  },
  categorySection: {
    gap: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  categoryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  questionsList: {
    gap: 10,
  },
  questionButton: {
    width: '100%',
  },
  questionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  questionArrow: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
