export const COLORS = {
  background: '#1A1A1C',
  accent: '#C9A962',
  card: '#242426',
  surface: '#1E1E20',
  border: '#2A2A2C',
  text: {
    primary: '#F5F5F0',
    secondary: '#6E6E70',
    tertiary: '#4A4A4C',
  },
  status: {
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    heading: 'Cormorant',
    body: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const RADII = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;
