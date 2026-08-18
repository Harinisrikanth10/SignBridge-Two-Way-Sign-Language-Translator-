/**
 * LandmarkClassifier.ts
 * ============================================================================
 * Language-Aware Real-Time Hand Landmark Classifier for MediaPipe Hands
 * 
 * MEDIAPIPE HAND LANDMARK MAP (21 3D Points per hand):
 *  0: Wrist
 *  1: Thumb CMC, 2: Thumb MCP, 3: Thumb IP, 4: Thumb Tip
 *  5: Index MCP, 6: Index PIP, 7: Index DIP, 8: Index Tip
 *  9: Middle MCP, 10: Middle PIP, 11: Middle DIP, 12: Middle Tip
 *  13: Ring MCP, 14: Ring PIP, 15: Ring DIP, 16: Ring Tip
 *  17: Pinky MCP, 18: Pinky PIP, 19: Pinky DIP, 20: Pinky Tip
 * ============================================================================
 */

import { MediaPipeLandmark, SignLanguage, RecognizedGesture } from '../types/sign';

export interface HandAnalysis {
  normalizedLandmarks: MediaPipeLandmark[];
  // Finger extensions array: [thumb, index, middle, ring, pinky]
  fingerStates: [boolean, boolean, boolean, boolean, boolean];
  // Angle flexions in degrees (0 = straight, 180 = fully bent)
  fingerAngles: [number, number, number, number, number];
  palmWidth: number;
}

export class LandmarkClassifier {

  /**
   * Normalize 21 3D hand keypoints:
   * 1. Translate wrist point (index 0) to origin (0, 0, 0).
   * 2. Scale coordinates by distance from wrist (0) to middle MCP (9) so gestures
   *    are invariant to hand size and camera distance.
   */
  public static normalizeHand(landmarks: MediaPipeLandmark[]): HandAnalysis | null {
    if (!landmarks || landmarks.length < 21) return null;

    const wrist = landmarks[0];

    // Step 1: Compute scale factor (palm size = distance from Wrist [0] to Middle MCP [9])
    const middleMcp = landmarks[9];
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    const dz = middleMcp.z - wrist.z;
    const palmSize = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    // Step 2: Translate and scale all 21 points relative to wrist
    const normalizedLandmarks: MediaPipeLandmark[] = landmarks.map(pt => ({
      x: (pt.x - wrist.x) / palmSize,
      y: (pt.y - wrist.y) / palmSize,
      z: (pt.z - wrist.z) / palmSize
    }));

    // Step 3: Analyze finger extension states (straight vs flexed)
    // Distance from wrist to tip vs distance from wrist to PIP joint
    const isIndexExtended = this.getEuclideanDistance(normalizedLandmarks[8], normalizedLandmarks[0]) >
                            this.getEuclideanDistance(normalizedLandmarks[6], normalizedLandmarks[0]) * 1.1;

    const isMiddleExtended = this.getEuclideanDistance(normalizedLandmarks[12], normalizedLandmarks[0]) >
                             this.getEuclideanDistance(normalizedLandmarks[10], normalizedLandmarks[0]) * 1.1;

    const isRingExtended = this.getEuclideanDistance(normalizedLandmarks[16], normalizedLandmarks[0]) >
                           this.getEuclideanDistance(normalizedLandmarks[14], normalizedLandmarks[0]) * 1.1;

    const isPinkyExtended = this.getEuclideanDistance(normalizedLandmarks[20], normalizedLandmarks[0]) >
                            this.getEuclideanDistance(normalizedLandmarks[18], normalizedLandmarks[0]) * 1.1;

    // Thumb extension: distance between Thumb Tip (4) and Pinky MCP (17)
    const thumbPinkyMcpDist = this.getEuclideanDistance(normalizedLandmarks[4], normalizedLandmarks[17]);
    const isThumbExtended = thumbPinkyMcpDist > 0.85;

    const fingerStates: [boolean, boolean, boolean, boolean, boolean] = [
      isThumbExtended,
      isIndexExtended,
      isMiddleExtended,
      isRingExtended,
      isPinkyExtended
    ];

    // Calculate approximate joint flexion angles (0 to 180 deg)
    const fingerAngles: [number, number, number, number, number] = [
      this.calculateAngle(normalizedLandmarks[1], normalizedLandmarks[2], normalizedLandmarks[4]),
      this.calculateAngle(normalizedLandmarks[5], normalizedLandmarks[6], normalizedLandmarks[8]),
      this.calculateAngle(normalizedLandmarks[9], normalizedLandmarks[10], normalizedLandmarks[12]),
      this.calculateAngle(normalizedLandmarks[13], normalizedLandmarks[14], normalizedLandmarks[16]),
      this.calculateAngle(normalizedLandmarks[17], normalizedLandmarks[18], normalizedLandmarks[20])
    ];

    return {
      normalizedLandmarks,
      fingerStates,
      fingerAngles,
      palmWidth: palmSize
    };
  }

  /**
   * Main Classification entry point for MediaPipe hand results.
   * Supports 1-hand and 2-hand gestures for both ASL and ISL.
   */
  public static classifyGesture(
    handsLandmarks: MediaPipeLandmark[][],
    language: SignLanguage
  ): RecognizedGesture | null {
    if (!handsLandmarks || handsLandmarks.length === 0) return null;

    const handCount = handsLandmarks.length as 1 | 2;
    const hand1Analysis = this.normalizeHand(handsLandmarks[0]);
    if (!hand1Analysis) return null;

    let hand2Analysis: HandAnalysis | null = null;
    if (handCount > 1 && handsLandmarks[1]) {
      hand2Analysis = this.normalizeHand(handsLandmarks[1]);
    }

    if (language === 'asl') {
      return this.classifyASLGesture(hand1Analysis, hand2Analysis, handCount);
    } else {
      return this.classifyISLGesture(hand1Analysis, hand2Analysis, handCount);
    }
  }

  /**
   * ASL Gesture Classification Rules (One-handed static signs & alphabet letters)
   */
  private static classifyASLGesture(
    h1: HandAnalysis,
    h2: HandAnalysis | null,
    handCount: 1 | 2
  ): RecognizedGesture | null {
    const [thumb, index, middle, ring, pinky] = h1.fingerStates;
    const lm = h1.normalizedLandmarks;

    // Distance metric helpers
    const dist8_4 = this.getEuclideanDistance(lm[8], lm[4]);  // Index tip to Thumb tip
    const dist12_4 = this.getEuclideanDistance(lm[12], lm[4]); // Middle tip to Thumb tip
    const dist8_12 = this.getEuclideanDistance(lm[8], lm[12]); // Index tip to Middle tip

    // 1. WORD SIGNS FIRST

    // HELLO / OPEN HAND (All 5 fingers extended spread apart)
    if (thumb && index && middle && ring && pinky) {
      return {
        name: 'HELLO',
        label: 'Hello / Open Hand',
        confidence: 0.94,
        language: 'asl',
        isFingerspelling: false,
        handCount: 1
      };
    }

    // I LOVE YOU (Thumb, Index, Pinky extended; Middle and Ring flexed)
    if (thumb && index && !middle && !ring && pinky) {
      return {
        name: 'I LOVE YOU',
        label: 'I Love You (ILY)',
        confidence: 0.96,
        language: 'asl',
        isFingerspelling: false,
        handCount: 1
      };
    }

    // THUMBS UP / YES (Thumb extended up, 4 fingers flexed into fist)
    if (thumb && !index && !middle && !ring && !pinky && lm[4].y < lm[2].y) {
      return {
        name: 'YES',
        label: 'Yes / Thumbs Up',
        confidence: 0.93,
        language: 'asl',
        isFingerspelling: false,
        handCount: 1
      };
    }

    // NO (Index & Middle extended forward tapping thumb tip)
    if (!ring && !pinky && index && middle && dist8_4 < 0.35 && dist12_4 < 0.35) {
      return {
        name: 'NO',
        label: 'No',
        confidence: 0.90,
        language: 'asl',
        isFingerspelling: false,
        handCount: 1
      };
    }

    // 2. ALPHABET FINGERSPELLING LETTERS

    // Letter L: Index up & Thumb out perpendicular
    if (thumb && index && !middle && !ring && !pinky) {
      return {
        name: 'L',
        label: 'Letter L',
        confidence: 0.95,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter V / Peace: Index & Middle extended up in V shape, spread apart
    if (!thumb && index && middle && !ring && !pinky && dist8_12 > 0.35) {
      return {
        name: 'V',
        label: 'Letter V',
        confidence: 0.94,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter U: Index & Middle extended up close together
    if (!thumb && index && middle && !ring && !pinky && dist8_12 <= 0.35) {
      return {
        name: 'U',
        label: 'Letter U',
        confidence: 0.91,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter W: Index, Middle, Ring extended up
    if (!thumb && index && middle && ring && !pinky) {
      return {
        name: 'W',
        label: 'Letter W',
        confidence: 0.93,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter Y: Thumb and Pinky extended out only
    if (thumb && !index && !middle && !ring && pinky) {
      return {
        name: 'Y',
        label: 'Letter Y',
        confidence: 0.94,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter I: Pinky extended up only
    if (!thumb && !index && !middle && !ring && pinky) {
      return {
        name: 'I',
        label: 'Letter I',
        confidence: 0.92,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter F: Index tip touches thumb tip, other 3 fingers extended up
    if (dist8_4 < 0.25 && middle && ring && pinky) {
      return {
        name: 'F',
        label: 'Letter F',
        confidence: 0.91,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter B: 4 fingers extended straight together, thumb tucked
    if (!thumb && index && middle && ring && pinky && dist8_12 < 0.3) {
      return {
        name: 'B',
        label: 'Letter B',
        confidence: 0.92,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter D: Index extended straight up, thumb touches tips of middle, ring, pinky
    if (!thumb && index && !middle && !ring && !pinky && dist12_4 < 0.35) {
      return {
        name: 'D',
        label: 'Letter D',
        confidence: 0.90,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter A: Fist with thumb straight up alongside index
    if (!index && !middle && !ring && !pinky && lm[4].y < lm[5].y) {
      return {
        name: 'A',
        label: 'Letter A',
        confidence: 0.89,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter S: Fist with thumb folded over fingers
    if (!thumb && !index && !middle && !ring && !pinky) {
      return {
        name: 'S',
        label: 'Letter S / Fist',
        confidence: 0.88,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    // Letter C: Curved hand
    const dist8_0 = this.getEuclideanDistance(lm[8], lm[0]);
    if (dist8_0 > 0.6 && dist8_0 < 1.1 && dist8_4 > 0.4 && dist8_4 < 0.8) {
      return {
        name: 'C',
        label: 'Letter C',
        confidence: 0.85,
        language: 'asl',
        isFingerspelling: true,
        handCount: 1
      };
    }

    return null;
  }

  /**
   * ISL Gesture Classification Rules (Includes two-handed signs & ISL alphabet)
   */
  private static classifyISLGesture(
    h1: HandAnalysis,
    h2: HandAnalysis | null,
    handCount: 1 | 2
  ): RecognizedGesture | null {
    const [t1, i1, m1, r1, p1] = h1.fingerStates;

    // 1. TWO-HANDED ISL SIGNS (When 2 hands are detected in camera frame)
    if (handCount === 2 && h2) {
      const [t2, i2, m2, r2, p2] = h2.fingerStates;
      const h1Wrist = h1.normalizedLandmarks[0];
      const h2Wrist = h2.normalizedLandmarks[0];

      // Distance between both wrists
      const interHandDist = this.getEuclideanDistance(h1Wrist, h2Wrist);

      // NAMASTE / HELLO / RESPECT: Both palms open with all fingers extended upward and close together
      if (i1 && m1 && r1 && p1 && i2 && m2 && r2 && p2) {
        return {
          name: 'NAMASTE',
          label: 'Namaste / Hello (ISL)',
          confidence: 0.96,
          language: 'isl',
          isFingerspelling: false,
          handCount: 2
        };
      }

      // ISL LETTER A (Two-handed): Left index pointing at tip of right thumb
      if (i1 && !m1 && !r1 && !p1 && t2 && !i2 && !m2 && !r2 && !p2) {
        return {
          name: 'A',
          label: 'ISL Letter A (2-Hands)',
          confidence: 0.91,
          language: 'isl',
          isFingerspelling: true,
          handCount: 2
        };
      }

      // ISL LETTER B (Two-handed): Both hands forming circles joined together
      if (t1 && i1 && t2 && i2 && !m1 && !m2) {
        return {
          name: 'B',
          label: 'ISL Letter B (2-Hands)',
          confidence: 0.90,
          language: 'isl',
          isFingerspelling: true,
          handCount: 2
        };
      }

      // ISL LETTER X (Two-handed): Cross both index fingers
      if (i1 && !m1 && !r1 && !p1 && i2 && !m2 && !r2 && !p2) {
        return {
          name: 'X',
          label: 'ISL Letter X (Crossed Indexes)',
          confidence: 0.89,
          language: 'isl',
          isFingerspelling: true,
          handCount: 2
        };
      }

      // ISL HELP: One hand fist resting on flat palm
      if ((!i1 && !m1 && !r1 && !p1 && i2 && m2 && r2 && p2) ||
          (i1 && m1 && r1 && p1 && !i2 && !m2 && !r2 && !p2)) {
        return {
          name: 'HELP',
          label: 'Help (ISL 2-Hands)',
          confidence: 0.93,
          language: 'isl',
          isFingerspelling: false,
          handCount: 2
        };
      }
    }

    // 2. SINGLE-HANDED ISL FALLBACK SIGNS

    // HELLO (Open single hand)
    if (t1 && i1 && m1 && r1 && p1) {
      return {
        name: 'HELLO',
        label: 'Hello (ISL Open Hand)',
        confidence: 0.90,
        language: 'isl',
        isFingerspelling: false,
        handCount: 1
      };
    }

    // YES (Fist nod)
    if (t1 && !i1 && !m1 && !r1 && !p1) {
      return {
        name: 'YES',
        label: 'Yes (ISL)',
        confidence: 0.89,
        language: 'isl',
        isFingerspelling: false,
        handCount: 1
      };
    }

    // PEACE (V sign)
    if (!t1 && i1 && m1 && !r1 && !p1) {
      return {
        name: 'PEACE',
        label: 'Peace / V Sign',
        confidence: 0.92,
        language: 'isl',
        isFingerspelling: false,
        handCount: 1
      };
    }

    return null;
  }

  /**
   * Calculate 3D Euclidean distance between two MediaPipe landmark points
   */
  private static getEuclideanDistance(pt1: MediaPipeLandmark, pt2: MediaPipeLandmark): number {
    const dx = pt1.x - pt2.x;
    const dy = pt1.y - pt2.y;
    const dz = pt1.z - pt2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Compute 3D joint angle in degrees formed by three points (A -> B -> C)
   */
  private static calculateAngle(a: MediaPipeLandmark, b: MediaPipeLandmark, c: MediaPipeLandmark): number {
    const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

    const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
    const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y + ab.z * ab.z);
    const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y + cb.z * cb.z);

    if (magAB * magCB === 0) return 0;
    const cosTheta = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
    return (Math.acos(cosTheta) * 180) / Math.PI;
  }
}
