export type Timestamp = number;

export type AuthState =
  | { readonly status: 'guest' }
  | { readonly status: 'authenticated'; readonly userId: string; readonly email: string }
  | { readonly status: 'loading' };

export type TranscriptionStatus = 'idle' | 'loading_model' | 'recording' | 'error';

export type ExportFormat = 'pdf' | 'markdown' | 'json';

export type AttachmentType = 'photo' | 'voice_memo' | 'file' | 'link';

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

export type TimeRange = 'week' | 'month' | '3months' | 'year';
