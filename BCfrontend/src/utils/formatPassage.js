/**
 * Format and Structure Bible Passages for UI Display and Projector
 */

import { cleanPassageText } from './referenceParser';

/**
 * Format a passage object for live display.
 */
export function formatPassageDisplay(passage, options = {}) {
  if (!passage) return { reference: '', text: '', verses: [] };

  const reference = passage.reference || '';
  const translation = (passage.translation || 'KJV').toUpperCase();
  const rawText = passage.text || '';
  const clean = cleanPassageText(rawText);

  const verses = (passage.verses || []).map((v) => ({
    verse: v.verse || 1,
    text: cleanPassageText(v.text || ''),
  }));

  return {
    reference,
    translation,
    cleanText: clean,
    verses,
    headerDisplay: `${reference} (${translation})`,
    totalVerses: verses.length,
  };
}

/**
 * Break long passages into multiple projector-friendly slides.
 */
export function splitPassageIntoSlides(verses, maxCharsPerSlide = 220) {
  if (!verses || !verses.length) return [];

  const slides = [];
  let currentSlideVerses = [];
  let currentLength = 0;

  verses.forEach((v) => {
    const verseLen = (v.text || '').length;
    if (currentLength + verseLen > maxCharsPerSlide && currentSlideVerses.length > 0) {
      slides.push({
        verses: currentSlideVerses,
        text: currentSlideVerses.map((item) => `[${item.verse}] ${item.text}`).join(' '),
      });
      currentSlideVerses = [v];
      currentLength = verseLen;
    } else {
      currentSlideVerses.push(v);
      currentLength += verseLen;
    }
  });

  if (currentSlideVerses.length > 0) {
    slides.push({
      verses: currentSlideVerses,
      text: currentSlideVerses.map((item) => `[${item.verse}] ${item.text}`).join(' '),
    });
  }

  return slides;
}
