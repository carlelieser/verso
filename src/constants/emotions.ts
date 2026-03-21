import type { EmotionCategory } from '@/types/common';

export const EMOTION_CATEGORIES: readonly EmotionCategory[] = [
  'happy',
  'sad',
  'anxious',
  'calm',
  'frustrated',
  'excited',
  'grateful',
  'angry',
  'hopeful',
  'tired',
] as const;

export const EMOTION_EMOJI_MAP: Record<EmotionCategory, string> = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  calm: '😌',
  frustrated: '😤',
  excited: '🤩',
  grateful: '🙏',
  angry: '😠',
  hopeful: '🌟',
  tired: '😴',
};

export const EMOTION_COLOR_MAP: Record<EmotionCategory, string> = {
  happy: '#FFD700',
  sad: '#6B8FD4',
  anxious: '#E8A87C',
  calm: '#7EC8A8',
  frustrated: '#E57373',
  excited: '#FF8A65',
  grateful: '#CE93D8',
  angry: '#EF5350',
  hopeful: '#81D4FA',
  tired: '#90A4AE',
};

export const EMOTION_LABELS: Record<EmotionCategory, string> = {
  happy: 'Happy',
  sad: 'Sad',
  anxious: 'Anxious',
  calm: 'Calm',
  frustrated: 'Frustrated',
  excited: 'Excited',
  grateful: 'Grateful',
  angry: 'Angry',
  hopeful: 'Hopeful',
  tired: 'Tired',
};

export const INTENSITY_LABELS: Record<number, string> = {
  1: 'Barely',
  2: 'Slightly',
  3: 'Moderately',
  4: 'Very',
  5: 'Extremely',
};

export const SELECTED_EMOTION_COLOR = '#C9A962';
export const UNSELECTED_EMOTION_BACKGROUND = '#242426';
