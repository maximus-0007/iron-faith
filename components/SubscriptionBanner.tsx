import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, Clock, X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionInfo } from '../utils/revenueCat';

interface SubscriptionBannerProps {
  subscription: SubscriptionInfo | null;
  onUpgrade: () => void;
  theme: any;
}

const DISMISSED_BANNER_KEY = 'trial_banner_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function SubscriptionBanner({ subscription, onUpgrade, theme }: SubscriptionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    loadDismissedState();
  }, []);

  async function loadDismissedState() {
    try {
      const dismissedTimestamp = await AsyncStorage.getItem(DISMISSED_BANNER_KEY);
      if (dismissedTimestamp) {
        const dismissedAt = parseInt(dismissedTimestamp, 10);
        const now = Date.now();
        const timeSinceDismiss = now - dismissedAt;

        if (timeSinceDismiss < DISMISS_DURATION_MS) {
          setIsDismissed(true);
        } else {
          await AsyncStorage.removeItem(DISMISSED_BANNER_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load banner dismissed state:', error);
    }
  }

  async function handleDismiss() {
    try {
      const now = Date.now().toString();
      await AsyncStorage.setItem(DISMISSED_BANNER_KEY, now);
      setIsDismissed(true);
    } catch (error) {
      console.error('Failed to save banner dismissed state:', error);
    }
  }

  if (!subscription || subscription.isPremium || isDismissed) {
    return null;
  }

  if (subscription.isOnTrial && subscription.trialEndDate) {
    const daysRemaining = Math.ceil((subscription.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return null;
    }

    const urgencyLevel = daysRemaining <= 1 ? 'high' : daysRemaining <= 2 ? 'medium' : 'low';
    const bannerColor = urgencyLevel === 'high' ? '#EF4444' : urgencyLevel === 'medium' ? '#F59E0B' : '#10B981';

    return (
      <View style={[styles.banner, { backgroundColor: bannerColor }]}>
        <TouchableOpacity
          style={styles.content}
          onPress={onUpgrade}
          activeOpacity={0.8}
        >
          <Clock size={20} color="#FFFFFF" strokeWidth={2.5} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {daysRemaining === 1 ? 'Last Day of Trial' : `${daysRemaining} Days Left in Trial`}
            </Text>
            <Text style={styles.subtitle}>
              Upgrade now to continue unlimited access
            </Text>
          </View>
          <View style={styles.upgradeButton}>
            <Zap size={16} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.95,
    letterSpacing: -0.2,
  },
  upgradeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
