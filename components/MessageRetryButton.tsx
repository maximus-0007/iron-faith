import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { RefreshCw, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MessageRetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function MessageRetryButton({ onRetry, isRetrying = false }: MessageRetryButtonProps) {
  return (
    <View style={styles.container}>
      <View style={styles.errorBadge}>
        <AlertCircle size={16} color="#EF4444" strokeWidth={2} />
        <Text style={styles.errorText}>Failed to send</Text>
      </View>

      <TouchableOpacity
        style={styles.retryButtonWrapper}
        onPress={onRetry}
        activeOpacity={0.8}
        disabled={isRetrying}
      >
        <LinearGradient
          colors={['#4A6B8A', '#3A5B7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.retryButton}
        >
          {isRetrying ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retrying...</Text>
            </>
          ) : (
            <>
              <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  retryButtonWrapper: {
    shadowColor: '#4A6B8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
