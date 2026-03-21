import { useAuthContext } from '@/providers/auth-provider';
import type { AuthState } from '@/types/common';

interface UseAuthResult {
  readonly authState: AuthState;
  readonly isGuest: boolean;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly signUpWithEmail: (params: { email: string; password: string }) => Promise<void>;
  readonly signIn: (params: { email: string; password: string }) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly deleteAccount: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const { authState, signUpWithEmail, signIn, signOut, deleteAccount } = useAuthContext();

  return {
    authState,
    isGuest: authState.status === 'guest',
    isAuthenticated: authState.status === 'authenticated',
    isLoading: authState.status === 'loading',
    signUpWithEmail,
    signIn,
    signOut,
    deleteAccount,
  };
}
