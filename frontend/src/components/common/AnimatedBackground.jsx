/**
 * Atmos Luxury — Noon-style canvas wave animation.
 * Dark: vibrant orange-gold flowing wave ribbons.
 * Light: subtle warm gold whispers.
 */

import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/* Wave definitions — y position (fraction), amplitude (fraction of height),
   frequency multiplier, speed, line-width, initial phase offset */
const WAVES = [
  { y: 0.50, a: 0.14, f: 0.011, s: 0.28, w: 2.5,  p: 0.0 },
  { y: 0.46, a: 0.09, f: 0.017, s: 0.48, w: 1.5,  p: 1.5 },
  { y: 0.54, a: 0.18, f: 0.008, s: 0.22, w: 3.5,  p: 2.8 },
  { y: 0.43, a: 0.07, f: 0.023, s: 0.66, w: 1.0,  p: 0.9 },
  { y: 0.57, a: 0.22, f: 0.006, s: 0.17, w: 4.5,  p: 4.2 },
  { y: 0.48, a: 0.11, f: 0.015, s: 0.38, w: 2.0,  p: 2.0 },
  { y: 0.52, a: 0.08, f: 0.020, s: 0.56, w: 1.2,  p: 3.5 },
  { y: 0.40, a: 0.05, f: 0.029, s: 0.82, w: 0.7,  p: 1.2 },
  { y: 0.60, a: 0.16, f: 0.005, s: 0.14, w: 5.0,  p: 0.5 },
];

export default function AnimatedBackground() {
  const { isDark } = useTheme();
  const canvasRef  = useRef(null);
  const stateRef   = useRef({ animId: null, time: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      state.time += 0.007;

      // Horizontal colour gradient shared by all waves
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      if (isDark) {
        grad.addColorStop(0,    'rgba(100, 25, 4,   0)');
        grad.addColorStop(0.06, 'rgba(150, 45, 6,   0.55)');
        grad.addColorStop(0.20, 'rgba(200, 80, 12,  0.90)');
        grad.addColorStop(0.38, 'rgba(215, 130, 22, 0.95)');
        grad.addColorStop(0.52, 'rgba(230, 185, 45, 1.00)');
        grad.addColorStop(0.66, 'rgba(218, 155, 28, 0.92)');
        grad.addColorStop(0.82, 'rgba(180, 90, 14,  0.72)');
        grad.addColorStop(1,    'rgba(100, 28, 4,   0)');
      } else {
        grad.addColorStop(0,    'rgba(196, 162, 93, 0)');
        grad.addColorStop(0.15, 'rgba(196, 162, 93, 0.10)');
        grad.addColorStop(0.45, 'rgba(196, 162, 93, 0.18)');
        grad.addColorStop(0.70, 'rgba(196, 162, 93, 0.12)');
        grad.addColorStop(0.90, 'rgba(196, 162, 93, 0.06)');
        grad.addColorStop(1,    'rgba(196, 162, 93, 0)');
      }

      WAVES.forEach((wave) => {
        // Build smooth path
        ctx.beginPath();
        let first = true;
        for (let x = 0; x <= W + 4; x += 4) {
          const y =
            H * wave.y +
            H * wave.a * Math.sin(x * wave.f + state.time * wave.s + wave.p);
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = grad;

        if (isDark) {
          // Glow pass — wide & translucent
          ctx.lineWidth   = wave.w * 5;
          ctx.globalAlpha = 0.13;
          ctx.stroke();
          // Core pass — sharp & bright
          ctx.lineWidth   = wave.w;
          ctx.globalAlpha = 0.88;
          ctx.stroke();
        } else {
          // Light mode — single soft pass
          ctx.lineWidth   = wave.w * 1.2;
          ctx.globalAlpha = 0.22;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      });

      state.animId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <>
      {/* Solid base background — changes with theme via CSS variable */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: -2,
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 20% 10%, #1A1008 0%, transparent 60%),' +
              'radial-gradient(ellipse 70% 50% at 80% 80%, #120E06 0%, transparent 55%),' +
              'linear-gradient(160deg, #0D0B09 0%, #100E0A 100%)'
            : 'radial-gradient(ellipse 80% 60% at 20% 10%, #EDE9E4 0%, transparent 60%),' +
              'radial-gradient(ellipse 70% 50% at 80% 80%, #E5E0D9 0%, transparent 55%),' +
              'linear-gradient(160deg, #F4F2F0 0%, #EAE6E1 100%)',
        }}
      />
      {/* Canvas wave layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          zIndex: -1, pointerEvents: 'none',
        }}
      />
    </>
  );
}
