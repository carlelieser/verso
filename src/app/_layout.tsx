import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from '@/components/common/error-boundary';
import { COLORS } from '@/constants/theme';
import { AuthProvider, useAuthContext } from '@/providers/auth-provider';
import { DatabaseProvider } from '@/providers/database-provider';
import { SyncProvider } from '@/providers/sync-provider';
import { ThemeProvider } from '@/providers/theme-provider';

export { ErrorBoundary };

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const supabaseUrl =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function AppStack(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text.primary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="entry/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="entry/emotions"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="settings/reminders" options={{ headerShown: false }} />
      <Stack.Screen name="settings/export" options={{ headerShown: false }} />
      <Stack.Screen name="settings/appearance" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

/**
 * Wraps children with SyncProvider when auth is available.
 * Reads auth state from AuthProvider context.
 */
function SyncWrapper({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  const { authState } = useAuthContext();
  return <SyncProvider authState={authState}>{children}</SyncProvider>;
}

/**
 * Conditionally wraps the app tree with auth and sync providers.
 * When Supabase credentials are not configured, the app runs in guest-only
 * mode without auth or sync capabilities.
 */
function AppShell({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  if (!supabase) {
    return <>{children}</>;
  }

  return (
    <AuthProvider supabase={supabase}>
      <SyncWrapper>{children}</SyncWrapper>
    </AuthProvider>
  );
}

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={styles.root}>
        <DatabaseProvider>
          <AppShell>
            <AppStack />
          </AppShell>
        </DatabaseProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
