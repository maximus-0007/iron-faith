import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, Menu, Settings, Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSettings } from '../utils/settings';
import { useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface GuidedTourProps {
  onNext: () => void;
  onBack: () => void;
  showBack: boolean;
}

const tourSteps = [
  {
    icon: MessageSquare,
    title: 'Start a Conversation',
    description: 'Type your questions in the chat input at the bottom. Ask about Bible passages, seek guidance, or explore theological topics.',
    color: '#4A6B8A',
  },
  {
    icon: Menu,
    title: 'Manage Conversations',
    description: 'Tap the menu icon to view all your conversations. Switch between topics or start fresh conversations anytime.',
    color: '#5A7B9A',
  },
  {
    icon: Plus,
    title: 'Create New Chats',
    description: 'Start a new conversation from the sidebar. Each conversation maintains its own context and history.',
    color: '#6A8BAA',
  },
  {
    icon: Settings,
    title: 'Customize Your Experience',
    description: 'Access settings to personalize your profile, adjust AI behavior, and customize the app appearance to your preference.',
    color: '#7A9BBA',
  },
];

export default function GuidedTour({ onNext, onBack, showBack }: GuidedTourProps) {
  const { theme } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);

  const iconScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(20);

  useEffect(() => {
    iconScale.value = 0;
    contentOpacity.value = 0;
    contentTranslate.value = 20;

    iconScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    contentOpacity.value = withTiming(1, { duration: 400 });
    contentTranslate.value = withSpring(0, { damping: 15 });
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onNext();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (showBack) {
      onBack();
    }
  };

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));

  const step = tourSteps[currentStep];
  const IconComponent = step.icon;
  const isDark = theme.background === '#0F172A';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrapper, iconAnimatedStyle]}>
          <LinearGradient
            colors={isDark ? [step.color, '#1E2D3D'] : ['#1E2D3D', step.color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <IconComponent size={56} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </Animated.View>

        <View style={styles.stepIndicator}>
          {tourSteps.map((_, index) => (
            <Animated.View
              key={index}
              entering={FadeIn.duration(300)}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentStep ? theme.buttonPrimary : theme.border,
                  width: index === currentStep ? 32 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Animated.View style={contentAnimatedStyle}>
          <Text style={[styles.title, { color: theme.text }]}>
            {step.title}
          </Text>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {step.description}
          </Text>
        </Animated.View>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: theme.buttonSecondary,
                borderWidth: 1,
                borderColor: theme.border,
              },
              (!showBack && currentStep === 0) && styles.navButtonHidden,
            ]}
            onPress={handleBack}
            activeOpacity={0.7}
            disabled={!showBack && currentStep === 0}
          >
            <ChevronLeft size={20} color={theme.buttonSecondaryText} strokeWidth={2.5} />
            <Text style={[styles.navButtonText, { color: theme.buttonSecondaryText }]}>
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ['#4A6B8A', '#3A5B7A'] : ['#1E2D3D', '#2E3D4D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.navButtonGradient}
            >
              <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>
                {currentStep === tourSteps.length - 1 ? 'Continue' : 'Next'}
              </Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 40,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 40,
    alignItems: 'center',
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 56,
    paddingHorizontal: 8,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  navButtonPrimary: {
    padding: 0,
    overflow: 'hidden',
  },
  navButtonGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  navButtonHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  navButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
