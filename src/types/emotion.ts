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

export interface MoodTrend {
  readonly category: EmotionCategory;
  readonly avgIntensity: number;
  readonly frequency: number;
}

export interface EmotionFrequency {
  readonly category: EmotionCategory;
  readonly count: number;
  readonly percentage: number;
}

export interface DayMood {
  readonly date: string;
  readonly dominantEmotion: EmotionCategory | undefined;
  readonly intensity: number | undefined;
  readonly hasEntry: boolean;
}

export interface MoodDataPoint {
  readonly date: string;
  readonly category: EmotionCategory;
  readonly intensity: number;
}

export interface EmotionRanking {
  readonly category: EmotionCategory;
  readonly count: number;
  readonly avgIntensity: number;
  readonly rank: number;
}

export interface StreakData {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalEntries: number;
  readonly encouragingMessage: string;
}
