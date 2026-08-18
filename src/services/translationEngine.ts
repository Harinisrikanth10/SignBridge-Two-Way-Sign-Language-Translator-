import {
  SignLanguage,
  LanguageDictionaryFile,
  LanguageFingerspellingFile,
  TranslationToken
} from '../types/sign';

class TranslationEngine {
  private cache: Record<string, { dictionary: LanguageDictionaryFile; fingerspelling: LanguageFingerspellingFile }> = {};

  /**
   * Load sign language dictionary and fingerspelling data files for a specific language
   */
  public async loadLanguageData(lang: SignLanguage): Promise<{ dictionary: LanguageDictionaryFile; fingerspelling: LanguageFingerspellingFile }> {
    if (this.cache[lang]) {
      return this.cache[lang];
    }

    try {
      const [dictRes, fsRes] = await Promise.all([
        fetch(`/data/signs/${lang}/dictionary.json`),
        fetch(`/data/signs/${lang}/fingerspelling.json`)
      ]);

      if (!dictRes.ok || !fsRes.ok) {
        throw new Error(`Failed to fetch sign language data for ${lang.toUpperCase()}`);
      }

      const dictionary: LanguageDictionaryFile = await dictRes.json();
      const fingerspelling: LanguageFingerspellingFile = await fsRes.json();

      this.cache[lang] = { dictionary, fingerspelling };
      return this.cache[lang];
    } catch (err) {
      console.error(`Error loading sign data for ${lang}:`, err);
      // Return fallback dummy data if fetch fails
      return this.getFallbackData(lang);
    }
  }

  /**
   * Convert plain text into an ordered sequence of sign video/image tokens
   */
  public async translateTextToSigns(text: string, lang: SignLanguage): Promise<TranslationToken[]> {
    const { dictionary, fingerspelling } = await this.loadLanguageData(lang);
    const cleanedText = text.trim().toLowerCase().replace(/[^\w\s]/gi, '');
    if (!cleanedText) return [];

    const tokens: TranslationToken[] = [];
    const dict = dictionary.dictionary;
    const fsDict = fingerspelling.alphabet;

    // Get multi-word phrase keys sorted by length (descending) so longest phrase matches first
    const phrases = Object.keys(dict)
      .filter(k => k.includes(' '))
      .sort((a, b) => b.length - a.length);

    let remainingText = cleanedText;
    let indexId = 0;

    while (remainingText.length > 0) {
      remainingText = remainingText.trimStart();
      if (!remainingText) break;

      let matchedPhrase = false;

      // 1. Try multi-word phrase matching
      for (const phrase of phrases) {
        if (remainingText.startsWith(phrase)) {
          const entry = dict[phrase];
          tokens.push({
            id: `token-${indexId++}`,
            type: 'word',
            token: phrase,
            label: entry.label,
            description: entry.description,
            filename: entry.filename,
            language: lang
          });

          remainingText = remainingText.slice(phrase.length);
          matchedPhrase = true;
          break;
        }
      }

      if (matchedPhrase) continue;

      // 2. Extract next single word
      const spaceIdx = remainingText.indexOf(' ');
      const currentWord = spaceIdx === -1 ? remainingText : remainingText.slice(0, spaceIdx);
      remainingText = spaceIdx === -1 ? '' : remainingText.slice(spaceIdx + 1);

      if (!currentWord) continue;

      // 3. Match single word in dictionary
      if (dict[currentWord]) {
        const entry = dict[currentWord];
        tokens.push({
          id: `token-${indexId++}`,
          type: 'word',
          token: currentWord,
          label: entry.label,
          description: entry.description,
          filename: entry.filename,
          language: lang
        });
      } else {
        // 4. Fallback to fingerspelling letter-by-letter
        const letters = currentWord.toUpperCase().split('');
        for (const letter of letters) {
          if (fsDict[letter]) {
            const fsEntry = fsDict[letter];
            tokens.push({
              id: `token-${indexId++}`,
              type: 'letter',
              token: letter,
              label: `Letter ${letter}`,
              description: fsEntry.description,
              filename: fsEntry.filename,
              language: lang,
              handsCount: fsEntry.hands
            });
          }
        }
      }
    }

    return tokens;
  }

  private getFallbackData(lang: SignLanguage) {
    return {
      dictionary: {
        language: lang.toUpperCase(),
        languageName: lang === 'asl' ? 'American Sign Language' : 'Indian Sign Language',
        totalWords: 0,
        dictionary: {}
      },
      fingerspelling: {
        language: lang.toUpperCase(),
        type: (lang === 'asl' ? 'one-handed' : 'two-handed') as any,
        alphabet: {}
      }
    };
  }
}

export const translationEngine = new TranslationEngine();
