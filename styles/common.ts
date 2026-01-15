import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 20,
  xxxl: 24,
} as const;

export const shadowStyles = StyleSheet.create({
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
});

export const buttonStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  primary: {
    gap: 10,
  },
  secondary: {
    borderWidth: 2,
  },
});

export const cardStyles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1.5,
  },
  elevated: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});

export const inputStyles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.sm + 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT_SIZE.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
});

export const textStyles = StyleSheet.create({
  heading: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 22,
  },
  caption: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },
  small: {
    fontSize: FONT_SIZE.xs,
  },
});

export const layoutStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
});

export const dividerStyle: ViewStyle = {
  height: 1,
  marginVertical: SPACING.xl,
};

export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  styleCreator: (theme: any) => T
) {
  return styleCreator;
}
