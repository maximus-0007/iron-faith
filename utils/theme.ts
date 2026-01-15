export interface Theme {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  userBubble: string;
  userBubbleText: string;
  aiBubble: string;
  aiBubbleText: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  activeItem: string;
  activeItemText: string;
  loadingIndicator: string;
  shadow: string;
  overlay: string;
  primary: string;
  primaryLight: string;
  success: string;
  error: string;
  warning: string;
  markdown: {
    codeBackground: string;
    codeText: string;
    linkText: string;
  };
  gradients: {
    primary: [string, string];
    header: [string, string];
    inputFocus: [string, string];
    userBubble: [string, string];
    aiBubble: [string, string];
    surface: [string, string];
  };
}

export const lightTheme: Theme = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  userBubble: '#004aad',
  userBubbleText: '#FFFFFF',
  aiBubble: '#FFFFFF',
  aiBubbleText: '#111827',
  inputBackground: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputText: '#111827',
  inputPlaceholder: '#9CA3AF',
  buttonPrimary: '#004aad',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F3F4F6',
  buttonSecondaryText: '#374151',
  activeItem: '#E6F0FF',
  activeItemText: '#004aad',
  loadingIndicator: '#004aad',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',
  primary: '#004aad',
  primaryLight: '#E6F0FF',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  markdown: {
    codeBackground: '#F3F4F6',
    codeText: '#374151',
    linkText: '#004aad',
  },
  gradients: {
    primary: ['#004aad', '#0066cc'],
    header: ['#FFFFFF', '#F9FAFB'],
    inputFocus: ['rgba(0, 74, 173, 0.05)', 'rgba(0, 74, 173, 0.02)'],
    userBubble: ['#004aad', '#0055c4'],
    aiBubble: ['#FFFFFF', '#FAFBFC'],
    surface: ['#FFFFFF', '#F9FAFB'],
  },
};

export const darkTheme: Theme = {
  background: '#0A0F1E',
  surface: '#1A2332',
  surfaceSecondary: '#2A3544',
  text: '#F8FAFC',
  textSecondary: '#B4C1D4',
  textTertiary: '#7A8BA3',
  border: '#3A4556',
  borderLight: '#4A5667',
  userBubble: '#2563EB',
  userBubbleText: '#FFFFFF',
  aiBubble: '#1E2B3E',
  aiBubbleText: '#F8FAFC',
  inputBackground: '#1E2B3E',
  inputBorder: '#3A4556',
  inputText: '#F8FAFC',
  inputPlaceholder: '#7A8BA3',
  buttonPrimary: '#2563EB',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#2A3544',
  buttonSecondaryText: '#E8EEF7',
  activeItem: '#1E3A5F',
  activeItemText: '#93C5FD',
  loadingIndicator: '#2563EB',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  primary: '#2563EB',
  primaryLight: '#1E3A5F',
  success: '#10B981',
  error: '#F87171',
  warning: '#FBBF24',
  markdown: {
    codeBackground: '#2A3544',
    codeText: '#E8EEF7',
    linkText: '#60A5FA',
  },
  gradients: {
    primary: ['#2563EB', '#3B82F6'],
    header: ['#1A2332', '#0A0F1E'],
    inputFocus: ['rgba(37, 99, 235, 0.15)', 'rgba(37, 99, 235, 0.05)'],
    userBubble: ['#2563EB', '#3B82F6'],
    aiBubble: ['#1E2B3E', '#253547'],
    surface: ['#1A2332', '#141C29'],
  },
};

export const colors = lightTheme;
