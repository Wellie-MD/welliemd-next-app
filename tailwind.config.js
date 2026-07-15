/** @type {import('tailwindcss').Config} */
// Force Tailwind rebuild
import { designTokens } from './src/theme/tokens';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  safelist: [
    'bg-brand-primary',
    'bg-brand-secondary',
    'bg-brand-accent',
    'bg-brand-neutral',
    'text-brand-primary',
    'text-brand-secondary',
    'text-brand-accent',
    'text-brand-neutral',
    'border-brand-primary',
    'border-brand-secondary',
    'border-brand-accent',
    'border-brand-neutral',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Colors from design tokens
      colors: {
        // Brand colors
        brand: designTokens.colors.brand,

        // Semantic colors
        success: designTokens.colors.semantic.success,
        warning: designTokens.colors.semantic.warning,
        error: designTokens.colors.semantic.error,
        info: designTokens.colors.semantic.info,

        // Medical colors
        medical: designTokens.colors.medical,

        // Status colors
        status: designTokens.colors.status,

        // Priority colors
        priority: designTokens.colors.priority,

        // shadcn/ui color system
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ============================================
        // Dynamic Brand Colors (from BrandProvider)
        // ============================================
        // These colors are dynamically set by the BrandProvider
        // and can be used like: bg-brand-primary, text-brand-secondary
        'brand-primary': 'var(--brand-primary)',
        'brand-secondary': 'var(--brand-secondary)',
        'brand-accent': 'var(--brand-accent)',
        'brand-neutral': 'var(--brand-neutral)',

        // HSL format for opacity modifiers (e.g., bg-brand-primary-hsl/50)
        'brand-primary-hsl': 'hsl(var(--brand-primary-hsl))',
        'brand-secondary-hsl': 'hsl(var(--brand-secondary-hsl))',
        'brand-accent-hsl': 'hsl(var(--brand-accent-hsl))',
        'brand-neutral-hsl': 'hsl(var(--brand-neutral-hsl))',
      },

      // Typography from design tokens
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      lineHeight: designTokens.typography.lineHeight,
      letterSpacing: designTokens.typography.letterSpacing,

      // Spacing from design tokens
      spacing: designTokens.spacing,

      // Border radius from design tokens
      borderRadius: {
        ...designTokens.borderRadius,
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // Box shadow from design tokens
      boxShadow: designTokens.boxShadow,

      // Z-index from design tokens
      zIndex: designTokens.zIndex,

      // Animation from design tokens
      transitionDuration: designTokens.animation.duration,
      transitionTimingFunction: designTokens.animation.easing,

      // Breakpoints from design tokens
      screens: designTokens.breakpoints,

      // Custom animations
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.2s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.2s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },

      // Custom utilities
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },

      // Custom component heights
      height: {
        'header': designTokens.components.header.height,
        'sidebar-collapsed': designTokens.components.sidebar.width.collapsed,
        'sidebar-expanded': designTokens.components.sidebar.width.expanded,
      },

      // Custom component widths
      width: {
        'sidebar-collapsed': designTokens.components.sidebar.width.collapsed,
        'sidebar-expanded': designTokens.components.sidebar.width.expanded,
      },

      // Custom min/max heights
      minHeight: {
        'screen-header': 'calc(100vh - 4rem)', // 100vh - header height
      },

      // Custom backdrop blur
      backdropBlur: {
        xs: 'blur(2px)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    // Custom plugin for medical-specific utilities
    function ({ addUtilities, theme }) {
      const medicalUtilities = {
        '.status-scheduled': {
          backgroundColor: theme('colors.status.scheduled'),
          color: 'white',
        },
        '.status-confirmed': {
          backgroundColor: theme('colors.status.confirmed'),
          color: 'white',
        },
        '.status-in-progress': {
          backgroundColor: theme('colors.status.inProgress'),
          color: 'white',
        },
        '.status-completed': {
          backgroundColor: theme('colors.status.completed'),
          color: 'white',
        },
        '.status-cancelled': {
          backgroundColor: theme('colors.status.cancelled'),
          color: 'white',
        },
        '.status-no-show': {
          backgroundColor: theme('colors.status.noShow'),
          color: 'white',
        },
        '.priority-low': {
          borderLeftColor: theme('colors.priority.low'),
          borderLeftWidth: '4px',
        },
        '.priority-normal': {
          borderLeftColor: theme('colors.priority.normal'),
          borderLeftWidth: '4px',
        },
        '.priority-high': {
          borderLeftColor: theme('colors.priority.high'),
          borderLeftWidth: '4px',
        },
        '.priority-urgent': {
          borderLeftColor: theme('colors.priority.urgent'),
          borderLeftWidth: '4px',
        },
      };

      addUtilities(medicalUtilities);
    },
  ],
};