/**
 * Simple and plain background.
 * Clean, distraction-free neutral background with smooth theme transitions.
 */

import { useTheme } from '../../context/ThemeContext';

export default function AnimatedBackground() {
  const { isDark } = useTheme();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        background: isDark
          ? 'linear-gradient(180deg, #0D0B09 0%, #110F0D 100%)'
          : 'linear-gradient(180deg, #F8F6F4 0%, #EFECE8 100%)',
        transition: 'background 0.4s ease',
      }}
    />
  );
}
