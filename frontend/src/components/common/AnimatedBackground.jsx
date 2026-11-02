/**
 * Precision Engineered Enterprise Background.
 * Subtle, architectural micro-grid with soft ambient radial fade.
 * Designed to feel grounded, calm, and 100% human-crafted.
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
        backgroundColor: 'var(--atmos-bg)',
        transition: 'background-color 0.25s ease',
        overflow: 'hidden',
      }}
    >
      {/* Subtle precision micro-dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: isDark
            ? 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)'
            : 'radial-gradient(rgba(15, 23, 42, 0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 25%, black 20%, transparent 85%)',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 25%, black 20%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
