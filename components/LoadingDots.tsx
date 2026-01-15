import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

export default function LoadingDots({ color = '#FFFFFF', size = 6 }: LoadingDotsProps) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withTiming(1, {
        duration: 600,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    dot2.value = withDelay(
      200,
      withRepeat(
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    dot3.value = withDelay(
      400,
      withRepeat(
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ scale: 0.8 + dot1.value * 0.4 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ scale: 0.8 + dot2.value * 0.4 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ scale: 0.8 + dot3.value * 0.4 }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dot1Style, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]} />
      <Animated.View style={[styles.dot, dot2Style, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]} />
      <Animated.View style={[styles.dot, dot3Style, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    backgroundColor: '#FFFFFF',
  },
});
