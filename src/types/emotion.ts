import type { EmotionCategory, EmotionIntensity, Timestamp } from './common';

export interface EmotionRecord {
  readonly id: string;
  readonly entryId: string;
  readonly category: EmotionCategory;
  readonly intensity: EmotionIntensity;
  readonly createdAt: Timestamp;
}

export interface EmotionInput {
  readonly category: EmotionCategory;
  readonly intensity: EmotionIntensity;
}
