import { motion } from 'framer-motion';
import { Cpu, Zap, Shield, Sparkles, Radio, Headphones, Watch, Smartphone, Laptop, Layers } from 'lucide-react';

interface ProductVisualProps {
  name: string;
  category?: string | null;
  className?: string;
}

// Select an iconic futuristic symbol based on product name or category
function getProductIcon(name: string, category?: string | null) {
  const text = `${name} ${category || ''}`.toLowerCase();

  if (text.includes('phone') || text.includes('mobile')) return Smartphone;
  if (text.includes('laptop') || text.includes('computer') || text.includes('pc')) return Laptop;
  if (text.includes('headphone') || text.includes('audio') || text.includes('sound')) return Headphones;
  if (text.includes('watch') || text.includes('band') || text.includes('wearable')) return Watch;
  if (text.includes('cyber') || text.includes('chip') || text.includes('hardware')) return Cpu;
  if (text.includes('security') || text.includes('safe') || text.includes('guard')) return Shield;
  if (text.includes('wireless') || text.includes('network') || text.includes('sensor')) return Radio;
  if (text.includes('premium') || text.includes('pro') || text.includes('gold')) return Sparkles;
  if (text.includes('speed') || text.includes('fast') || text.includes('power')) return Zap;

  // Default futuristic tech layer
  return Layers;
}

export default function ProductVisual({ name, category, className = '' }: ProductVisualProps) {
  const Icon = getProductIcon(name, category);

  // Generate a consistent hue shift based on product name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const isAltColor = Math.abs(hash) % 2 === 0;

  const primaryGlow = isAltColor ? '#8b5cf6' : '#3b82f6';
  const secondaryGlow = isAltColor ? '#06b6d4' : '#ec4899';

  return (
    <div
      className={className}
      style={{
        height: '160px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)',
        borderRadius: '14px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      {/* High-tech background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.8,
        }}
      />

      {/* Cyberpunk corner accents */}
      <div style={{ position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderTop: '2px solid rgba(59, 130, 246, 0.6)', borderLeft: '2px solid rgba(59, 130, 246, 0.6)' }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderTop: '2px solid rgba(139, 92, 246, 0.6)', borderRight: '2px solid rgba(139, 92, 246, 0.6)' }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 8, height: 8, borderBottom: '2px solid rgba(59, 130, 246, 0.6)', borderLeft: '2px solid rgba(59, 130, 246, 0.6)' }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 8, height: 8, borderBottom: '2px solid rgba(139, 92, 246, 0.6)', borderRight: '2px solid rgba(139, 92, 246, 0.6)' }} />

      {/* Pulsing central energy glow */}
      <motion.div
        style={{
          position: 'absolute',
          width: '90px',
          height: '90px',
          background: `radial-gradient(circle, ${primaryGlow} 0%, ${secondaryGlow} 40%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(20px)',
          opacity: 0.45,
        }}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.65, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating outer holographic orbital ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          border: '1.5px dashed rgba(255, 255, 255, 0.18)',
          pointerEvents: 'none',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      />

      {/* Rotating inner orbit ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: `1px solid ${primaryGlow}`,
          opacity: 0.4,
          pointerEvents: 'none',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center Floating High-Tech Icon */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.05), 0 0 20px ${primaryGlow}33`,
          backdropFilter: 'blur(8px)',
        }}
        animate={{
          y: [-3, 3, -3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Icon size={26} color="#ffffff" style={{ filter: `drop-shadow(0 0 8px ${primaryGlow})` }} />
      </motion.div>

      {/* Futuristic Scanline beam animation */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${primaryGlow} 50%, transparent 100%)`,
          opacity: 0.4,
          pointerEvents: 'none',
        }}
        animate={{
          top: ['0%', '100%', '0%'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
