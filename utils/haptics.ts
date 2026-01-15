import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export enum HapticFeedbackType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
}

export async function triggerHaptic(type: HapticFeedbackType): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    switch (type) {
      case HapticFeedbackType.LIGHT:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case HapticFeedbackType.MEDIUM:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case HapticFeedbackType.HEAVY:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case HapticFeedbackType.SUCCESS:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case HapticFeedbackType.WARNING:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case HapticFeedbackType.ERROR:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case HapticFeedbackType.SELECTION:
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

export const haptics = {
  light: () => triggerHaptic(HapticFeedbackType.LIGHT),
  medium: () => triggerHaptic(HapticFeedbackType.MEDIUM),
  heavy: () => triggerHaptic(HapticFeedbackType.HEAVY),
  success: () => triggerHaptic(HapticFeedbackType.SUCCESS),
  warning: () => triggerHaptic(HapticFeedbackType.WARNING),
  error: () => triggerHaptic(HapticFeedbackType.ERROR),
  selection: () => triggerHaptic(HapticFeedbackType.SELECTION),
};
