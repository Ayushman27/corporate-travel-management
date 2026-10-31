/**
 * Atmos Luxury — Animated glassmorphism card.
 * Hover: scale 1.02, translateY -4px, deeper shadow.
 * Accepts all standard div props.
 */

import { motion } from 'framer-motion';

export default function MotionCard({ children, className = '', style = {}, delay = 0, ...props }) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1], delay }}
      whileHover={{
        scale: 1.018,
        y: -4,
        boxShadow: '0 32px 64px rgba(44,43,41,0.12), 0 8px 24px rgba(196,162,93,0.1)',
        transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
