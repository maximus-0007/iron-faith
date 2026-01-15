import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RefreshCw, AlertTriangle, WifiOff, Lock, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { categorizeError, ErrorType, getErrorRecoveryActions } from '../utils/errorHandler';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function getErrorIcon(errorType: ErrorType) {
  switch (errorType) {
    case ErrorType.NETWORK:
      return <WifiOff size={48} color="#EF4444" strokeWidth={2} />;
    case ErrorType.AUTH:
      return <Lock size={48} color="#EF4444" strokeWidth={2} />;
    case ErrorType.RATE_LIMIT:
      return <AlertCircle size={48} color="#F59E0B" strokeWidth={2} />;
    default:
      return <AlertTriangle size={48} color="#EF4444" strokeWidth={2} />;
  }
}

function getErrorTitle(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Connection Problem';
    case ErrorType.AUTH:
      return 'Authentication Required';
    case ErrorType.RATE_LIMIT:
      return 'Rate Limit Reached';
    case ErrorType.SERVER:
      return 'Server Error';
    case ErrorType.VALIDATION:
      return 'Invalid Request';
    default:
      return 'Something Went Wrong';
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const appError = categorizeError(error);
  const recoveryActions = getErrorRecoveryActions(appError.type);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: appError.type === ErrorType.RATE_LIMIT ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
          ]}>
            {getErrorIcon(appError.type)}
          </View>

          <Text style={styles.title}>{getErrorTitle(appError.type)}</Text>

          <Text style={styles.message}>{appError.userMessage}</Text>

          {recoveryActions.length > 0 && (
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>What you can do:</Text>
              {recoveryActions.map((action, index) => (
                <View key={index} style={styles.actionItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          )}

          {appError.isRetryable && (
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={resetError}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4A6B8A', '#3A5B7A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <RefreshCw size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.buttonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {!appError.isRetryable && appError.type === ErrorType.AUTH && (
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={() => {
                resetError();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4A6B8A', '#3A5B7A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Lock size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.buttonText}>Go to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    const appError = categorizeError(error);
    console.error('Categorized as:', appError.type, appError.message);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 500,
    paddingHorizontal: 24,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  message: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A6B8A',
    marginTop: 7,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  buttonWrapper: {
    shadowColor: '#4A6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
