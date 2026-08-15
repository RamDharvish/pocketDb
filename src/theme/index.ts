/**
 * PocketDB Brand Identity & Theme Tokens
 * Combines developer tooling aesthetics, modern high-craft finance, and privacy-first UI.
 */

export const theme = {
  brand: {
    name: 'PocketDB',
    tagline: 'Your finances. Your device. Your database.',
    shortDescription: 'Private, local-first finance tracking built for developers.',
  },
  colors: {
    // Primary: Cobalt Blue & Terminal Cyan
    primary: {
      light: '#2563EB', // Blue-600
      dark: '#38BDF8',  // Sky-400
      hover: '#1D4ED8',
    },
    primaryContainer: {
      light: '#EFF6FF', // Blue-50
      dark: '#0F172A',  // Slate-900
    },
    // Secondary: Obsidian & Deep Slate
    secondary: {
      light: '#0F172A',
      dark: '#F8FAFC',
    },
    // Accent / Terminal Code Highlight
    accent: {
      cyan: '#06B6D4',
      indigo: '#6366F1',
      emerald: '#10B981',
      amber: '#F59E0B',
    },
    // Surfaces
    surface: {
      light: '#FFFFFF',
      dark: '#111827', // Gray-900
      elevatedDark: '#1E293B', // Slate-800
    },
    background: {
      light: '#F8FAFC', // Slate-50
      dark: '#0B0F19',  // Deep Obsidian
    },
    // Semantics
    income: '#10B981', // Emerald 500
    incomeBg: 'rgba(16, 185, 129, 0.12)',
    expense: '#F43F5E', // Rose 500
    expenseBg: 'rgba(244, 63, 94, 0.12)',
    transfer: '#6366F1', // Indigo 500
    transferBg: 'rgba(99, 102, 241, 0.12)',
    warning: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',

    // Text hierarchy
    textPrimary: {
      light: '#0F172A',
      dark: '#F8FAFC',
    },
    textSecondary: {
      light: '#475569',
      dark: '#94A3B8',
    },
    textMuted: {
      light: '#94A3B8',
      dark: '#64748B',
    },

    // Borders & Dividers
    border: {
      light: '#E2E8F0',
      dark: '#1E293B',
      subtleDark: '#334155',
    },
  },
  radii: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    card: '0 2px 8px -2px rgb(0 0 0 / 0.08), 0 1px 4px -1px rgb(0 0 0 / 0.04)',
    glow: '0 0 20px -3px rgba(59, 130, 246, 0.25)',
    float: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
};

export type AppTheme = typeof theme;
