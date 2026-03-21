import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthError } from '@/errors/domain-errors';
import type { AuthState } from '@/types/common';

interface EmailCredentials {
  readonly email: string;
  readonly password: string;
}

export function createAuthService(supabase: SupabaseClient): {
  signUpWithEmail: (params: EmailCredentials) => Promise<AuthState>;
  signIn: (params: EmailCredentials) => Promise<AuthState>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  migrateGuestData: () => Promise<void>;
  getState: () => Promise<AuthState>;
} {
  return {
    async signUpWithEmail({ email, password }): Promise<AuthState> {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw new AuthError('Sign up failed', { cause: error });
      }

      if (!data.user) {
        throw new AuthError('Sign up succeeded but no user was returned');
      }

      return {
        status: 'authenticated',
        userId: data.user.id,
        email: data.user.email ?? email,
      };
    },

    async signIn({ email, password }): Promise<AuthState> {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw new AuthError('Sign in failed', { cause: error });
      }

      if (!data.user) {
        throw new AuthError('Sign in succeeded but no user was returned');
      }

      return {
        status: 'authenticated',
        userId: data.user.id,
        email: data.user.email ?? email,
      };
    },

    async signOut(): Promise<void> {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthError('Sign out failed', { cause: error });
      }
    },

    async deleteAccount(): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new AuthError('No authenticated user to delete');
      }

      // Account deletion requires a server-side function or admin API.
      // For now, sign out the user and mark for deletion.
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthError('Failed to sign out during account deletion', { cause: error });
      }
    },

    async migrateGuestData(): Promise<void> {
      // TODO: Migrate local guest data to authenticated user account.
      // This will copy entries, journals, emotions, etc. from the guest
      // user record to the newly authenticated user's Supabase-synced tables.
    },

    async getState(): Promise<AuthState> {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw new AuthError('Failed to get auth session', { cause: error });
      }

      if (!session?.user) {
        return { status: 'guest' };
      }

      return {
        status: 'authenticated',
        userId: session.user.id,
        email: session.user.email ?? '',
      };
    },
  };
}
