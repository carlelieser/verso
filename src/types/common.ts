export type Timestamp = number;

export type EmotionCategory =
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'calm'
  | 'frustrated'
  | 'excited'
  | 'grateful'
  | 'angry'
  | 'hopeful'
  | 'tired';

export type EmotionIntensity = 1 | 2 | 3 | 4 | 5;

const EMOTION_CATEGORIES_SET: ReadonlySet<string> = new Set<EmotionCategory>([
  'happy', 'sad', 'anxious', 'calm', 'frustrated',
  'excited', 'grateful', 'angry', 'hopeful', 'tired',
]);

const EMOTION_INTENSITIES_SET: ReadonlySet<number> = new Set<EmotionIntensity>([1, 2, 3, 4, 5]);

export function isEmotionCategory(value: string): value is EmotionCategory {
  return EMOTION_CATEGORIES_SET.has(value);
}

export function isEmotionIntensity(value: number): value is EmotionIntensity {
  return EMOTION_INTENSITIES_SET.has(value);
}
