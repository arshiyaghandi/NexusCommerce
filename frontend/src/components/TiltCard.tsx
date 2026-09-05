import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Max rotation in degrees — default 8 */
  maxTilt?: number;
  /** Perspective in px — default 800 */
  perspective?: number;
  /** Glare overlay — default true */
  glare?: boolean;
}

/**
 * Wraps children with a 3D tilt effect that responds to mouse position.
 * Inspired by premium product cards on Apple.com, Nothing.tech, etc.
 */
export default function TiltCard({
  children,
  className = '',
  style,
  maxTilt = 8,
  perspective = 800,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0..1
      const y = (e.clientY - rect.top) / rect.height; // 0..1
      const rotateX = (0.5 - y) * maxTilt; // tilt up/down
      const rotateY = (x - 0.5) * maxTilt; // tilt left/right
      setTransform(`rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`);
      setGlarePos({ x: x * 100, y: y * 100 });
    },
    [maxTilt],
  );

  const handleMouseLeave = useCallback(() => {
    setTransform('rotateX(0deg) rotateY(0deg)');
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          transform,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
      >
        {children}
        {/* Glare overlay */}
        {glare && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
              zIndex: 10,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
