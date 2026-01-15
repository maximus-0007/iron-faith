import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { SettingsProvider, useSettings } from '../utils/settings';
import { AuthProvider, useAuth } from '../utils/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initializeNetworkMonitoring } from '../utils/networkStatus';
import { initializeRevenueCat } from '../utils/revenueCat';

function AppContent() {
  const { settings } = useSettings();
  const { user, loading, isRecoverySession } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(74, 107, 138, 0.4);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(74, 107, 138, 0.6);
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(74, 107, 138, 0.4) transparent;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthScreen = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'forgot-password' || segments[0] === 'reset-password';
    const inResetPassword = segments[0] === 'reset-password';

    if (!user) {
      if (!inAuthScreen) {
        router.replace('/login');
      }
    } else {
      if (isRecoverySession && !inResetPassword) {
        router.replace('/reset-password');
      } else if (!isRecoverySession && inAuthScreen) {
        router.replace('/');
      }
    }
  }, [user, loading, segments, isRecoverySession]);

  useEffect(() => {
    if (user?.id && Platform.OS !== 'web') {
      initializeRevenueCat(user.id).catch(error => {
        console.error('Failed to initialize RevenueCat:', error);
      });
    }
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6B8A" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={settings.colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initializeNetworkMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});

