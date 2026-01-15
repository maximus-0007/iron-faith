import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../utils/AuthContext';
import { useSettings } from '../utils/settings';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Mail, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { requestPasswordReset } = useAuth();
  const router = useRouter();
  const { theme } = useSettings();
  const isDark = theme.background === '#0F172A';

  async function handleRequestReset() {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    const result = await requestPasswordReset(email);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  function handleResendEmail() {
    setSent(false);
    setEmail('');
    setError('');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: theme.text }]}>
            {sent ? 'Check Your Email' : 'Reset Password'}
          </Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        <View style={styles.content}>
          {!sent ? (
            <>
              <Animated.View
                entering={FadeIn.duration(600)}
                style={styles.iconWrapper}
              >
                <LinearGradient
                  colors={isDark ? ['#4A6B8A', '#1E2D3D'] : ['#1E2D3D', '#4A6B8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientIcon}
                >
                  <Mail size={48} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </Animated.View>

              <Animated.Text
                entering={FadeIn.delay(200).duration(600)}
                style={[styles.title, { color: theme.text }]}
              >
                Forgot Password?
              </Animated.Text>

              <Animated.Text
                entering={FadeIn.delay(300).duration(600)}
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                Enter your email address and we'll send you a link to reset your password.
              </Animated.Text>

              {error ? (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={styles.errorContainer}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              <Animated.View
                entering={FadeIn.delay(400).duration(600)}
                style={styles.inputContainer}
              >
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </Animated.View>

              <Animated.View
                entering={FadeIn.delay(500).duration(600)}
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={styles.buttonWrapper}
                  onPress={handleRequestReset}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isDark ? ['#4A6B8A', '#3A5B7A'] : ['#1E2D3D', '#2E3D4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Send Reset Link</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.back()}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.linkText, { color: theme.text }]}>
                    Remember your password? <Text style={[styles.linkTextBold, { color: theme.buttonPrimary }]}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View
                entering={FadeIn.duration(600)}
                style={styles.iconWrapper}
              >
                <LinearGradient
                  colors={isDark ? ['#10B981', '#059669'] : ['#059669', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientIcon}
                >
                  <Mail size={48} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </Animated.View>

              <Animated.Text
                entering={FadeIn.delay(200).duration(600)}
                style={[styles.title, { color: theme.text }]}
              >
                Email Sent!
              </Animated.Text>

              <Animated.Text
                entering={FadeIn.delay(300).duration(600)}
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                We've sent a password reset link to {email}. Check your inbox and click the link to reset your password.
              </Animated.Text>

              <Animated.Text
                entering={FadeIn.delay(400).duration(600)}
                style={[styles.subtitle, { color: theme.textSecondary, marginTop: 16 }]}
              >
                The link will expire in 24 hours.
              </Animated.Text>

              <Animated.View
                entering={FadeIn.delay(500).duration(600)}
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={styles.buttonWrapper}
                  onPress={() => router.replace('/login')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isDark ? ['#4A6B8A', '#3A5B7A'] : ['#1E2D3D', '#2E3D4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Back to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleResendEmail}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.linkText, { color: theme.text }]}>
                    Didn't receive it? <Text style={[styles.linkTextBold, { color: theme.buttonPrimary }]}>Resend Email</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  gradientIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginTop: 8,
    gap: 20,
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  linkTextBold: {
    fontWeight: '700',
  },
});
