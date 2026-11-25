/**
 * Client-Side Reference & Passage Text Parser
 *
 * Extracts Bible book, chapter, and verse references from
 * live preacher speech transcripts and arbitrary passage texts.
 */

export const CANON_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew',
  'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
  '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

export const BOOK_ALIASES = {
  psalms: 'Psalm',
  psalm: 'Psalm',
  'song of songs': 'Song of Solomon',
  'song of solomon': 'Song of Solomon',
  revelations: 'Revelation',
  revelation: 'Revelation',
  'first samuel': '1 Samuel',
  '1st samuel': '1 Samuel',
  'second samuel': '2 Samuel',
  '2nd samuel': '2 Samuel',
  'first kings': '1 Kings',
  '1st kings': '1 Kings',
  'second kings': '2 Kings',
  '2nd kings': '2 Kings',
  'first chronicles': '1 Chronicles',
  'second chronicles': '2 Chronicles',
  'first corinthians': '1 Corinthians',
  '1st corinthians': '1 Corinthians',
  'second corinthians': '2 Corinthians',
  '2nd corinthians': '2 Corinthians',
  'first thessalonians': '1 Thessalonians',
  'second thessalonians': '2 Thessalonians',
  'first timothy': '1 Timothy',
  'second timothy': '2 Timothy',
  'first peter': '1 Peter',
  'second peter': '2 Peter',
  'first john': '1 John',
  'second john': '2 John',
  'third john': '3 John',
};

/**
 * Normalize spoken numbers (e.g. "first" to "1").
 */
export function normalizeSpokenText(text) {
  if (!text) return '';
  let str = text;
  str = str.replace(/\bfirst\b/gi, '1');
  str = str.replace(/\bsecond\b/gi, '2');
  str = str.replace(/\bthird\b/gi, '3');
  str = str.replace(/\b1st\b/gi, '1');
  str = str.replace(/\b2nd\b/gi, '2');
  str = str.replace(/\b3rd\b/gi, '3');
  return str;
}

/**
 * Get canonical book name.
 */
export function getCanonicalBook(book) {
  if (!book) return null;
  const lower = book.trim().toLowerCase();
  if (BOOK_ALIASES[lower]) return BOOK_ALIASES[lower];
  return CANON_BOOKS.find((b) => b.toLowerCase() === lower) || null;
}

/**
 * Parse single Bible reference from text.
 */
export function parseReference(text) {
  if (!text) return { detected: false };

  const normalized = normalizeSpokenText(text);

  // Check single-chapter books (Jude, Philemon, Obadiah, 2 John, 3 John)
  const singleChapterBooks = ['Jude', 'Philemon', 'Obadiah', '2 John', '3 John'];
  for (const b of singleChapterBooks) {
    const reg = new RegExp(`\\b(${b})\\s*(?:chapter\\s*1\\s*[:\\s]*)?(?:verses?\\s*|v\\.?\\s*)?(\\d+)(?:\\s*(?:to|through|-)\\s*(\\d+))?`, 'i');
    const m = normalized.match(reg);
    if (m) {
      const vStart = parseInt(m[2], 10);
      const vEnd = m[3] ? parseInt(m[3], 10) : null;
      const ref = vEnd && vEnd !== vStart ? `${b} 1:${vStart}-${vEnd}` : `${b} 1:${vStart}`;
      return {
        detected: true,
        reference: ref,
        book: b,
        chapter: 1,
        verseStart: vStart,
        verseEnd: vEnd,
        confidence: 0.96,
      };
    }
  }

  // Standard multi-chapter books
  for (const book of CANON_BOOKS) {
    const aliases = [book];
    if (book === 'Psalm') aliases.push('Psalms');
    if (book === 'Revelation') aliases.push('Revelations');

    const bookRegex = aliases.join('|');

    // 1. Explicit chapter & verse: Book chapter X verse Y
    const pat1 = new RegExp(`\\b(${bookRegex})\\s+chapter\\s+(\\d+)\\s*(?:verses?\\s*|v\\.?\\s*|:\\s*)(\\d+)(?:\\s*(?:to|through|-)\\s*(\\d+))?`, 'i');
    const m1 = normalized.match(pat1);
    if (m1) {
      const canonical = getCanonicalBook(m1[1]) || book;
      const ch = parseInt(m1[2], 10);
      const vs = parseInt(m1[3], 10);
      const ve = m1[4] ? parseInt(m1[4], 10) : null;
      const ref = ve && ve !== vs ? `${canonical} ${ch}:${vs}-${ve}` : `${canonical} ${ch}:${vs}`;
      return {
        detected: true,
        reference: ref,
        book: canonical,
        chapter: ch,
        verseStart: vs,
        verseEnd: ve,
        confidence: 0.98,
      };
    }

    // 2. Colon syntax: Book X:Y
    const pat2 = new RegExp(`\\b(${bookRegex})\\s*(?:chapter\\s*)?(\\d+)\\s*:\\s*(\\d+)(?:\\s*(?:to|through|-)\\s*(\\d+))?`, 'i');
    const m2 = normalized.match(pat2);
    if (m2) {
      const canonical = getCanonicalBook(m2[1]) || book;
      const ch = parseInt(m2[2], 10);
      const vs = parseInt(m2[3], 10);
      const ve = m2[4] ? parseInt(m2[4], 10) : null;
      const ref = ve && ve !== vs ? `${canonical} ${ch}:${vs}-${ve}` : `${canonical} ${ch}:${vs}`;
      return {
        detected: true,
        reference: ref,
        book: canonical,
        chapter: ch,
        verseStart: vs,
        verseEnd: ve,
        confidence: 0.95,
      };
    }
  }

  return { detected: false };
}

/**
 * Extract all references from a document or passage text.
 */
export function extractAllReferences(text) {
  if (!text) return [];
  const normalized = normalizeSpokenText(text);
  const results = [];
  const seen = new Set();

  for (const book of CANON_BOOKS) {
    const reg = new RegExp(`\\b(${book}|${book === 'Psalm' ? 'Psalms' : book})\\s*(\\d+)\\s*:\\s*(\\d+)(?:\\s*(?:to|through|-)\\s*(\\d+))?`, 'gi');
    let m;
    while ((m = reg.exec(normalized)) !== null) {
      const canonical = getCanonicalBook(m[1]) || book;
      const ch = parseInt(m[2], 10);
      const vs = parseInt(m[3], 10);
      const ve = m[4] ? parseInt(m[4], 10) : null;
      const ref = ve && ve !== vs ? `${canonical} ${ch}:${vs}-${ve}` : `${canonical} ${ch}:${vs}`;
      if (!seen.has(ref)) {
        seen.add(ref);
        results.push({ reference: ref, book: canonical, chapter: ch, verseStart: vs, verseEnd: ve });
      }
    }
  }

  return results;
}

/**
 * Clean passage text for stage projection.
 */
export function cleanPassageText(text) {
  if (!text) return '';
  return text
    .replace(/\[\d+\]/g, '')
    .replace(/^\d+[\.:\s]+/gm, '')
    .replace(/\[[a-zA-Z]\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
