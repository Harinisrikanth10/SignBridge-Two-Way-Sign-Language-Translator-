/**
 * landmarkTemplates.ts
 * Reference 21 3D Hand Landmark templates for Word Signs & Manual Alphabets
 */
import { MediaPipeLandmark, SignLanguage } from '../types/sign';

export interface SignLandmarkTemplate {
  name: string;
  label: string;
  language: SignLanguage;
  handsCount: 1 | 2;
  hand1Landmarks: MediaPipeLandmark[];
  hand2Landmarks?: MediaPipeLandmark[];
}

// Keypoint helpers to generate synthetic normalized 21 points
function createHandSkeleton(
  thumbPos: { x: number; y: number },
  indexPos: { x: number; y: number; extended: boolean },
  middlePos: { x: number; y: number; extended: boolean },
  ringPos: { x: number; y: number; extended: boolean },
  pinkyPos: { x: number; y: number; extended: boolean },
  wrist: { x: number; y: number } = { x: 0, y: 0 }
): MediaPipeLandmark[] {
  const lm: MediaPipeLandmark[] = new Array(21);

  // 0: Wrist
  lm[0] = { x: wrist.x, y: wrist.y, z: 0 };

  // Thumb (1, 2, 3, 4)
  lm[1] = { x: wrist.x - 0.15, y: wrist.y - 0.1, z: 0 };
  lm[2] = { x: wrist.x - 0.25, y: wrist.y - 0.2, z: 0 };
  lm[3] = { x: thumbPos.x * 0.7, y: thumbPos.y * 0.7, z: 0 };
  lm[4] = { x: thumbPos.x, y: thumbPos.y, z: 0 };

  // Index (5, 6, 7, 8)
  lm[5] = { x: wrist.x - 0.1, y: wrist.y - 0.35, z: 0 };
  lm[6] = { x: wrist.x - 0.1, y: indexPos.extended ? wrist.y - 0.55 : wrist.y - 0.4, z: 0 };
  lm[7] = { x: wrist.x - 0.1, y: indexPos.extended ? wrist.y - 0.75 : wrist.y - 0.35, z: 0 };
  lm[8] = { x: indexPos.x, y: indexPos.y, z: 0 };

  // Middle (9, 10, 11, 12)
  lm[9] = { x: wrist.x, y: wrist.y - 0.38, z: 0 };
  lm[10] = { x: wrist.x, y: middlePos.extended ? wrist.y - 0.6 : wrist.y - 0.42, z: 0 };
  lm[11] = { x: wrist.x, y: middlePos.extended ? wrist.y - 0.8 : wrist.y - 0.36, z: 0 };
  lm[12] = { x: middlePos.x, y: middlePos.y, z: 0 };

  // Ring (13, 14, 15, 16)
  lm[13] = { x: wrist.x + 0.1, y: wrist.y - 0.35, z: 0 };
  lm[14] = { x: wrist.x + 0.1, y: ringPos.extended ? wrist.y - 0.55 : wrist.y - 0.4, z: 0 };
  lm[15] = { x: wrist.x + 0.1, y: ringPos.extended ? wrist.y - 0.75 : wrist.y - 0.35, z: 0 };
  lm[16] = { x: ringPos.x, y: ringPos.y, z: 0 };

  // Pinky (17, 18, 19, 20)
  lm[17] = { x: wrist.x + 0.18, y: wrist.y - 0.3, z: 0 };
  lm[18] = { x: wrist.x + 0.2, y: pinkyPos.extended ? wrist.y - 0.45 : wrist.y - 0.35, z: 0 };
  lm[19] = { x: wrist.x + 0.22, y: pinkyPos.extended ? wrist.y - 0.65 : wrist.y - 0.32, z: 0 };
  lm[20] = { x: pinkyPos.x, y: pinkyPos.y, z: 0 };

  return lm;
}

// Templates Registry
const templates: Record<string, SignLandmarkTemplate> = {
  // OPEN HAND / HELLO
  'HELLO': {
    name: 'HELLO',
    label: 'Hello / Open Hand',
    language: 'asl',
    handsCount: 1,
    hand1Landmarks: createHandSkeleton(
      { x: -0.4, y: -0.5 },
      { x: -0.15, y: -0.95, extended: true },
      { x: 0, y: -1.0, extended: true },
      { x: 0.15, y: -0.95, extended: true },
      { x: 0.3, y: -0.85, extended: true }
    )
  },

  // I LOVE YOU (ILY)
  'I LOVE YOU': {
    name: 'I LOVE YOU',
    label: 'I Love You (ILY)',
    language: 'asl',
    handsCount: 1,
    hand1Landmarks: createHandSkeleton(
      { x: -0.5, y: -0.4 },
      { x: -0.2, y: -0.95, extended: true },
      { x: 0, y: -0.3, extended: false },
      { x: 0.1, y: -0.3, extended: false },
      { x: 0.35, y: -0.85, extended: true }
    )
  },

  // THUMBS UP / YES
  'YES': {
    name: 'YES',
    label: 'Yes / Thumbs Up',
    language: 'asl',
    handsCount: 1,
    hand1Landmarks: createHandSkeleton(
      { x: -0.3, y: -0.85 },
      { x: -0.1, y: -0.3, extended: false },
      { x: 0, y: -0.3, extended: false },
      { x: 0.1, y: -0.3, extended: false },
      { x: 0.2, y: -0.3, extended: false }
    )
  },

  // LETTER L
  'L': {
    name: 'L',
    label: 'Letter L',
    language: 'asl',
    handsCount: 1,
    hand1Landmarks: createHandSkeleton(
      { x: -0.55, y: -0.25 },
      { x: -0.1, y: -0.95, extended: true },
      { x: 0, y: -0.3, extended: false },
      { x: 0.1, y: -0.3, extended: false },
      { x: 0.2, y: -0.3, extended: false }
    )
  },

  // LETTER V / PEACE
  'V': {
    name: 'V',
    label: 'Letter V / Peace',
    language: 'asl',
    handsCount: 1,
    hand1Landmarks: createHandSkeleton(
      { x: -0.2, y: -0.3 },
      { x: -0.3, y: -0.95, extended: true },
      { x: 0.2, y: -0.95, extended: true },
      { x: 0.1, y: -0.3, extended: false },
      { x: 0.2, y: -0.3, extended: false }
    )
  },

  // LETTER W
  'W': {
    name: 'W',
    label: 'Letter W',
    language: 'asl',
    handsCount: 1,
    hand1Landmarks: createHandSkeleton(
      { x: -0.2, y: -0.3 },
      { x: -0.35, y: -0.95, extended: true },
      { x: 0, y: -1.0, extended: true },
      { x: 0.35, y: -0.95, extended: true },
      { x: 0.2, y: -0.3, extended: false }
    )
  },

  // LETTER Y
  'Y': {
    name: 'Y',
    label: 'Letter Y',
    language: 'asl',
    handsCount: 1,
    hand1Landmarks: createHandSkeleton(
      { x: -0.55, y: -0.3 },
      { x: -0.1, y: -0.3, extended: false },
      { x: 0, y: -0.3, extended: false },
      { x: 0.1, y: -0.3, extended: false },
      { x: 0.45, y: -0.85, extended: true }
    )
  },

  // ISL NAMASTE (Two Handed)
  'NAMASTE': {
    name: 'NAMASTE',
    label: 'Namaste / Respect (ISL)',
    language: 'isl',
    handsCount: 2,
    hand1Landmarks: createHandSkeleton(
      { x: -0.3, y: -0.5 },
      { x: -0.1, y: -0.95, extended: true },
      { x: 0, y: -1.0, extended: true },
      { x: 0.1, y: -0.95, extended: true },
      { x: 0.2, y: -0.85, extended: true },
      { x: -0.1, y: 0 }
    ),
    hand2Landmarks: createHandSkeleton(
      { x: 0.3, y: -0.5 },
      { x: 0.1, y: -0.95, extended: true },
      { x: 0, y: -1.0, extended: true },
      { x: -0.1, y: -0.95, extended: true },
      { x: -0.2, y: -0.85, extended: true },
      { x: 0.1, y: 0 }
    )
  }
};

export class LandmarkTemplatesService {
  public static getTemplate(token: string): SignLandmarkTemplate | null {
    const key = token.toUpperCase().trim();
    if (templates[key]) return templates[key];

    // Fallback: Default Open Hand or Letter L skeleton
    return templates['HELLO'];
  }
}
