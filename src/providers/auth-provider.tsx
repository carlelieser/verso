import type { SupabaseClient } from '@supabase/supabase-js';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthState } from '@/types/common';
import { createAuthService } from '@/services/auth-service';

interface EmailCredentials {
  readonly email: string;
  readonly password: string;
}

interface AuthContextValue {
  readonly authState: AuthState;
  readonly signUpWithEmail: (params: EmailCredentials) => Promise<void>;
  readonly signIn: (params: EmailCredentials) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  readonly supabase: SupabaseClient;
  readonly children: React.ReactNode;
}

export function AuthProvider({ supabase, children }: AuthProviderProps): React.JSX.Element {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const service = useMemo(() => createAuthService(supabase), [supabase]);

  useEffect(() => {
    service
      .getState()
      .then((state) => {
        setAuthState(state);
      })
      .catch(() => {
        setAuthState({ status: 'guest' });
      });
  }, [service]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthState({
          status: 'authenticated',
          userId: session.user.id,
          email: session.user.email ?? '',
        });
      } else {
        setAuthState({ status: 'guest' });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signUpWithEmail = useCallback(
    async (params: EmailCredentials): Promise<void> => {
      const state = await service.signUpWithEmail(params);
      setAuthState(state);
    },
    [service],
  );

  const signIn = useCallback(
    async (params: EmailCredentials): Promise<void> => {
      const state = await service.signIn(params);
      setAuthState(state);
    },
    [service],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await service.signOut();
    setAuthState({ status: 'guest' });
  }, [service]);

  const deleteAccount = useCallback(async (): Promise<void> => {
    await service.deleteAccount();
    setAuthState({ status: 'guest' });
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authState,
      signUpWithEmail,
      signIn,
      signOut,
      deleteAccount,
    }),
    [authState, signUpWithEmail, signIn, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
