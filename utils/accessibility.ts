import { AccessibilityInfo } from 'react-native';
import { useState, useEffect } from 'react';

let isReduceMotionEnabled = false;

export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(isReduceMotionEnabled);

  useEffect(() => {
    const checkReduceMotion = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotion(enabled);
        isReduceMotionEnabled = enabled;
      } catch (error) {
        console.warn('Failed to check reduced motion preference:', error);
      }
    };

    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return reduceMotion;
}

export function getReducedMotionEnabled(): boolean {
  return isReduceMotionEnabled;
}

export const animationConfig = {
  quick: (reduceMotion: boolean) => ({
    duration: reduceMotion ? 0 : 150,
  }),
  normal: (reduceMotion: boolean) => ({
    duration: reduceMotion ? 0 : 250,
  }),
  slow: (reduceMotion: boolean) => ({
    duration: reduceMotion ? 0 : 400,
  }),
  spring: (reduceMotion: boolean) =>
    reduceMotion
      ? { duration: 0 }
      : { damping: 15, stiffness: 200 },
};

export function announceForAccessibility(message: string) {
  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch (error) {
    console.warn('Failed to announce for accessibility:', error);
  }
}

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?:
    | 'none'
    | 'button'
    | 'link'
    | 'search'
    | 'image'
    | 'keyboardkey'
    | 'text'
    | 'adjustable'
    | 'imagebutton'
    | 'header'
    | 'summary'
    | 'alert'
    | 'checkbox'
    | 'combobox'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'scrollbar'
    | 'spinbutton'
    | 'switch'
    | 'tab'
    | 'tablist'
    | 'timer'
    | 'toolbar';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}
