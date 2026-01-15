import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
}

export interface RecentVerse extends BibleVerse {
  viewedAt: string;
}

const BIBLE_API_BASE = process.env.EXPO_PUBLIC_BIBLE_API_URL || 'https://rest.api.bible/v1';
const BIBLE_API_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY || '';
const RECENT_VERSES_KEY = '@recent_verses';
const MAX_RECENT_VERSES = 20;

const BOOK_TO_API_CODE: Record<string, string> = {
  'Genesis': 'GEN',
  'Exodus': 'EXO',
  'Leviticus': 'LEV',
  'Numbers': 'NUM',
  'Deuteronomy': 'DEU',
  'Joshua': 'JOS',
  'Judges': 'JDG',
  'Ruth': 'RUT',
  '1 Samuel': '1SA',
  '2 Samuel': '2SA',
  '1 Kings': '1KI',
  '2 Kings': '2KI',
  '1 Chronicles': '1CH',
  '2 Chronicles': '2CH',
  'Ezra': 'EZR',
  'Nehemiah': 'NEH',
  'Esther': 'EST',
  'Job': 'JOB',
  'Psalms': 'PSA',
  'Psalm': 'PSA',
  'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC',
  'Song of Solomon': 'SNG',
  'Song of Songs': 'SNG',
  'Isaiah': 'ISA',
  'Jeremiah': 'JER',
  'Lamentations': 'LAM',
  'Ezekiel': 'EZK',
  'Daniel': 'DAN',
  'Hosea': 'HOS',
  'Joel': 'JOL',
  'Amos': 'AMO',
  'Obadiah': 'OBA',
  'Jonah': 'JON',
  'Micah': 'MIC',
  'Nahum': 'NAM',
  'Habakkuk': 'HAB',
  'Zephaniah': 'ZEP',
  'Haggai': 'HAG',
  'Zechariah': 'ZEC',
  'Malachi': 'MAL',
  'Matthew': 'MAT',
  'Mark': 'MRK',
  'Luke': 'LUK',
  'John': 'JHN',
  'Acts': 'ACT',
  'Romans': 'ROM',
  '1 Corinthians': '1CO',
  '2 Corinthians': '2CO',
  'Galatians': 'GAL',
  'Ephesians': 'EPH',
  'Philippians': 'PHP',
  'Colossians': 'COL',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  '1 Timothy': '1TI',
  '2 Timothy': '2TI',
  'Titus': 'TIT',
  'Philemon': 'PHM',
  'Hebrews': 'HEB',
  'James': 'JAS',
  '1 Peter': '1PE',
  '2 Peter': '2PE',
  '1 John': '1JN',
  '2 John': '2JN',
  '3 John': '3JN',
  'Jude': 'JUD',
  'Revelation': 'REV',
};

const BOOK_ABBREVIATIONS: Record<string, string> = {
  'Gen': 'Genesis',
  'Ge': 'Genesis',
  'Gn': 'Genesis',
  'Exod': 'Exodus',
  'Ex': 'Exodus',
  'Exo': 'Exodus',
  'Lev': 'Leviticus',
  'Le': 'Leviticus',
  'Lv': 'Leviticus',
  'Num': 'Numbers',
  'Nu': 'Numbers',
  'Nm': 'Numbers',
  'Nb': 'Numbers',
  'Deut': 'Deuteronomy',
  'De': 'Deuteronomy',
  'Dt': 'Deuteronomy',
  'Josh': 'Joshua',
  'Jos': 'Joshua',
  'Jsh': 'Joshua',
  'Judg': 'Judges',
  'Jdg': 'Judges',
  'Jg': 'Judges',
  'Jdgs': 'Judges',
  'Rth': 'Ruth',
  'Ru': 'Ruth',
  '1Sam': '1 Samuel',
  '1Sa': '1 Samuel',
  '1Sm': '1 Samuel',
  '2Sam': '2 Samuel',
  '2Sa': '2 Samuel',
  '2Sm': '2 Samuel',
  '1Kgs': '1 Kings',
  '1Ki': '1 Kings',
  '2Kgs': '2 Kings',
  '2Ki': '2 Kings',
  '1Chron': '1 Chronicles',
  '1Chr': '1 Chronicles',
  '1Ch': '1 Chronicles',
  '2Chron': '2 Chronicles',
  '2Chr': '2 Chronicles',
  '2Ch': '2 Chronicles',
  'Ezr': 'Ezra',
  'Neh': 'Nehemiah',
  'Ne': 'Nehemiah',
  'Esth': 'Esther',
  'Est': 'Esther',
  'Jb': 'Job',
  'Ps': 'Psalms',
  'Psalm': 'Psalms',
  'Pslm': 'Psalms',
  'Psa': 'Psalms',
  'Psm': 'Psalms',
  'Prov': 'Proverbs',
  'Pr': 'Proverbs',
  'Prv': 'Proverbs',
  'Eccles': 'Ecclesiastes',
  'Eccle': 'Ecclesiastes',
  'Ecc': 'Ecclesiastes',
  'Ec': 'Ecclesiastes',
  'Song': 'Song of Solomon',
  'SOS': 'Song of Solomon',
  'SS': 'Song of Solomon',
  'Canticles': 'Song of Solomon',
  'Isa': 'Isaiah',
  'Is': 'Isaiah',
  'Jer': 'Jeremiah',
  'Je': 'Jeremiah',
  'Jr': 'Jeremiah',
  'Lam': 'Lamentations',
  'La': 'Lamentations',
  'Ezek': 'Ezekiel',
  'Eze': 'Ezekiel',
  'Ezk': 'Ezekiel',
  'Dan': 'Daniel',
  'Da': 'Daniel',
  'Dn': 'Daniel',
  'Hos': 'Hosea',
  'Ho': 'Hosea',
  'Jl': 'Joel',
  'Am': 'Amos',
  'Obad': 'Obadiah',
  'Ob': 'Obadiah',
  'Jnh': 'Jonah',
  'Jon': 'Jonah',
  'Mic': 'Micah',
  'Mc': 'Micah',
  'Nah': 'Nahum',
  'Na': 'Nahum',
  'Hab': 'Habakkuk',
  'Hb': 'Habakkuk',
  'Zeph': 'Zephaniah',
  'Zep': 'Zephaniah',
  'Zp': 'Zephaniah',
  'Hag': 'Haggai',
  'Hg': 'Haggai',
  'Zech': 'Zechariah',
  'Zec': 'Zechariah',
  'Zc': 'Zechariah',
  'Mal': 'Malachi',
  'Ml': 'Malachi',
  'Matt': 'Matthew',
  'Mt': 'Matthew',
  'Mrk': 'Mark',
  'Mk': 'Mark',
  'Mr': 'Mark',
  'Luk': 'Luke',
  'Lk': 'Luke',
  'Jhn': 'John',
  'Jn': 'John',
  'Act': 'Acts',
  'Ac': 'Acts',
  'Rom': 'Romans',
  'Ro': 'Romans',
  'Rm': 'Romans',
  '1Cor': '1 Corinthians',
  '1Co': '1 Corinthians',
  '2Cor': '2 Corinthians',
  '2Co': '2 Corinthians',
  'Gal': 'Galatians',
  'Ga': 'Galatians',
  'Ephes': 'Ephesians',
  'Eph': 'Ephesians',
  'Phil': 'Philippians',
  'Php': 'Philippians',
  'Pp': 'Philippians',
  'Col': 'Colossians',
  '1Thess': '1 Thessalonians',
  '1Th': '1 Thessalonians',
  '2Thess': '2 Thessalonians',
  '2Th': '2 Thessalonians',
  '1Tim': '1 Timothy',
  '1Ti': '1 Timothy',
  '2Tim': '2 Timothy',
  '2Ti': '2 Timothy',
  'Tit': 'Titus',
  'Philem': 'Philemon',
  'Phm': 'Philemon',
  'Pm': 'Philemon',
  'Heb': 'Hebrews',
  'Jas': 'James',
  'Jm': 'James',
  '1Pet': '1 Peter',
  '1Pe': '1 Peter',
  '1Pt': '1 Peter',
  '2Pet': '2 Peter',
  '2Pe': '2 Peter',
  '2Pt': '2 Peter',
  '1Jhn': '1 John',
  '1Jn': '1 John',
  '2Jhn': '2 John',
  '2Jn': '2 John',
  '3Jhn': '3 John',
  '3Jn': '3 John',
  'Jud': 'Jude',
  'Rev': 'Revelation',
  'Re': 'Revelation',
};

export interface Translation {
  id: string;
  name: string;
  abbreviation: string;
  isPremium: boolean;
  copyright?: string;
  copyrightUrl?: string;
}

export interface CopyrightInfo {
  notice: string;
  fullText: string;
  url?: string;
}

export const FREE_TRANSLATIONS: Translation[] = [
  {
    id: '9879dbb7cfe39e4d-01',
    name: 'World English Bible',
    abbreviation: 'WEB',
    isPremium: false,
    copyright: 'Public Domain',
    copyrightUrl: 'https://worldenglish.bible/'
  },
  {
    id: 'de4e12af7f28f599-02',
    name: 'King James Version (1769)',
    abbreviation: 'KJV',
    isPremium: false,
    copyright: 'Public Domain',
    copyrightUrl: undefined
  },
  {
    id: '06125adad2d5898a-01',
    name: 'American Standard Version',
    abbreviation: 'ASV',
    isPremium: false,
    copyright: 'Public Domain',
    copyrightUrl: undefined
  },
];

export const PREMIUM_TRANSLATIONS: Translation[] = [
  {
    id: '63097d2a0a2f7db3-01',
    name: 'New King James Version',
    abbreviation: 'NKJV',
    isPremium: true,
    copyright: 'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.',
    copyrightUrl: 'https://www.thomasnelson.com'
  },
  {
    id: 'b8ee27bcd1cae43a-01',
    name: 'New American Standard Bible (1995)',
    abbreviation: 'NASB',
    isPremium: true,
    copyright: 'Scripture quotations taken from the (NASB®) New American Standard Bible®, Copyright © 1960, 1971, 1977, 1995 by The Lockman Foundation. Used by permission. All rights reserved. www.lockman.org',
    copyrightUrl: 'https://www.lockman.org'
  },
  {
    id: 'a556c5305ee15c3f-01',
    name: 'Christian Standard Bible',
    abbreviation: 'CSB',
    isPremium: true,
    copyright: 'Scripture quotations marked CSB have been taken from the Christian Standard Bible®, Copyright © 2017 by Holman Bible Publishers. Used by permission. Christian Standard Bible® and CSB® are federally registered trademarks of Holman Bible Publishers.',
    copyrightUrl: 'https://csbible.com'
  },
];

export const ALL_TRANSLATIONS = [...FREE_TRANSLATIONS, ...PREMIUM_TRANSLATIONS];

export const AVAILABLE_TRANSLATIONS = ALL_TRANSLATIONS;

const TRANSLATION_ID_MAP: Record<string, string> = {
  'web': '9879dbb7cfe39e4d-01',
  'kjv': 'de4e12af7f28f599-02',
  'asv': '06125adad2d5898a-01',
  'nkjv': '63097d2a0a2f7db3-01',
  'nasb': 'b8ee27bcd1cae43a-01',
  'csb': 'a556c5305ee15c3f-01',
};

export const SCRIPTURE_REFERENCE_REGEX =
  /(?:(?:1|2|3)\s)?(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s\d+:\d+(?!-)/g;

function normalizeBookName(bookName: string): string {
  const trimmed = bookName.trim();

  const normalized = BOOK_ABBREVIATIONS[trimmed] || trimmed;

  const bookNames = Object.keys(BOOK_TO_API_CODE);
  const exactMatch = bookNames.find(name => name.toLowerCase() === normalized.toLowerCase());

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = bookNames.find(name =>
    name.toLowerCase().startsWith(normalized.toLowerCase()) ||
    normalized.toLowerCase().startsWith(name.toLowerCase())
  );

  return partialMatch || normalized;
}

function convertReferenceToVerseId(reference: string): { verseId: string; displayRef: string; book: string; chapter: number; verse: number; verseEnd?: number } | null {
  try {
    const match = reference.match(/^((?:\d\s)?[A-Za-z\s]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);

    if (!match) {
      return null;
    }

    const [, bookPart, chapterStr, verseStr, verseEndStr] = match;
    const bookName = normalizeBookName(bookPart);
    const bookCode = BOOK_TO_API_CODE[bookName];

    if (!bookCode) {
      console.error('Unknown book:', bookName);
      return null;
    }

    const chapter = parseInt(chapterStr);
    const verse = verseStr ? parseInt(verseStr) : 1;
    const verseEnd = verseEndStr ? parseInt(verseEndStr) : undefined;

    let verseId: string;
    let displayRef: string;

    if (verseEnd) {
      verseId = `${bookCode}.${chapter}.${verse}-${bookCode}.${chapter}.${verseEnd}`;
      displayRef = `${bookName} ${chapter}:${verse}-${verseEnd}`;
    } else if (verseStr) {
      verseId = `${bookCode}.${chapter}.${verse}`;
      displayRef = `${bookName} ${chapter}:${verse}`;
    } else {
      verseId = `${bookCode}.${chapter}`;
      displayRef = `${bookName} ${chapter}`;
    }

    return { verseId, displayRef, book: bookName, chapter, verse, verseEnd };
  } catch (error) {
    console.error('Error converting reference:', error);
    return null;
  }
}

export async function fetchVerse(
  reference: string,
  translation: string = 'kjv'
): Promise<BibleVerse | null> {
  try {
    const conversion = convertReferenceToVerseId(reference);

    if (!conversion) {
      console.error('[Bible API] Could not parse reference:', reference);
      return null;
    }

    const { verseId, displayRef, book, chapter, verse, verseEnd } = conversion;
    const translationLower = translation.toLowerCase();
    const bibleId = TRANSLATION_ID_MAP[translationLower];

    if (!bibleId) {
      console.error(`[Bible API] Translation not found: ${translationLower}. Available translations: ${Object.keys(TRANSLATION_ID_MAP).join(', ')}`);
      return null;
    }

    if (!BIBLE_API_KEY) {
      console.error('[Bible API] API key is not configured. Please set EXPO_PUBLIC_BIBLE_API_KEY in .env');
      return null;
    }

    const url = `${BIBLE_API_BASE}/bibles/${bibleId}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`;

    console.log(`[Bible API] Fetching: ${translation.toUpperCase()} - ${reference}`);

    const response = await fetch(url, {
      headers: {
        'api-key': BIBLE_API_KEY,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = await response.text();
      }

      console.error(`[Bible API] Failed to fetch ${translation.toUpperCase()}:`, errorMessage);

      if (response.status === 401) {
        console.error('[Bible API] Invalid or missing API key');
      } else if (response.status === 403) {
        console.error('[Bible API] Access denied. This translation may require a premium API subscription');
      } else if (response.status === 404) {
        console.error('[Bible API] Translation or verse not found');
      }

      return null;
    }

    const data = await response.json();

    if (!data.data || !data.data.content) {
      console.error(`[Bible API] Invalid response structure for ${translation.toUpperCase()}`);
      return null;
    }

    const text = data.data.content
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`[Bible API] Successfully fetched ${translation.toUpperCase()} - ${reference}`);

    return {
      reference: displayRef,
      text,
      translation: translation.toUpperCase(),
      book,
      chapter,
      verse,
      verseEnd,
    };
  } catch (error) {
    console.error(`[Bible API] Error fetching verse for ${translation.toUpperCase()}:`, error);
    return null;
  }
}

export async function fetchVerseMultipleTranslations(
  reference: string,
  translations: string[] = ['kjv', 'web']
): Promise<BibleVerse[]> {
  try {
    const results = await Promise.all(
      translations.map(translation => fetchVerse(reference, translation))
    );

    return results.filter((verse): verse is BibleVerse => verse !== null);
  } catch (error) {
    console.error('Error fetching multiple translations:', error);
    return [];
  }
}

export function parseScriptureReferences(text: string): string[] {
  const matches = text.match(SCRIPTURE_REFERENCE_REGEX);
  return matches ? [...new Set(matches)] : [];
}

export async function saveRecentVerse(verse: BibleVerse): Promise<void> {
  try {
    const recent = await getRecentVerses();

    const filtered = recent.filter(v => v.reference !== verse.reference);

    const updated: RecentVerse[] = [
      { ...verse, viewedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_RECENT_VERSES);

    await AsyncStorage.setItem(RECENT_VERSES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent verse:', error);
  }
}

export async function getRecentVerses(): Promise<RecentVerse[]> {
  try {
    const json = await AsyncStorage.getItem(RECENT_VERSES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error getting recent verses:', error);
    return [];
  }
}

export async function clearRecentVerses(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_VERSES_KEY);
  } catch (error) {
    console.error('Error clearing recent verses:', error);
  }
}

export function isValidReference(reference: string): boolean {
  const regex = /(?:(?:1|2|3)\s)?(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s\d+:\d+$/;
  return regex.test(reference) && !reference.includes('-');
}

export function isSingleVerse(reference: string): boolean {
  const singleVerseRegex = /^(?:(?:1|2|3)\s)?(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s\d+:\d+$/;
  return singleVerseRegex.test(reference) && !reference.includes('-');
}

export function formatVerseText(verse: BibleVerse): string {
  const verseRange = verse.verseEnd
    ? `${verse.verse}-${verse.verseEnd}`
    : `${verse.verse}`;

  return `${verse.book} ${verse.chapter}:${verseRange} (${verse.translation})\n\n${verse.text}`;
}

export function formatVerseForCopy(verse: BibleVerse): string {
  return `"${verse.text}"\n\n— ${verse.reference} (${verse.translation})`;
}

export function getAvailableTranslations(isPremium: boolean, isOnTrial: boolean = false): Translation[] {
  if (isPremium || isOnTrial) {
    return ALL_TRANSLATIONS;
  }
  return FREE_TRANSLATIONS;
}

export function canAccessTranslation(translationId: string, isPremium: boolean, isOnTrial: boolean = false): boolean {
  const translation = ALL_TRANSLATIONS.find(t => t.id === translationId);
  if (!translation) return false;

  if (translation.isPremium && !isPremium && !isOnTrial) {
    return false;
  }

  return true;
}

export function getCopyrightInfo(abbreviation: string): CopyrightInfo | null {
  const translation = ALL_TRANSLATIONS.find(
    t => t.abbreviation.toLowerCase() === abbreviation.toLowerCase()
  );

  if (!translation || !translation.copyright) {
    return null;
  }

  return {
    notice: translation.copyright,
    fullText: translation.copyright,
    url: translation.copyrightUrl,
  };
}

export function formatVerseWithCopyright(verse: BibleVerse): string {
  const copyright = getCopyrightInfo(verse.translation);
  const baseText = `"${verse.text}"\n\n— ${verse.reference} (${verse.translation})`;

  if (!copyright) {
    return `${baseText}\n\nScripture taken from API.Bible`;
  }

  if (copyright.notice === 'Public Domain') {
    return `${baseText}\n\nScripture taken from API.Bible`;
  }

  return `${baseText}\n\n${copyright.notice}\nScripture taken from API.Bible`;
}

export function getTranslationByAbbreviation(abbreviation: string): Translation | null {
  return ALL_TRANSLATIONS.find(
    t => t.abbreviation.toLowerCase() === abbreviation.toLowerCase()
  ) || null;
}

export async function prefetchAndCacheVerses(
  aiMessage: string,
  userId: string,
  translationIds: string[]
): Promise<void> {
  try {
    const references = parseScriptureReferences(aiMessage);

    if (references.length === 0) {
      return;
    }

    console.log(`🔥 Cache warming: Found ${references.length} verse references to prefetch`);

    const { getCachedVersesMultiple, saveCachedVerse } = await import('./database');

    for (const reference of references) {
      if (!isValidReference(reference)) {
        continue;
      }

      try {
        const cached = await getCachedVersesMultiple(userId, reference, translationIds);
        const cachedTranslationIds = cached.map(c => c.translation_id);
        const missingTranslationIds = translationIds.filter(
          id => !cachedTranslationIds.includes(id)
        );

        if (missingTranslationIds.length === 0) {
          console.log(`✅ All translations for "${reference}" already cached`);
          continue;
        }

        console.log(`⏳ Prefetching ${missingTranslationIds.length} translations for "${reference}"`);

        const missingAbbreviations = missingTranslationIds
          .map(id => ALL_TRANSLATIONS.find(t => t.id === id)?.abbreviation)
          .filter((abbr): abbr is string => !!abbr);

        if (missingAbbreviations.length === 0) {
          continue;
        }

        const verses = await fetchVerseMultipleTranslations(reference, missingAbbreviations);

        for (const verse of verses) {
          const translation = ALL_TRANSLATIONS.find(
            t => t.abbreviation.toLowerCase() === verse.translation.toLowerCase()
          );

          if (translation) {
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
            console.log(`💾 Cached: ${verse.reference} (${verse.translation})`);
          }
        }
      } catch (error) {
        console.warn(`Failed to prefetch "${reference}":`, error);
      }
    }

    console.log(`✨ Cache warming complete`);
  } catch (error) {
    console.error('Error in prefetchAndCacheVerses:', error);
  }
}
