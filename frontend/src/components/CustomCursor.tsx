import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for trailing outer ring
  const springConfig = { damping: 22, stiffness: 280, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const isEnabled = useRef(false);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (!window.matchMedia('(pointer: fine)').matches) return;
    isEnabled.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Detect if hovering over clickable / interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], .glass-card');
        setIsHovered(!!isInteractive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Outer fluid trailing ring with neon aura */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          pointerEvents: 'none',
          zIndex: 99999,
          borderRadius: '50%',
          border: isHovered
            ? '1.5px solid rgba(139, 92, 246, 0.8)'
            : '1px solid rgba(59, 130, 246, 0.5)',
          boxShadow: isHovered
            ? '0 0 20px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(139, 92, 246, 0.2)'
            : '0 0 10px rgba(59, 130, 246, 0.2)',
          background: isHovered
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 80%)'
            : 'transparent',
          backdropFilter: isHovered ? 'blur(1px)' : 'none',
        }}
        animate={{
          width: isClicking ? 26 : isHovered ? 48 : 34,
          height: isClicking ? 26 : isHovered ? 48 : 34,
          scale: isClicking ? 0.85 : 1,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      />

      {/* Inner sharp laser dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          pointerEvents: 'none',
          zIndex: 99999,
          width: isHovered ? 4 : 6,
          height: isHovered ? 4 : 6,
          borderRadius: '50%',
          backgroundColor: isHovered ? '#c084fc' : '#60a5fa',
          boxShadow: '0 0 8px #60a5fa, 0 0 12px #3b82f6',
        }}
      />
    </>
  );
}
