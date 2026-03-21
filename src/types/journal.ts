import type { Timestamp } from './common';

export interface Journal {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly icon: string;
  readonly displayOrder: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface User {
  readonly id: string;
  readonly supabaseId: string | null;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly isGuest: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface UserSettings {
  readonly id: string;
  readonly userId: string;
  readonly hasCompletedOnboarding: boolean;
  readonly lastActiveJournalId: string | null;
  readonly updatedAt: Timestamp;
}

export interface Reminder {
  readonly id: string;
  readonly userId: string;
  readonly isEnabled: boolean;
  readonly hour: number;
  readonly minute: number;
  readonly updatedAt: Timestamp;
}
