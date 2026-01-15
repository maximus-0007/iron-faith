import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react-native';
import { useNetworkStatus } from '../utils/networkStatus';

interface NetworkStatusBannerProps {
  isSyncing?: boolean;
}

export default function NetworkStatusBanner({ isSyncing = false }: NetworkStatusBannerProps) {
  const { isOnline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      setShowBanner(true);
    } else if (!isOnline) {
      setWasOffline(true);
      setShowBanner(true);
    } else if (wasOffline && !isSyncing) {
      setShowBanner(true);
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    } else if (!isSyncing) {
      setTimeout(() => {
        setShowBanner(false);
      }, 500);
    }
  }, [isOnline, wasOffline, isSyncing]);

  useEffect(() => {
    if (showBanner) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      translateY.value = withTiming(-60, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [showBanner]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!showBanner && isOnline && !isSyncing) {
    return null;
  }

  const getBannerColor = () => {
    if (isSyncing) return '#3B82F6';
    return isOnline ? '#10B981' : '#EF4444';
  };

  const getBannerContent = () => {
    if (isSyncing) {
      return (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.text}>Syncing messages...</Text>
        </>
      );
    }
    if (isOnline) {
      return (
        <>
          <Wifi size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.text}>Back online</Text>
        </>
      );
    }
    return (
      <>
        <WifiOff size={18} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.text}>No internet connection</Text>
      </>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBannerColor(),
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {getBannerContent()}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
