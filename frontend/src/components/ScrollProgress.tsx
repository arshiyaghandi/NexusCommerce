import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * A thin gradient progress bar pinned to the top of the viewport
 * that fills as the user scrolls down the page.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'var(--accent-gradient)',
        transformOrigin: '0%',
        scaleX,
        zIndex: 9999,
      }}
    />
  );
}
