import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuthContext } from '@/providers/auth-provider';

function validateEmail(email: string): string | null {
  if (email.trim().length === 0) {
    return 'Email is required';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length === 0) {
    return 'Password is required';
  }
  return null;
}

export default function SignInScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setGeneralError(null);

    const newEmailError = validateEmail(email);
    const newPasswordError = validatePassword(password);

    setEmailError(newEmailError);
    setPasswordError(newPasswordError);

    if (newEmailError ?? newPasswordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn({ email: email.trim(), password });
      router.replace('/(tabs)/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, signIn]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to sync your journal</Text>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isSubmitting}
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordError ? styles.inputError : null]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(null);
                }}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.text.tertiary}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isSubmitting}
              />
              <Pressable
                style={styles.togglePasswordButton}
                onPress={() => setIsPasswordVisible((prev) => !prev)}
              >
                <Text style={styles.togglePasswordText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed, isSubmitting && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.submitButtonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/sign-up')}>
          <Text style={styles.switchLink}>
            Don't have an account? <Text style={styles.switchLinkAccent}>Sign Up</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING['3xl'],
  },
  errorBanner: {
    backgroundColor: `${COLORS.status.error}1A`,
    borderRadius: RADII.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorBannerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.status.error,
  },
  form: {
    gap: SPACING.xl,
    marginBottom: SPACING['3xl'],
  },
  fieldGroup: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.status.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 64,
  },
  togglePasswordButton: {
    position: 'absolute',
    right: SPACING.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  togglePasswordText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  fieldError: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.status.error,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADII.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.background,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  switchLinkAccent: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
