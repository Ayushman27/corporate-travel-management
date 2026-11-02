/**
 * Atmos Luxury — Waving Character
 * Minimalist vector figure that slides in, waves "Hi", then idles.
 */

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

const ease = [0.25, 1, 0.5, 1];

export default function WavingCharacter() {
  const armCtrl  = useAnimation();
  const bodyCtrl = useAnimation();
  const [bubble,  setBubble]  = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // 1. Slide in + wave sequence
    const sequence = async () => {
      // Wave 3× then idle
      for (let i = 0; i < 3; i++) {
        await armCtrl.start({ rotate: -35, transition: { duration: 0.3, ease } });
        await armCtrl.start({ rotate:  10, transition: { duration: 0.25, ease } });
      }
      await armCtrl.start({ rotate: 0, transition: { duration: 0.4, ease } });

      // Hide bubble after 3.5 s
      setTimeout(() => setBubble(false), 3500);

      // Idle bob
      bodyCtrl.start({
        y: [0, -4, 0],
        transition: { duration: 2.4, ease: 'easeInOut', repeat: Infinity }
      });
    };
    sequence();
  }, [armCtrl, bodyCtrl]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease, delay: 0.6 }}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.5rem',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Speech bubble */}
      {bubble && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.4, ease }}
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(196,162,93,0.3)',
            borderRadius: '1rem 1rem 0 1rem',
            padding: '0.5rem 0.85rem',
            boxShadow: '0 8px 24px rgba(44,43,41,0.08)',
            fontSize: '0.78rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            color: '#2C2B29',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            marginBottom: '0.25rem',
          }}
        >
          👋 Hi, I'm your travel guide!
        </motion.div>
      )}

      {/* Character SVG */}
      <motion.div animate={bodyCtrl}>
        <svg width="64" height="96" viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <circle cx="32" cy="18" r="12" fill="#C4A25D" opacity="0.9"/>
          {/* Face */}
          <circle cx="28" cy="16" r="1.5" fill="#2C2B29"/>
          <circle cx="36" cy="16" r="1.5" fill="#2C2B29"/>
          <path d="M27 21 Q32 25 37 21" stroke="#2C2B29" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

          {/* Body */}
          <rect x="22" y="30" width="20" height="26" rx="6" fill="#C4A25D" opacity="0.85"/>

          {/* Left arm (static) */}
          <rect x="8" y="32" width="14" height="7" rx="3.5" fill="#C4A25D" opacity="0.8" transform="rotate(10 8 32)"/>

          {/* Right arm (waving) */}
          <motion.g
            animate={armCtrl}
            style={{ originX: '42px', originY: '34px' }}
          >
            <rect x="42" y="32" width="14" height="7" rx="3.5" fill="#C4A25D" opacity="0.8"/>
            {/* Hand */}
            <circle cx="57" cy="35.5" r="4" fill="#C4A25D" opacity="0.75"/>
          </motion.g>

          {/* Legs */}
          <rect x="24" y="54" width="7" height="22" rx="3.5" fill="#C4A25D" opacity="0.8"/>
          <rect x="33" y="54" width="7" height="22" rx="3.5" fill="#C4A25D" opacity="0.8"/>

          {/* Shoes */}
          <ellipse cx="27.5" cy="77" rx="6" ry="3.5" fill="#2C2B29" opacity="0.6"/>
          <ellipse cx="36.5" cy="77" rx="6" ry="3.5" fill="#2C2B29" opacity="0.6"/>

          {/* Briefcase / suitcase */}
          <rect x="7" y="44" width="12" height="9" rx="2" fill="#2C2B29" opacity="0.5"/>
          <rect x="10" y="42" width="6" height="3" rx="1.5" fill="none" stroke="#2C2B29" strokeWidth="1.5" opacity="0.5"/>
          <line x1="7" y1="48.5" x2="19" y2="48.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}
