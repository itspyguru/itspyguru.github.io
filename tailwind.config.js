import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // accent family → CSS variables (theme-switchable, alpha-aware)
        'primary-fixed-dim': 'rgb(var(--accent-rgb) / <alpha-value>)',
        'surface-tint': 'rgb(var(--accent-rgb) / <alpha-value>)',
        'primary-container': 'rgb(var(--accent-bright-rgb) / <alpha-value>)',
        'primary-fixed': 'rgb(var(--accent-bright-rgb) / <alpha-value>)',
        // static palette (ported from the monolith)
        'on-error': '#690005', 'surface-container-lowest': '#0e0e0e',
        'on-secondary-fixed-variant': '#93000c', 'surface-dim': '#131313',
        'tertiary-fixed-dim': '#fbbc00', 'on-error-container': '#ffdad6',
        'error': '#ffb4ab', 'inverse-on-surface': '#313030',
        'on-background': '#e5e2e1', 'on-tertiary-container': '#7c5c00',
        'inverse-surface': '#e5e2e1', 'on-tertiary-fixed-variant': '#5c4300',
        'on-primary': '#003907', 'background': '#131313',
        'secondary-fixed-dim': '#ffb4ab', 'on-secondary-fixed': '#410002',
        'surface-container': '#201f1f', 'surface-container-high': '#2a2a2a',
        'secondary-fixed': '#ffdad6', 'secondary-container': '#d30017',
        'outline-variant': '#3b4b37', 'secondary': '#ffb4ab', 'outline': '#84967e',
        'surface-container-highest': '#353534', 'on-secondary': '#690006',
        'surface-bright': '#3a3939', 'tertiary': '#fff8f3', 'error-container': '#93000a',
        'inverse-primary': '#006e16', 'tertiary-fixed': '#ffdfa0',
        'on-secondary-container': '#ffe2de', 'surface': '#131313',
        'on-primary-fixed': '#002203', 'primary': '#ebffe2',
        'surface-variant': '#353534', 'on-surface': '#e5e2e1',
        'on-surface-variant': '#b9ccb2', 'on-tertiary': '#402d00',
        'tertiary-container': '#ffd889', 'surface-container-low': '#1c1b1b',
        'on-tertiary-fixed': '#261a00', 'on-primary-fixed-variant': '#00530e',
        'on-primary-container': '#007117',
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      spacing: { 'margin-page': '24px', gutter: '16px', unit: '4px', 'panel-padding': '12px' },
      fontFamily: {
        'headline-md': ['Fira Sans'],
        'display-lg': ['Fira Sans'],
        'data-label': ['var(--mono)', 'JetBrains Mono', 'monospace'],
        'body-sm': ['var(--mono)', 'JetBrains Mono', 'monospace'],
        'terminal-code': ['var(--mono)', 'JetBrains Mono', 'monospace'],
        'terminal-bold': ['var(--mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'data-label': ['11px', { lineHeight: '16px', letterSpacing: '0.1em', fontWeight: '500' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'terminal-code': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'terminal-bold': ['14px', { lineHeight: '20px', fontWeight: '700' }],
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '0.05em', fontWeight: '700' }],
      },
    },
  },
  plugins: [forms],
}
