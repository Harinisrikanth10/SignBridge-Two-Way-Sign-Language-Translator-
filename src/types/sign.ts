export type SignLanguage = 'asl' | 'isl';

export interface DictionaryEntry {
  filename: string;
  label: string;
  category: string;
  description: string;
}

export interface FingerspellingEntry {
  filename: string;
  hands: 1 | 2;
  description: string;
}

export interface LanguageDictionaryFile {
  language: string;
  languageName: string;
  totalWords: number;
  dictionary: Record<string, DictionaryEntry>;
}

export interface LanguageFingerspellingFile {
  language: string;
  type: 'one-handed' | 'two-handed';
  alphabet: Record<string, FingerspellingEntry>;
}

export interface TranslationToken {
  id: string;
  type: 'word' | 'letter' | 'space';
  token: string;
  label: string;
  description: string;
  filename: string;
  language: SignLanguage;
  handsCount?: 1 | 2;
}

export interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
}

export type HandLandmarkArray = MediaPipeLandmark[];

export interface RecognizedGesture {
  name: string;
  label: string;
  confidence: number;
  language: SignLanguage;
  isFingerspelling: boolean;
  handCount: 1 | 2;
}

export interface GestureTemplate {
  name: string;
  label: string;
  language: SignLanguage;
  handCount: 1 | 2;
  isFingerspelling: boolean;
  // Normalized 21 keypoints for reference hand 1 (and hand 2 if two-handed)
  landmarksHand1: MediaPipeLandmark[];
  landmarksHand2?: MediaPipeLandmark[];
  // Finger extension requirements: [thumb, index, middle, ring, pinky] (true = extended, false = flexed)
  fingerExtensionsHand1?: boolean[];
  fingerExtensionsHand2?: boolean[];
}
