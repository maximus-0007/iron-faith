import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  Share,
} from 'react-native';
import { X, Copy, BookOpen, Check, Copyright } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { haptics } from '../utils/haptics';
import {
  fetchVerseMultipleTranslations,
  saveRecentVerse,
  formatVerseWithCopyright,
  getCopyrightInfo,
  type BibleVerse,
} from '../utils/bible';
import { getUserTranslationPreferences, getCachedVersesMultiple, saveCachedVerse } from '../utils/database';
import { useSettings } from '../utils/settings';

interface VerseViewerProps {
  visible: boolean;
  reference: string;
  onClose: () => void;
  userId?: string;
}

interface UserTranslation {
  abbreviation: string;
  name: string;
  id: string;
}

export function VerseViewer({ visible, reference, onClose, userId }: VerseViewerProps) {
  const { theme } = useSettings();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState('web');
  const [copied, setCopied] = useState(false);
  const [userTranslations, setUserTranslations] = useState<UserTranslation[]>([]);
  const [showCopyright, setShowCopyright] = useState(false);

  useEffect(() => {
    if (visible && reference) {
      loadVerses();
      setShowCopyright(false);
    }
  }, [visible, reference, userId]);

  const loadVerses = async () => {
    setLoading(true);
    setError(null);

    try {
      let translationsToFetch: UserTranslation[] = [
        { abbreviation: 'web', name: 'World English Bible', id: '9879dbb7cfe39e4d-01' },
        { abbreviation: 'kjv', name: 'King James Version', id: 'de4e12af7f28f599-02' },
      ];

      if (userId) {
        try {
          const userPrefs = await getUserTranslationPreferences(userId);
          if (userPrefs.length > 0) {
            translationsToFetch = userPrefs.map(p => ({
              abbreviation: p.translation_abbreviation.toLowerCase(),
              name: p.translation_name,
              id: p.translation_id,
            }));
          }
        } catch (prefError) {
          console.error('Failed to load user preferences, using defaults:', prefError);
        }
      }

      setUserTranslations(translationsToFetch);
      const abbreviations = translationsToFetch.map(t => t.abbreviation);
      const translationIds = translationsToFetch.map(t => t.id);

      let cachedVerses: BibleVerse[] = [];
      let translationsToFetchFromAPI: string[] = abbreviations;

      if (userId) {
        try {
          const cached = await getCachedVersesMultiple(userId, reference, translationIds);

          if (cached.length > 0) {
            cachedVerses = cached.map(cv => ({
              reference: cv.verse_reference,
              text: cv.verse_text,
              translation: translationsToFetch.find(t => t.id === cv.translation_id)?.abbreviation || 'unknown',
              book: cv.book_name,
              chapter: cv.chapter,
              verse: cv.verse_number,
              verseEnd: cv.verse_end,
            }));

            const cachedTranslationIds = cached.map(cv => cv.translation_id);
            translationsToFetchFromAPI = translationsToFetch
              .filter(t => !cachedTranslationIds.includes(t.id))
              .map(t => t.abbreviation);

            console.log(`Cache hit! Found ${cached.length}/${translationIds.length} translations in cache`);
          }
        } catch (cacheError) {
          console.warn('Failed to check cache, fetching from API:', cacheError);
        }
      }

      let fetchedVerses: BibleVerse[] = [];

      if (translationsToFetchFromAPI.length > 0) {
        console.log(`Fetching ${translationsToFetchFromAPI.length} translations from API...`);
        fetchedVerses = await fetchVerseMultipleTranslations(
          reference,
          translationsToFetchFromAPI
        );

        if (userId && fetchedVerses.length > 0) {
          for (const verse of fetchedVerses) {
            const translation = translationsToFetch.find(
              t => t.abbreviation === verse.translation.toLowerCase()
            );
            if (translation) {
              try {
                await saveCachedVerse(
                  userId,
                  verse.reference,
                  translation.id,
                  verse.text,
                  verse.book,
                  verse.chapter,
                  verse.verse,
                  verse.verseEnd
                );
                console.log(`Cached verse: ${verse.reference} (${verse.translation})`);
              } catch (saveError) {
                console.warn('Failed to save verse to cache:', saveError);
              }
            }
          }
        }
      }

      const allVerses = [...cachedVerses, ...fetchedVerses];

      if (allVerses.length === 0) {
        setError('Unable to load this verse. Please try again.');
      } else {
        setVerses(allVerses);
        setSelectedTranslation(allVerses[0].translation.toLowerCase());
        await saveRecentVerse(allVerses[0]);
      }
    } catch (err) {
      setError('Failed to fetch verse. Please check your connection.');
      console.error('Error loading verses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const verse = verses.find(v => v.translation.toLowerCase() === selectedTranslation);
    if (!verse) return;

    const formattedText = formatVerseWithCopyright(verse);

    try {
      await Clipboard.setStringAsync(formattedText);
      setCopied(true);

      haptics.success();

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    const verse = verses.find(v => v.translation.toLowerCase() === selectedTranslation);
    if (!verse) return;

    const formattedText = formatVerseWithCopyright(verse);

    try {
      await Share.share({
        message: formattedText,
        title: verse.reference,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const selectedVerse = verses.find(
    v => v.translation.toLowerCase() === selectedTranslation
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <BookOpen size={24} color={theme.primary} strokeWidth={2} />
              <Text style={[styles.title, { color: theme.text }]}>
                {loading ? 'Loading...' : reference}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading verse...</Text>
              </View>
            )}

            {error && !loading && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadVerses}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && selectedVerse && (
              <>
                {/* Translation selector - show all user-selected translations */}
                {userTranslations.length > 0 && (
                  <View style={styles.translationSelector}>
                    {userTranslations.map(trans => {
                      const verse = verses.find(v => v.translation.toLowerCase() === trans.abbreviation);
                      const isSelected = selectedTranslation === trans.abbreviation;
                      const isAvailable = !!verse;

                      return (
                        <View key={trans.abbreviation}>
                          <TouchableOpacity
                            style={[
                              styles.translationButton,
                              { backgroundColor: theme.background, borderColor: theme.border },
                              isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                              !isAvailable && { opacity: 0.5, backgroundColor: theme.border },
                            ]}
                            onPress={() => {
                              if (isAvailable) {
                                setSelectedTranslation(trans.abbreviation);
                                setShowCopyright(false);
                              }
                            }}
                            disabled={!isAvailable}
                          >
                            <Text
                              style={[
                                styles.translationButtonText,
                                { color: theme.textSecondary },
                                isSelected && styles.translationButtonTextActive,
                              ]}
                            >
                              {trans.abbreviation.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                          {!isAvailable && (
                            <Text style={[styles.translationError, { color: theme.error }]}>Failed to load</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Verse text */}
                <View style={styles.verseContainer}>
                  <Text style={[styles.verseText, { color: theme.text }]}>{selectedVerse.text}</Text>
                </View>

                {/* Reference citation */}
                <Text style={[styles.citation, { color: theme.textSecondary }]}>
                  — {selectedVerse.reference} ({selectedVerse.translation})
                </Text>

                {/* Copyright icon with expandable text */}
                {(() => {
                  const copyright = getCopyrightInfo(selectedVerse.translation);
                  const hasCopyright = copyright && copyright.notice !== 'Public Domain';
                  return (
                    <View style={styles.attributionRow}>
                      <Text style={[styles.apiAttributionText, { color: theme.textSecondary }]}>
                        Scripture from API.Bible
                      </Text>
                      {hasCopyright && (
                        <TouchableOpacity
                          style={[styles.copyrightButton, { backgroundColor: theme.background }]}
                          onPress={() => setShowCopyright(!showCopyright)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Copyright size={14} color={theme.textSecondary} strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}

                {showCopyright && (() => {
                  const copyright = getCopyrightInfo(selectedVerse.translation);
                  if (copyright && copyright.notice !== 'Public Domain') {
                    return (
                      <View style={[styles.copyrightContainer, { backgroundColor: theme.background }]}>
                        <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>{copyright.notice}</Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Action buttons */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.primary },
                      copied && { backgroundColor: theme.success },
                    ]}
                    onPress={handleCopy}
                  >
                    {copied ? (
                      <Check size={20} color="#fff" strokeWidth={2} />
                    ) : (
                      <Copy size={20} color="#fff" strokeWidth={2} />
                    )}
                    <Text style={styles.actionButtonText}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={handleShare}
                  >
                    <BookOpen size={20} color="#fff" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  translationSelector: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    flexWrap: 'wrap',
  },
  translationButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  translationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  translationButtonTextActive: {
    color: '#fff',
  },
  translationError: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  verseContainer: {
    paddingVertical: 24,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 32,
    fontWeight: '400',
  },
  citation: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  apiAttributionText: {
    fontSize: 11,
  },
  copyrightButton: {
    padding: 4,
    borderRadius: 12,
  },
  copyrightContainer: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyrightText: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
