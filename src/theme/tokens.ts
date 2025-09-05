/**
 * Design tokens for the WellieMD Patient Portal
 * Centralized design system values for consistent theming
 */

// Color palette
export const colors = {
  // Brand colors
  brand: {
    primary: '#2563eb', // Blue-600
    secondary: '#7c3aed', // Violet-600
    accent: '#059669', // Emerald-600
  },

  // Semantic colors
  semantic: {
    success: '#059669', // Emerald-600
    warning: '#d97706', // Amber-600
    error: '#dc2626', // Red-600
    info: '#2563eb', // Blue-600
  },

  // Neutral colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Medical/healthcare specific colors
  medical: {
    cardiology: '#ef4444', // Red-500
    neurology: '#8b5cf6', // Violet-500
    orthopedics: '#f59e0b', // Amber-500
    pediatrics: '#06b6d4', // Cyan-500
    dermatology: '#ec4899', // Pink-500
    psychiatry: '#6366f1', // Indigo-500
    general: '#10b981', // Emerald-500
  },

  // Status colors
  status: {
    scheduled: '#3b82f6', // Blue-500
    confirmed: '#10b981', // Emerald-500
    inProgress: '#f59e0b', // Amber-500
    completed: '#059669', // Emerald-600
    cancelled: '#ef4444', // Red-500
    noShow: '#6b7280', // Gray-500
  },

  // Priority colors
  priority: {
    low: '#10b981', // Emergreen-500
    normal: '#3b82f6', // Blue-500
    high: '#f59e0b', // Amber-500
    urgent: '#ef4444', // Red-500
  },
} as const;

// Typography scale
export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
  },

  // Font sizes (in rem)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Spacing scale (in rem)
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

// Border radius values
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Shadow values
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Animation durations and easings
export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Component-specific tokens
export const components = {
  // Button variants
  button: {
    height: {
      sm: spacing[8], // 32px
      md: spacing[10], // 40px
      lg: spacing[11], // 44px
      xl: spacing[12], // 48px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`, // 8px 12px
      md: `${spacing[2.5]} ${spacing[4]}`, // 10px 16px
      lg: `${spacing[3]} ${spacing[5]}`, // 12px 20px
      xl: `${spacing[3.5]} ${spacing[6]}`, // 14px 24px
    },
    borderRadius: borderRadius.md,
  },

  // Input variants
  input: {
    height: {
      sm: spacing[8], // 32px
      md: spacing[10], // 40px
      lg: spacing[11], // 44px
    },
    padding: `${spacing[2]} ${spacing[3]}`, // 8px 12px
    borderRadius: borderRadius.md,
  },

  // Card variants
  card: {
    padding: {
      sm: spacing[4], // 16px
      md: spacing[6], // 24px
      lg: spacing[8], // 32px
    },
    borderRadius: borderRadius.lg,
    shadow: boxShadow.sm,
  },

  // Modal variants
  modal: {
    borderRadius: borderRadius.xl,
    shadow: boxShadow['2xl'],
    backdropBlur: 'blur(8px)',
  },

  // Sidebar
  sidebar: {
    width: {
      collapsed: spacing[16], // 64px
      expanded: spacing[64], // 256px
    },
    borderRadius: borderRadius.none,
  },

  // Header
  header: {
    height: spacing[16], // 64px
    shadow: boxShadow.sm,
  },
} as const;

// Medical-specific design tokens
export const medical = {
  // Appointment status colors
  appointmentStatus: colors.status,
  
  // Priority indicators
  priority: colors.priority,
  
  // Specialty colors
  specialty: colors.medical,
  
  // Vital signs colors
  vitals: {
    normal: colors.semantic.success,
    warning: colors.semantic.warning,
    critical: colors.semantic.error,
  },
} as const;

// Dark mode color overrides
export const darkMode = {
  colors: {
    background: colors.neutral[900],
    foreground: colors.neutral[100],
    card: colors.neutral[800],
    cardForeground: colors.neutral[100],
    popover: colors.neutral[800],
    popoverForeground: colors.neutral[100],
    primary: colors.brand.primary,
    primaryForeground: colors.neutral[100],
    secondary: colors.neutral[700],
    secondaryForeground: colors.neutral[100],
    muted: colors.neutral[800],
    mutedForeground: colors.neutral[400],
    accent: colors.neutral[700],
    accentForeground: colors.neutral[100],
    destructive: colors.semantic.error,
    destructiveForeground: colors.neutral[100],
    border: colors.neutral[700],
    input: colors.neutral[700],
    ring: colors.brand.primary,
  },
} as const;

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  zIndex,
  animation,
  breakpoints,
  components,
  medical,
  darkMode,
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type BoxShadow = typeof boxShadow;
export type ZIndex = typeof zIndex;
export type Animation = typeof animation;
export type Breakpoints = typeof breakpoints;
export type Components = typeof components;
export type Medical = typeof medical;
export type DarkMode = typeof darkMode;
