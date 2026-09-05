import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
  size: number;
}

const SPARKLE_COLORS = ['#60a5fa', '#a855f7', '#38bdf8', '#f43f5e', '#34d399', '#fbbf24'];

export default function ClickSparkle() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const count = 7;
      const newSparkles: Sparkle[] = [];
      const baseTime = Date.now();

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        newSparkles.push({
          id: baseTime + i + Math.random(),
          x: e.clientX,
          y: e.clientY,
          angle,
          speed: Math.random() * 40 + 25,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)] || '#60a5fa',
          size: Math.random() * 4 + 2,
        });
      }

      setSparkles((prev) => [...prev.slice(-25), ...newSparkles]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99998, overflow: 'hidden' }}>
      <AnimatePresence>
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            initial={{
              x: s.x,
              y: s.y,
              scale: 1.2,
              opacity: 1,
            }}
            animate={{
              x: s.x + Math.cos(s.angle) * s.speed,
              y: s.y + Math.sin(s.angle) * s.speed,
              scale: 0,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onAnimationComplete={() => {
              setSparkles((prev) => prev.filter((item) => item.id !== s.id));
            }}
            style={{
              position: 'absolute',
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: '50%',
              backgroundColor: s.color,
              boxShadow: `0 0 10px ${s.color}, 0 0 16px ${s.color}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
