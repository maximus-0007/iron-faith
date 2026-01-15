import { useCallback } from 'react';
import { Message } from '../components/ChatBubble';

interface SearchHandlersParams {
  flatListRef: React.MutableRefObject<any>;
  messages: Message[];
  searchResults: number[];
  currentSearchIndex: number;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: number[]) => void;
  setCurrentSearchIndex: (index: number) => void;
  setIsSearchVisible: (visible: boolean) => void;
}

export function useSearchHandlers(params: SearchHandlersParams) {
  const {
    flatListRef,
    messages,
    searchResults,
    currentSearchIndex,
    setSearchQuery,
    setSearchResults,
    setCurrentSearchIndex,
    setIsSearchVisible,
  } = params;

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results: number[] = [];
    messages.forEach((message, index) => {
      if (message.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length > 0) {
      flatListRef.current?.scrollToIndex({
        index: results[0],
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [messages, flatListRef, setSearchQuery, setSearchResults, setCurrentSearchIndex]);

  const handleSearchNavigate = useCallback((direction: 'up' | 'down') => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === 'down') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }

    setCurrentSearchIndex(newIndex);
    flatListRef.current?.scrollToIndex({
      index: searchResults[newIndex],
      animated: true,
      viewPosition: 0.5,
    });
  }, [searchResults, currentSearchIndex, flatListRef, setCurrentSearchIndex]);

  const handleCloseSearch = useCallback(() => {
    setIsSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, [setIsSearchVisible, setSearchQuery, setSearchResults, setCurrentSearchIndex]);

  return {
    handleSearch,
    handleSearchNavigate,
    handleCloseSearch,
  };
}
