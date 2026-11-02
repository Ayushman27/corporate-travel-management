/**
 * Simple, elegant corporate background.
 * Features a subtle micro-dot grid, soft luxury ambient spotlights,
 * and delicate minimalist flight-path trajectory watermarks.
 */

import { useTheme } from '../../context/ThemeContext';

export default function AnimatedBackground() {
  const { isDark } = useTheme();

  const dotColor = isDark ? 'rgba(196, 162, 93, 0.13)' : 'rgba(37, 99, 235, 0.14)';
  const baseBg = isDark ? '#0D0B09' : '#F8F9FB';
  const glowTop = isDark
    ? 'radial-gradient(ellipse 75% 45% at 50% -5%, rgba(196, 162, 93, 0.14) 0%, transparent 75%)'
    : 'radial-gradient(ellipse 75% 45% at 50% -5%, rgba(37, 99, 235, 0.10) 0%, transparent 75%)';
  const glowCorner = isDark
    ? 'radial-gradient(ellipse 55% 40% at 90% 90%, rgba(196, 162, 93, 0.06) 0%, transparent 60%)'
    : 'radial-gradient(ellipse 55% 40% at 90% 90%, rgba(37, 99, 235, 0.05) 0%, transparent 60%)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: baseBg,
        transition: 'background-color 0.4s ease',
        overflow: 'hidden',
      }}
    >
      {/* 1. Soft Luxury Ambient Spotlights */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `${glowTop}, ${glowCorner}`,
          pointerEvents: 'none',
        }}
      />

      {/* 2. Delicate Micro-Dot Grid with Vignette Mask */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 50%, black 40%, transparent 95%)',
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 50%, black 40%, transparent 95%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. Minimalist Flight Path Trajectory Watermarks */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: isDark ? 0.12 : 0.14,
          pointerEvents: 'none',
        }}
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="flightArcGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#C4A25D" : "#2563EB"} stopOpacity="0" />
            <stop offset="40%" stopColor={isDark ? "#C4A25D" : "#2563EB"} stopOpacity="0.85" />
            <stop offset="70%" stopColor={isDark ? "#E8C97A" : "#3B82F6"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isDark ? "#C4A25D" : "#2563EB"} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flightArcGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#C4A25D" : "#2563EB"} stopOpacity="0" />
            <stop offset="50%" stopColor={isDark ? "#C4A25D" : "#2563EB"} stopOpacity="0.75" />
            <stop offset="100%" stopColor={isDark ? "#C4A25D" : "#2563EB"} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Flight route 1 */}
        <path
          d="M -100 480 Q 450 200 950 420 T 1750 260"
          fill="none"
          stroke="url(#flightArcGrad1)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />

        {/* Flight route 2 */}
        <path
          d="M 120 780 Q 700 520 1200 680 T 1800 540"
          fill="none"
          stroke="url(#flightArcGrad2)"
          strokeWidth="1"
          strokeDasharray="5 7"
        />

        {/* Subtle waypoint nodes */}
        <circle cx="450" cy="275" r="3.5" fill={isDark ? "#C4A25D" : "#2563EB"} opacity="0.75" />
        <circle cx="450" cy="275" r="7" fill="none" stroke={isDark ? "#C4A25D" : "#2563EB"} strokeWidth="0.8" opacity="0.4" />
        
        <circle cx="950" cy="420" r="3" fill={isDark ? "#C4A25D" : "#2563EB"} opacity="0.6" />
        
        <circle cx="1200" cy="680" r="3.5" fill={isDark ? "#C4A25D" : "#2563EB"} opacity="0.7" />
        <circle cx="1200" cy="680" r="7" fill="none" stroke={isDark ? "#C4A25D" : "#2563EB"} strokeWidth="0.8" opacity="0.35" />
      </svg>
    </div>
  );
}
