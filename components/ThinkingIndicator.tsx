import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Brain, BookOpen, Search, Lightbulb } from 'lucide-react-native';
import { useSettings } from '../utils/settings';
import LoadingDots from './LoadingDots';

const thinkingMessages = [
  { text: 'Thinking', icon: Brain },
  { text: 'Searching scripture', icon: BookOpen },
  { text: 'Finding wisdom', icon: Search },
  { text: 'Reflecting', icon: Lightbulb },
];

export default function ThinkingIndicator() {
  const { theme } = useSettings();
  const [messageIndex, setMessageIndex] = useState(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    containerOpacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });

    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const currentMessage = thinkingMessages[messageIndex];
  const IconComponent = currentMessage.icon;

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.background }, containerStyle]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.glowCircle, { backgroundColor: theme.primary }, glowStyle]} />
          <Animated.View style={pulseStyle}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.surface }]}>
              <Animated.View
                key={messageIndex}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
              >
                <IconComponent size={20} color={theme.primary} strokeWidth={2} />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <Animated.Text
            key={`text-${messageIndex}`}
            entering={FadeIn.duration(300)}
            style={[styles.text, { color: theme.textSecondary }]}
          >
            {currentMessage.text}
          </Animated.Text>
          <LoadingDots color={theme.textTertiary} size={4} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
  },
});
