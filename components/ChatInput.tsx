import { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolateColor,
  useAnimatedProps,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp, Square, Mic, MicOff, Zap, AlertCircle, CornerRightUp, X } from 'lucide-react-native';
import { useSettings } from '../utils/settings';
import LoadingDots from './LoadingDots';
import { AudioRecorder, transcribeAudio } from '../utils/audioRecorder';
import { getUserUsage, UserUsage } from '../utils/messageLimit';
import { haptics } from '../utils/haptics';
import { useReducedMotion, animationConfig } from '../utils/accessibility';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
  onStop?: () => void;
  userId: string | null;
  onLimitReached?: () => void;
  refreshTrigger?: number;
}

export default function ChatInput({
  onSend,
  disabled = false,
  loading = false,
  onStop,
  userId,
  onLimitReached,
  refreshTrigger = 0
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [inputHeight, setInputHeight] = useState(24);
  const { theme } = useSettings();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const pulseScale = useSharedValue(1);
  const focusProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const micScale = useSharedValue(1);
  const micRotation = useSharedValue(0);
  const waveAmplitude = useSharedValue(0);
  const sendButtonOpacity = useSharedValue(0);
  const sendButtonScale = useSharedValue(0.8);
  const audioRecorderRef = useRef(new AudioRecorder());
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (userId) {
      loadUsage();
    }
  }, [userId, refreshTrigger]);

  async function loadUsage() {
    if (!userId) return;

    try {
      const data = await getUserUsage(userId);
      setUsage(data);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  }

  useEffect(() => {
    if (loading && !reduceMotion) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, animationConfig.quick(reduceMotion));
    }
  }, [loading, reduceMotion]);

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, animationConfig.normal(reduceMotion));
    glowOpacity.value = withTiming(
      isFocused ? (reduceMotion ? 0 : 0.5) : 0,
      animationConfig.normal(reduceMotion)
    );
  }, [isFocused, reduceMotion]);

  useEffect(() => {
    const hasText = message.trim().length > 0;
    sendButtonOpacity.value = withTiming(hasText ? 1 : 0, animationConfig.quick(reduceMotion));
    if (reduceMotion) {
      sendButtonScale.value = withTiming(hasText ? 1 : 0.8, animationConfig.quick(reduceMotion));
    } else {
      sendButtonScale.value = withSpring(hasText ? 1 : 0.8, animationConfig.spring(reduceMotion));
    }
  }, [message, reduceMotion]);

  useEffect(() => {
    if (isRecording && !reduceMotion) {
      waveAmplitude.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      waveAmplitude.value = withTiming(0, animationConfig.quick(reduceMotion));
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (!isRecording) {
        setRecordingDuration(0);
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [theme.inputBorder, theme.primary]
    ),
    shadowOpacity: focusProgress.value * 0.12,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveAmplitude.value * 0.6,
    transform: [{ scale: 1 + waveAmplitude.value * 0.3 }],
  }));

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sendButtonOpacity.value,
    transform: [{ scale: sendButtonScale.value }],
  }));

  const handleSend = () => {
    if (!message.trim() || disabled || loading) return;

    if (usage && !usage.isPremium && usage.messagesRemaining === 0) {
      if (onLimitReached) {
        onLimitReached();
      }
      return;
    }

    haptics.light();

    sendButtonScale.value = withSequence(
      withTiming(0.85, { duration: 80, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onSend(message.trim());
    setMessage('');
    setInputHeight(24);
  };

  const formatRecordingDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      haptics.heavy();

      micScale.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      );

      await audioRecorderRef.current.startRecording();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      if (Platform.OS === 'web') {
        alert(error.message || 'Failed to start recording. Please check microphone permissions.');
      } else {
        Alert.alert('Recording Error', error.message || 'Failed to start recording. Please check microphone permissions.');
      }
    }
  };

  const stopRecording = async () => {
    try {
      haptics.success();

      micScale.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      );

      const result = await audioRecorderRef.current.stopRecording();
      setIsRecording(false);

      if (!result) {
        return;
      }

      if (result.duration < 500) {
        if (Platform.OS === 'web') {
          alert('Recording too short. Please record for at least 1 second.');
        } else {
          Alert.alert('Recording Too Short', 'Please record for at least 1 second.');
        }
        return;
      }

      setIsTranscribing(true);

      try {
        const transcribedText = await transcribeAudio(result.uri);

        haptics.success();

        setMessage(transcribedText);
      } catch (error: any) {
        console.error('Transcription failed:', error);

        haptics.error();

        if (Platform.OS === 'web') {
          alert(error.message || 'Failed to transcribe audio. Please try again.');
        } else {
          Alert.alert('Transcription Error', error.message || 'Failed to transcribe audio. Please try again.');
        }
      } finally {
        setIsTranscribing(false);
      }
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  const cancelRecording = async () => {
    try {
      haptics.medium();

      await audioRecorderRef.current.cancelRecording();
      setIsRecording(false);
    } catch (error: any) {
      console.error('Failed to cancel recording:', error);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    const recorder = audioRecorderRef.current;
    return () => {
      if (recorder.getIsRecording()) {
        recorder.cancelRecording();
      }
    };
  }, []);

  const isAtLimit = usage && !usage.isPremium && usage.messagesRemaining === 0;
  const isLowOnMessages = usage && !usage.isPremium && usage.messagesRemaining > 0 && usage.messagesRemaining <= 2;
  const isDisabled = !message.trim() || disabled || !!isAtLimit;

  const isSmallScreen = windowHeight < 700;
  const keyboardOffset = Platform.OS === 'ios'
    ? (isSmallScreen ? 60 : 90) + insets.bottom
    : 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
    >
      <LinearGradient
        colors={theme.gradients.surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        {isLowOnMessages && (
          <View style={[styles.warningBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <AlertCircle size={16} color="#F59E0B" strokeWidth={2.5} />
            <Text style={styles.warningText}>
              {usage.messagesRemaining} {usage.messagesRemaining === 1 ? 'message' : 'messages'} remaining today
            </Text>
          </View>
        )}

        {isAtLimit && (
          <TouchableOpacity
            style={[styles.limitBanner, { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }]}
            onPress={onLimitReached}
            activeOpacity={0.7}
          >
            <View style={styles.limitBannerContent}>
              <Zap size={18} color="#DC2626" strokeWidth={2.5} fill="#DC2626" />
              <View style={styles.limitTextContainer}>
                <Text style={styles.limitTitle}>Daily limit reached</Text>
                <Text style={styles.limitSubtitle}>Upgrade to Premium for unlimited messages</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {isRecording && (
          <View style={[styles.recordingBanner, { backgroundColor: theme.surface }]}>
            <View style={styles.recordingContent}>
              <View style={styles.waveformContainer}>
                {[0, 1, 2].map((i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      { backgroundColor: '#ef4444' },
                      waveStyle,
                      { animationDelay: `${i * 100}ms` }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.recordingText, { color: '#ef4444' }]}>
                Recording... {formatRecordingDuration(recordingDuration)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={cancelRecording}
              style={styles.cancelRecordingButton}
              accessible={true}
              accessibilityLabel="Cancel recording"
              accessibilityHint="Discards the current recording without transcribing"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <X size={18} color={theme.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <Animated.View style={[styles.glowEffect, { backgroundColor: theme.primary }, glowStyle]} />
          <Animated.View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.inputBackground },
              containerAnimatedStyle,
            ]}
          >
            <TextInput
              style={[
                styles.input,
                { outline: 'none', color: theme.inputText, height: Math.min(Math.max(inputHeight, 24), 120) } as any
              ]}
              value={message}
              onChangeText={(text) => setMessage(text)}
              onContentSizeChange={(e) => {
                const newHeight = e.nativeEvent.contentSize.height;
                setInputHeight(newHeight);
              }}
              placeholder={isAtLimit ? "Upgrade to continue..." : "Ask a Bible or spiritual question..."}
              placeholderTextColor={theme.inputPlaceholder}
              multiline
              maxLength={500}
              editable={!disabled && !loading && !isRecording && !isTranscribing && !isAtLimit}
              onSubmitEditing={handleSend}
              onFocus={() => !isAtLimit && setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              accessible={true}
              accessibilityLabel="Message input"
              accessibilityHint="Type your Bible or spiritual question here"
              scrollEnabled={false}
            />

            {isTranscribing ? (
              <View style={[styles.micButton, { backgroundColor: theme.surface, opacity: 0.6 }]}>
                <LoadingDots color={theme.primary} size={5} />
              </View>
            ) : (
              <Animated.View style={micAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleMicPress}
                  disabled={disabled || loading || !!isAtLimit}
                  accessible={true}
                  accessibilityLabel={isRecording ? "Stop recording" : "Start voice input"}
                  accessibilityHint={isRecording ? "Tap to stop recording and transcribe" : "Tap to start recording your voice"}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  style={[
                    styles.micButton,
                    isRecording && { backgroundColor: '#FEE2E2' }
                  ]}
                >
                  {isRecording ? (
                    <View style={styles.recordingIndicatorContainer}>
                      <Animated.View style={[styles.recordingPulse, waveStyle]}>
                        <View style={styles.recordingPulseInner} />
                      </Animated.View>
                      <Square
                        size={16}
                        color="#ef4444"
                        strokeWidth={0}
                        fill="#ef4444"
                      />
                    </View>
                  ) : (
                    <Mic
                      size={20}
                      color={theme.textSecondary}
                      strokeWidth={2.5}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {loading ? (
              <Animated.View style={pulseStyle}>
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.sendButton, styles.loadingButton]}
                >
                  <LoadingDots color="#FFFFFF" size={5} />
                </LinearGradient>
              </Animated.View>
            ) : (
              message.trim() ? (
                <Animated.View style={sendButtonAnimatedStyle}>
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={isDisabled}
                    accessible={true}
                    accessibilityLabel="Send message"
                    accessibilityHint="Sends your question to get a response"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isDisabled }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isDisabled ? [theme.textTertiary, theme.textTertiary] : theme.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.sendButton,
                        !isDisabled && styles.sendButtonShadow,
                      ]}
                    >
                      <CornerRightUp
                        size={20}
                        color="#FFFFFF"
                        strokeWidth={2.5}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ) : null
            )}
          </Animated.View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: -0.2,
  },
  limitBanner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  limitBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  limitTextContainer: {
    flex: 1,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  limitSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
    letterSpacing: -0.1,
  },
  recordingBanner: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
  },
  waveBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  recordingHint: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  cancelRecordingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  inputWrapper: {
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 28,
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 26,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    minHeight: 24,
    maxHeight: 120,
    fontSize: 16,
    paddingVertical: 6,
    paddingRight: 8,
    lineHeight: 22,
    textAlign: 'left',
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  recordingIndicatorContainer: {
    position: 'relative',
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    opacity: 0.2,
  },
  recordingPulseInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    opacity: 0.3,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonShadow: {
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingButton: {
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
