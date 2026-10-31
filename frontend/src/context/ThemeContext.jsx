import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Light tokens ───────────────────────────────────────────────────────────────
export const LIGHT = {
  isDark: false,
  bg: '#F4F2F0',
  glass: 'rgba(255,255,255,0.60)',
  glassBorder: 'rgba(196,162,93,0.18)',
  surface: 'rgba(255,255,255,0.80)',
  navBg: 'rgba(244,242,240,0.82)',
  navBgScrolled: 'rgba(244,242,240,0.96)',
  sidebarBg: 'rgba(244,242,240,0.82)',
  sidebarBorder: 'rgba(196,162,93,0.15)',
  text: '#2C2B29',
  text2: '#6B6760',
  muted: '#A8A4A0',
  inputBg: 'rgba(255,255,255,0.65)',
  inputBorder: 'rgba(196,162,93,0.22)',
  rowHover: 'rgba(196,162,93,0.04)',
  rowBorder: 'rgba(196,162,93,0.08)',
  cardShadow: '0 4px 20px rgba(44,43,41,0.06)',
  bigShadow: '0 24px 64px rgba(44,43,41,0.10)',
  msgBg: 'rgba(255,255,255,0.80)',
  msgBorder: 'rgba(196,162,93,0.14)',
  goldBg: 'rgba(196,162,93,0.10)',
  goldBorder: 'rgba(196,162,93,0.25)',
  purposeBg: 'rgba(196,162,93,0.06)',
  purposeBorder: 'rgba(196,162,93,0.12)',
  dropdownBg: 'rgba(255,255,255,0.96)',
  dropdownBorder: 'rgba(196,162,93,0.2)',
  selectBg: 'rgba(255,255,255,0.55)',
  badgeBg: 'rgba(196,162,93,0.10)',
  badgeColor: '#8B6914',
  logBg: 'rgba(196,162,93,0.08)',
  logColor: '#8B6914',
  greenBg: 'rgba(39,174,96,0.07)',
  greenBorder: 'rgba(39,174,96,0.22)',
  redBg: 'rgba(192,57,43,0.06)',
  redBorder: 'rgba(192,57,43,0.18)',
  tagBg: 'rgba(196,162,93,0.08)',
  headerBorder: 'rgba(196,162,93,0.12)',
};

// ── Dark tokens ────────────────────────────────────────────────────────────────
export const DARK = {
  isDark: true,
  bg: '#0D0B09',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(196,162,93,0.20)',
  surface: 'rgba(255,255,255,0.07)',
  navBg: 'rgba(8,6,4,0.90)',
  navBgScrolled: 'rgba(6,5,3,0.97)',
  sidebarBg: 'rgba(8,6,4,0.90)',
  sidebarBorder: 'rgba(196,162,93,0.18)',
  text: '#E8E4DE',
  text2: '#B0A898',
  muted: 'rgba(232,228,222,0.45)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(196,162,93,0.30)',
  rowHover: 'rgba(196,162,93,0.08)',
  rowBorder: 'rgba(255,255,255,0.06)',
  cardShadow: '0 4px 24px rgba(0,0,0,0.40)',
  bigShadow: '0 24px 64px rgba(0,0,0,0.50)',
  msgBg: 'rgba(255,255,255,0.05)',
  msgBorder: 'rgba(255,255,255,0.08)',
  goldBg: 'rgba(196,162,93,0.12)',
  goldBorder: 'rgba(196,162,93,0.30)',
  purposeBg: 'rgba(196,162,93,0.08)',
  purposeBorder: 'rgba(196,162,93,0.18)',
  dropdownBg: 'rgba(10,8,5,0.98)',
  dropdownBorder: 'rgba(196,162,93,0.25)',
  selectBg: 'rgba(255,255,255,0.06)',
  badgeBg: 'rgba(196,162,93,0.14)',
  badgeColor: '#D4A84C',
  logBg: 'rgba(196,162,93,0.12)',
  logColor: '#D4A84C',
  greenBg: 'rgba(39,174,96,0.10)',
  greenBorder: 'rgba(39,174,96,0.25)',
  redBg: 'rgba(192,57,43,0.10)',
  redBorder: 'rgba(192,57,43,0.25)',
  tagBg: 'rgba(255,255,255,0.07)',
  headerBorder: 'rgba(255,255,255,0.07)',
};

// ── Style helpers (use inside components) ──────────────────────────────────────
export const makeGlass = (t, extra = {}) => ({
  background: t.glass,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${t.glassBorder}`,
  borderRadius: '1.2rem',
  boxShadow: t.cardShadow,
  ...extra,
});

export const makeInput = (t, extra = {}) => ({
  width: '100%',
  padding: '0.65rem 0.9rem',
  borderRadius: '0.65rem',
  border: `1px solid ${t.inputBorder}`,
  background: t.inputBg,
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.8rem',
  color: t.text,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  ...extra,
});

export const makeLabel = (t, extra = {}) => ({
  display: 'block',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: t.muted,
  marginBottom: '0.4rem',
  ...extra,
});

// ── Context ────────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('ctm-theme') || 'dark'
  );

  useEffect(() => {
    localStorage.setItem('ctm-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme(th => (th === 'dark' ? 'light' : 'dark')),
    []
  );

  const t = theme === 'dark' ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, t, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
