import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../utils/settings';
import { haptics } from '../utils/haptics';

interface UndoSnackbarProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoSnackbar({
  visible,
  message,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoSnackbarProps) {
  const { theme } = useSettings();
  const translateY = useRef(new RNAnimated.Value(100)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      RNAnimated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }).start();

      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      RNAnimated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible]);

  const handleUndo = () => {
    haptics.medium();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onUndo();
  };

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onDismiss();
  };

  if (!visible) return null;

  return (
    <RNAnimated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={['#1F2937', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.message} numberOfLines={1}>
            {message}
          </Text>
          <TouchableOpacity
            onPress={handleUndo}
            style={styles.undoButton}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Undo delete"
            accessibilityRole="button"
          >
            <RotateCcw size={16} color="#60A5FA" strokeWidth={2.5} />
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
  },
  gradient: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
    letterSpacing: -0.2,
  },
});
