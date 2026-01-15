import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../utils/AuthContext';
import { useSettings } from '../utils/settings';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Lock, Eye, EyeOff } from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword, clearRecoverySession, signOut } = useAuth();
  const router = useRouter();
  const { theme } = useSettings();
  const params = useLocalSearchParams();
  const isDark = theme.background === '#0F172A';

  const minPasswordLength = 8;

  const passwordStrength = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasMinLength: password.length >= minPasswordLength,
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    setLoading(true);
    setError('');

    const result = await resetPassword(password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      clearRecoverySession();
      setSuccess(true);
    }
  }

  async function handleBackToLogin() {
    await signOut();
    clearRecoverySession();
    router.replace('/login');
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
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
              <Lock size={48} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(200).duration(600)}
            style={[styles.title, { color: theme.text }]}
          >
            Password Reset!
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(300).duration(600)}
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Your password has been successfully reset. You can now log in with your new password.
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(400).duration(600)}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleBackToLogin}
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
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
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
              <Lock size={48} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(200).duration(600)}
            style={[styles.title, { color: theme.text }]}
          >
            Create New Password
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(300).duration(600)}
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Enter a strong password to secure your account.
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
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="New Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={theme.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(500).duration(600)}
            style={styles.requirementsContainer}
          >
            <View style={styles.requirementRow}>
              <View style={[styles.dot, { backgroundColor: passwordStrength.hasMinLength ? '#10B981' : theme.border }]} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                At least {minPasswordLength} characters
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <View style={[styles.dot, { backgroundColor: passwordStrength.hasUpperCase ? '#10B981' : theme.border }]} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                One uppercase letter
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <View style={[styles.dot, { backgroundColor: passwordStrength.hasLowerCase ? '#10B981' : theme.border }]} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                One lowercase letter
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <View style={[styles.dot, { backgroundColor: passwordStrength.hasNumbers ? '#10B981' : theme.border }]} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                One number
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(600).duration(600)}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleResetPassword}
              disabled={loading || !isPasswordValid}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDark ? ['#4A6B8A', '#3A5B7A'] : ['#1E2D3D', '#2E3D4D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, !isPasswordValid && { opacity: 0.5 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
    marginBottom: 24,
  },
  passwordInputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingRight: 56,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  requirementsContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginBottom: 32,
    gap: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requirementText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
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
});
