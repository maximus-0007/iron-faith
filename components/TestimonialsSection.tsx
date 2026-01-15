import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { useSettings } from '../utils/settings';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Marcus D.',
    role: 'Husband & Father',
    quote: 'Finally, someone who doesn\'t dance around the truth. This app has helped me take ownership of my failures and step up as the spiritual leader my family needs.',
    rating: 5,
  },
  {
    name: 'James T.',
    role: 'Small Business Owner',
    quote: 'I was tired of soft, feelings-based advice. Iron Faith gives me Scripture-backed answers that actually challenge me to grow. It\'s like having a mentor in my pocket.',
    rating: 5,
  },
  {
    name: 'David K.',
    role: 'College Student',
    quote: 'The accountability I needed but didn\'t want. This app doesn\'t let me make excuses for my sin. It points me back to Christ and His Word every single time.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const { theme } = useSettings();
  const isDark = theme.background === '#0F172A';

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Tested by Brothers</Text>
      <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
        Real men, real transformation
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {testimonials.map((testimonial, index) => (
          <View key={index} style={styles.testimonialWrapper}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(74, 107, 138, 0.2)', 'rgba(30, 45, 61, 0.3)']
                  : ['rgba(30, 45, 61, 0.08)', 'rgba(74, 107, 138, 0.12)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.testimonialCard}
            >
              <View style={styles.rating}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} size={16} color="#FFB800" fill="#FFB800" strokeWidth={0} />
                ))}
              </View>

              <Text style={[styles.quote, { color: theme.text }]}>"{testimonial.quote}"</Text>

              <View style={styles.author}>
                <View style={[styles.avatar, { backgroundColor: theme.buttonPrimary }]}>
                  <Text style={styles.avatarText}>{testimonial.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={[styles.authorName, { color: theme.text }]}>{testimonial.name}</Text>
                  <Text style={[styles.authorRole, { color: theme.textSecondary }]}>{testimonial.role}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.6,
    paddingHorizontal: 32,
  },
  sectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  scrollView: {
    marginHorizontal: -32,
  },
  scrollContent: {
    paddingHorizontal: 32,
    gap: 16,
  },
  testimonialWrapper: {
    width: 320,
  },
  testimonialCard: {
    padding: 24,
    borderRadius: 16,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  rating: {
    flexDirection: 'row',
    gap: 4,
  },
  quote: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  authorRole: {
    fontSize: 13,
  },
});
