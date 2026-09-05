import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react';

interface MouseSpotlightProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  spotlightSize?: number;
  spotlightOpacity?: number;
  spotlightColor?: string;
}

/**
 * Wraps children with a radial-gradient spotlight that follows the cursor.
 * The spotlight is rendered as a pseudo-overlay so it doesn't affect child layout.
 */
export default function MouseSpotlight({
  children,
  className = '',
  style,
  spotlightSize = 250,
  spotlightOpacity = 0.07,
  spotlightColor = '139, 92, 246',
}: MouseSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Spotlight overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(${spotlightSize}px circle at ${pos.x}px ${pos.y}px, rgba(${spotlightColor}, ${spotlightOpacity}), transparent 60%)`,
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}
