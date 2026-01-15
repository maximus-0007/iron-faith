import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Text,
  Pressable,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useSettings } from '../utils/settings';
import { searchAll, type SearchResult } from '../utils/search';

interface SearchBarProps {
  userId: string;
  onSelectConversation: (conversationId: string) => void;
  placeholder?: string;
}

export function SearchBar({ userId, onSelectConversation, placeholder }: SearchBarProps) {
  const { theme } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await searchAll(userId, query);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleSelectResult = (conversationId: string) => {
    onSelectConversation(conversationId);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
        <Search size={20} color={theme.textSecondary} strokeWidth={2} />
        <TextInput
          style={[styles.input, { color: theme.inputText }]}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder || 'Search messages...'}
          placeholderTextColor={theme.inputPlaceholder}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        {loading && <ActivityIndicator size="small" color={theme.loadingIndicator} />}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={20} color={theme.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && results.length > 0 && (
        <View style={[styles.resultsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.resultItem,
                  { borderBottomColor: theme.borderLight },
                  pressed && { backgroundColor: theme.surfaceSecondary }
                ]}
                onPress={() => handleSelectResult(item.conversationId)}
              >
                <View style={styles.resultContent}>
                  {item.title && (
                    <Text style={[styles.resultConversation, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  )}
                  <Text style={[styles.resultSnippet, { color: theme.text }]} numberOfLines={2}>
                    {item.highlight || item.content}
                  </Text>
                  <Text style={[styles.resultMeta, { color: theme.textTertiary }]}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
              </Pressable>
            )}
            ListFooterComponent={
              <Text style={[styles.resultsCount, { color: theme.textTertiary }]}>
                {results.length} message{results.length !== 1 ? 's' : ''} found
              </Text>
            }
          />
        </View>
      )}

      {showResults && results.length === 0 && query.trim() && !loading && (
        <View style={[styles.noResults, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
            No messages found for "{query}"
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
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
    fontSize: 16,
    paddingVertical: 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 400,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultContent: {
    gap: 6,
  },
  resultConversation: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultSnippet: {
    fontSize: 15,
    lineHeight: 20,
  },
  resultMeta: {
    fontSize: 12,
  },
  resultsCount: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
  },
  noResults: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
