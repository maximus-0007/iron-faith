import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useSettings } from '../utils/settings';
import { haptics } from '../utils/haptics';

interface ConversationSearchBarProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  currentIndex: number;
  totalResults: number;
  onNavigate: (direction: 'up' | 'down') => void;
}

export default function ConversationSearchBar({
  visible,
  onClose,
  onSearch,
  currentIndex,
  totalResults,
  onNavigate,
}: ConversationSearchBarProps) {
  const [query, setQuery] = useState('');
  const { theme } = useSettings();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      setQuery('');
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleQueryChange = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  const handleNavigate = (direction: 'up' | 'down') => {
    haptics.light();
    onNavigate(direction);
  };

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[animatedStyle]}>
      <LinearGradient
        colors={theme.gradients.surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, { borderBottomColor: theme.border }]}
      >
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <Search size={18} color={theme.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.input, { color: theme.inputText, outline: 'none' } as any]}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search in conversation..."
            placeholderTextColor={theme.inputPlaceholder}
            autoFocus
            accessible={true}
            accessibilityLabel="Search conversation"
            accessibilityHint="Type to search for messages in this conversation"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {totalResults > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
              {currentIndex + 1} of {totalResults}
            </Text>
            <View style={styles.navigation}>
              <TouchableOpacity
                onPress={() => handleNavigate('up')}
                disabled={totalResults === 0}
                style={[styles.navButton, { opacity: totalResults === 0 ? 0.4 : 1 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityLabel="Previous result"
                accessibilityRole="button"
              >
                <ChevronUp size={20} color={theme.text} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleNavigate('down')}
                disabled={totalResults === 0}
                style={[styles.navButton, { opacity: totalResults === 0 ? 0.4 : 1 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityLabel="Next result"
                accessibilityRole="button"
              >
                <ChevronDown size={20} color={theme.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityLabel="Close search"
          accessibilityRole="button"
        >
          <X size={22} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  resultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
});
