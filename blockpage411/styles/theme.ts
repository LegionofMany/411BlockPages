const theme = {
  colors: {
    primary: '#2563eb',
    secondary: '#06b6d4',
    accent: '#7c3aed',
    bgDark: '#070812',
    bgMid: '#0f1724',
    bgLight: '#111827',
    card: 'rgba(17,24,39,0.6)',
    cardBorder: 'rgba(124,58,237,0.12)',
    success: '#22c55e',
    warning: '#f59e42',
    danger: '#ef4444',
    info: '#38bdf8',
  },
  tokens: {
    '--color-primary': '#2563eb',
    '--color-secondary': '#06b6d4',
    '--color-accent': '#7c3aed',
    '--color-bg-dark': '#070812',
    '--color-bg-mid': '#0f1724',
    '--color-bg-light': '#111827',
    '--color-card': 'rgba(17,24,39,0.6)',
    '--color-card-border': 'rgba(124,58,237,0.12)',
    '--glass-blur': '8px',
    '--muted-text': '#9ca3af',
  },
} as const;

export default theme;
