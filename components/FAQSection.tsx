import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../utils/settings';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'Is this just another AI chatbot?',
    answer: 'No. Iron Faith is specifically trained on Scripture and biblical masculinity principles. Every response is grounded in God\'s Word, not worldly psychology or feel-good platitudes. We don\'t compromise on truth.',
  },
  {
    question: 'How is my data kept private?',
    answer: 'Your conversations are encrypted and stored securely. We never share your data with third parties. This is between you, God, and the accountability you need. Your privacy is protected.',
  },
  {
    question: 'Can this replace my church or accountability group?',
    answer: 'No, and it shouldn\'t. Iron Faith is a tool to supplement your walk with Christ, not replace fellowship with other believers. You still need local church involvement and real brothers holding you accountable.',
  },
  {
    question: 'What makes this different from just reading my Bible?',
    answer: 'Nothing replaces reading Scripture directly. Iron Faith helps you apply Biblical truth to specific situations you\'re facing. Think of it as a study tool that helps you understand how God\'s Word speaks to your life today.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes. You get 25 free messages to test Iron Faith. No credit card required. If it helps you grow, upgrade. If not, no strings attached.',
  },
  {
    question: 'What if I disagree with a response?',
    answer: 'Good. Test everything against Scripture (1 Thessalonians 5:21). Iron Faith aims to be biblically accurate, but it\'s a tool, not infallible. Always verify with God\'s Word and seek wisdom from mature believers.',
  },
];

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useSettings();
  const isDark = theme.background === '#0F172A';

  const rotation = useSharedValue(0);
  const height = useSharedValue(0);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    rotation.value = withTiming(isExpanded ? 0 : 180, { duration: 300 });
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(74, 107, 138, 0.15)', 'rgba(30, 45, 61, 0.25)']
              : ['rgba(30, 45, 61, 0.06)', 'rgba(74, 107, 138, 0.1)']
          }
          style={[styles.faqHeader, isExpanded && styles.faqHeaderExpanded]}
        >
          <Text style={[styles.question, { color: theme.text }]}>{faq.question}</Text>
          <Animated.View style={rotationStyle}>
            <ChevronDown size={24} color={theme.textSecondary} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.answerContainer, { borderColor: theme.border }]}>
          <Text style={[styles.answer, { color: theme.textSecondary }]}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function FAQSection() {
  const { theme } = useSettings();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Common Questions</Text>
      <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
        Honest answers to real concerns
      </Text>

      <View style={styles.faqList}>
        {faqs.map((faq, index) => (
          <FAQItem key={index} faq={faq} index={index} />
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
    marginBottom: 32,
  },
  faqList: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
    gap: 12,
  },
  faqItem: {
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  faqHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  answer: {
    fontSize: 15,
    lineHeight: 24,
  },
});
