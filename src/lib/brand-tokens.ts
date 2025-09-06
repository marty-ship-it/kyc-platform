export const brandTokens = {
  colors: {
    // Core brand colors - FirstAML inspired light theme
    bg: '#FFFFFF',
    elevated: '#F8FAFC',
    card: '#FFFFFF',
    foreground: '#374151',
    muted: '#6B7280',
    accent: '#0EA5E9',      // Professional blue
    accent600: '#0284C7',
    accent700: '#0369A1',
    warning: '#F97316',     // Clean orange
    danger: '#DC2626',      // Clean red
    
    // Extended palette - Clean professional grays
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  
  gradients: {
    glow: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.08) 0%, transparent 70%)',
    accent: 'linear-gradient(45deg, #0EA5E9 0%, #3B82F6 100%)',
    hero: 'radial-gradient(ellipse at top right, rgba(14, 165, 233, 0.05) 0%, transparent 50%)',
  },
  
  shadows: {
    card: '0 10px 30px rgba(0, 0, 0, 0.35)',
    button: '0 4px 14px rgba(0, 0, 0, 0.25)',
    focus: '0 0 0 3px rgba(89, 243, 195, 0.35)',
    elevation: '0 20px 40px rgba(0, 0, 0, 0.4)',
  },
  
  radius: {
    default: '1rem',
    card: '1rem',
    button: '0.75rem',
    input: '0.75rem',
  },
  
  fonts: {
    ui: 'Inter, sans-serif',
    heading: '"Plus Jakarta Sans", sans-serif',
  },
  
  transitions: {
    default: '200ms ease-out',
    slow: '300ms ease-out',
    fast: '150ms ease-out',
  },
}

export const cnBrand = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ')
}

export default brandTokens