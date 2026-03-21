import { AuthError } from '@/errors/domain-errors';
import { createAuthService } from '@/services/auth-service';

function createMockSupabase(overrides: {
  signUpResult?: { data: unknown; error: unknown };
  signInResult?: { data: unknown; error: unknown };
  signOutResult?: { error: unknown };
  getUserResult?: { data: { user: unknown }; error?: unknown };
  getSessionResult?: { data: { session: unknown }; error: unknown };
} = {}): Record<string, unknown> {
  return {
    auth: {
      signUp: jest.fn().mockResolvedValue(
        overrides.signUpResult ?? { data: { user: null }, error: null },
      ),
      signInWithPassword: jest.fn().mockResolvedValue(
        overrides.signInResult ?? { data: { user: null }, error: null },
      ),
      signOut: jest.fn().mockResolvedValue(
        overrides.signOutResult ?? { error: null },
      ),
      getUser: jest.fn().mockResolvedValue(
        overrides.getUserResult ?? { data: { user: null } },
      ),
      getSession: jest.fn().mockResolvedValue(
        overrides.getSessionResult ?? { data: { session: null }, error: null },
      ),
    },
  };
}

const MOCK_USER = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('authService', () => {
  describe('signUpWithEmail', () => {
    it('should return authenticated state on success', async () => {
      const mockSupabase = createMockSupabase({
        signUpResult: { data: { user: MOCK_USER }, error: null },
      });
      const service = createAuthService(mockSupabase as never);

      const state = await service.signUpWithEmail({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(state).toEqual({
        status: 'authenticated',
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should throw AuthError on failure', async () => {
      const mockSupabase = createMockSupabase({
        signUpResult: { data: { user: null }, error: new Error('Email taken') },
      });
      const service = createAuthService(mockSupabase as never);

      await expect(
        service.signUpWithEmail({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(AuthError);
    });
  });

  describe('signIn', () => {
    it('should return authenticated state on success', async () => {
      const mockSupabase = createMockSupabase({
        signInResult: { data: { user: MOCK_USER }, error: null },
      });
      const service = createAuthService(mockSupabase as never);

      const state = await service.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(state).toEqual({
        status: 'authenticated',
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should throw AuthError on failure', async () => {
      const mockSupabase = createMockSupabase({
        signInResult: { data: { user: null }, error: new Error('Invalid credentials') },
      });
      const service = createAuthService(mockSupabase as never);

      await expect(
        service.signIn({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(AuthError);
    });
  });

  describe('signOut', () => {
    it('should call supabase.auth.signOut', async () => {
      const mockSupabase = createMockSupabase();
      const service = createAuthService(mockSupabase as never);

      await service.signOut();

      const signOutFn = (mockSupabase.auth as Record<string, jest.Mock>).signOut;
      expect(signOutFn).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthError on failure', async () => {
      const mockSupabase = createMockSupabase({
        signOutResult: { error: new Error('Network error') },
      });
      const service = createAuthService(mockSupabase as never);

      await expect(service.signOut()).rejects.toThrow(AuthError);
    });
  });

  describe('getState', () => {
    it('should return guest when no session exists', async () => {
      const mockSupabase = createMockSupabase({
        getSessionResult: { data: { session: null }, error: null },
      });
      const service = createAuthService(mockSupabase as never);

      const state = await service.getState();

      expect(state).toEqual({ status: 'guest' });
    });

    it('should return authenticated when session exists', async () => {
      const mockSupabase = createMockSupabase({
        getSessionResult: {
          data: { session: { user: MOCK_USER } },
          error: null,
        },
      });
      const service = createAuthService(mockSupabase as never);

      const state = await service.getState();

      expect(state).toEqual({
        status: 'authenticated',
        userId: 'user-123',
        email: 'test@example.com',
      });
    });
  });
});
