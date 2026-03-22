import { useMemo } from 'react';
import { useCSSVariable } from 'uniwind';

/**
 * CSS variable names used by the app, mapped to short keys for destructuring.
 * All properties are defined in global.css and guaranteed to resolve at runtime.
 */
const THEME_VARIABLES = {
  accent: '--color-accent',
  accentForeground: '--color-accent-foreground',
  background: '--color-background',
  border: '--color-border',
  foreground: '--color-foreground',
  muted: '--color-muted',
  surface: '--color-surface',
  editorFont: '--font-editor',
} as const;

type ThemeKey = keyof typeof THEME_VARIABLES;

const VARIABLE_NAMES = Object.values(THEME_VARIABLES);
const VARIABLE_KEYS = Object.keys(THEME_VARIABLES) as ThemeKey[];

interface ThemeColors {
  readonly accent: string;
  readonly accentForeground: string;
  readonly background: string;
  readonly border: string;
  readonly foreground: string;
  readonly muted: string;
  readonly surface: string;
  readonly editorFont: string;
}

/**
 * Type-safe hook that resolves all theme CSS variables into named strings.
 *
 * Eliminates `as string` casts at every call site by coalescing
 * undefined values to '' (CSS vars are always defined in global.css).
 */
export function useThemeColors(): ThemeColors {
  const values = useCSSVariable([...VARIABLE_NAMES]);

  return useMemo(() => {
    const result = {} as Record<ThemeKey, string>;
    for (let i = 0; i < VARIABLE_KEYS.length; i++) {
      const key = VARIABLE_KEYS[i];
      if (key !== undefined) {
        result[key] = (values[i] ?? '') as string;
      }
    }
    return result as ThemeColors;
  }, [values]);
}
