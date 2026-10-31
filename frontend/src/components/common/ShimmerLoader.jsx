/**
 * Atmos Luxury — Shimmer skeleton loader.
 */

import { motion } from 'framer-motion';

function ShimmerBlock({ h = 'h-4', w = 'w-full', rounded = 'rounded-lg', className = '' }) {
  return (
    <div className={`${h} ${w} ${rounded} shimmer ${className}`} />
  );
}

export function ShimmerCard({ rows = 3 }) {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <ShimmerBlock h="h-5" w="w-2/5" className="mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerBlock key={i} h="h-3" w={i % 2 === 0 ? 'w-full' : 'w-4/5'} className="mb-3" />
      ))}
    </motion.div>
  );
}

export function ShimmerTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2">
          <ShimmerBlock h="h-3" w="w-24" />
          <ShimmerBlock h="h-3" w="w-32" />
          <ShimmerBlock h="h-3" w="w-20" />
          <ShimmerBlock h="h-3" w="w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 40, md: 56, lg: 72 };
  const s = sizes[size] || 56;

  const spinner = (
    <motion.svg
      width={s} height={s} viewBox="0 0 56 56"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.6, ease: 'linear', repeat: Infinity }}
    >
      <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(196,162,93,0.15)" strokeWidth="3"/>
      <circle cx="28" cy="28" r="22" fill="none" stroke="#C4A25D" strokeWidth="3"
        strokeLinecap="round" strokeDasharray="60 80" strokeDashoffset="0"/>
    </motion.svg>
  );

  if (fullScreen) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'rgba(244,242,240,0.9)', backdropFilter: 'blur(12px)' }}
    >
      {spinner}
      <p style={{ fontFamily: 'Montserrat', fontSize: '0.75rem', letterSpacing: '0.15em',
                  color: '#A8A4A0', marginTop: '1rem', textTransform: 'uppercase' }}>
        Loading…
      </p>
    </motion.div>
  );

  return spinner;
}
