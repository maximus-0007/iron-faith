import { Dimensions, Platform } from 'react-native';

export interface DeviceInfo {
  isPhone: boolean;
  isTablet: boolean;
  isSmallPhone: boolean;
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;

  const isTablet = (width >= 768 && Platform.OS === 'ios') ||
                    (width >= 600 && Platform.OS === 'android');

  const isSmallPhone = width < 375 || height < 667;

  const isLandscape = width > height;

  return {
    isPhone: !isTablet,
    isTablet,
    isSmallPhone,
    screenWidth: width,
    screenHeight: height,
    isLandscape,
  };
}

export function getResponsiveValue<T>(phoneValue: T, tabletValue: T): T {
  const { isTablet } = getDeviceInfo();
  return isTablet ? tabletValue : phoneValue;
}

export function getResponsivePadding(): number {
  const { isTablet, isSmallPhone } = getDeviceInfo();

  if (isTablet) return 32;
  if (isSmallPhone) return 12;
  return 16;
}

export function getResponsiveFontSize(base: number): number {
  const { isTablet, isSmallPhone } = getDeviceInfo();

  if (isTablet) return base * 1.15;
  if (isSmallPhone) return base * 0.95;
  return base;
}

export function getMaxContentWidth(): number {
  const { isTablet, screenWidth } = getDeviceInfo();

  if (!isTablet) return screenWidth;

  return Math.min(screenWidth * 0.75, 1200);
}

export function getSidebarWidth(): number {
  const { isTablet, screenWidth } = getDeviceInfo();

  if (!isTablet) return Math.min(screenWidth * 0.85, 320);

  return Math.min(screenWidth * 0.35, 400);
}

export function shouldShowPersistentSidebar(): boolean {
  const { isTablet, isLandscape, screenWidth } = getDeviceInfo();

  return isTablet && isLandscape && screenWidth >= 1024;
}
