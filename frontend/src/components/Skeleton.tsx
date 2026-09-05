import { motion } from 'framer-motion';

/* ── Generic Skeleton ────────────────────────────────────────────── */

interface SkeletonBoxProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

function SkeletonBox({ width = '100%', height = '20px', borderRadius = '8px', style }: SkeletonBoxProps) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
  );
}

/* ── Product Card Skeleton ───────────────────────────────────────── */

export function ProductCardSkeleton() {
  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <SkeletonBox height="150px" borderRadius="10px" />
      <SkeletonBox width="60%" height="16px" />
      <SkeletonBox width="90%" height="14px" />
      <SkeletonBox width="75%" height="14px" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <SkeletonBox width="60px" height="22px" />
        <SkeletonBox width="70px" height="36px" borderRadius="10px" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 3)}, 1fr)`, gap: '1.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
        >
          <ProductCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Cart Item Skeleton ──────────────────────────────────────────── */

export function CartItemSkeleton() {
  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <SkeletonBox width="150px" height="18px" />
        <SkeletonBox width="100px" height="14px" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <SkeletonBox width="90px" height="32px" borderRadius="8px" />
        <SkeletonBox width="60px" height="18px" />
        <SkeletonBox width="32px" height="32px" borderRadius="8px" />
      </div>
    </div>
  );
}

export function CartSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
      <div>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
          >
            <CartItemSkeleton />
          </motion.div>
        ))}
      </div>
      <div className="glass" style={{ padding: '2rem' }}>
        <SkeletonBox width="50%" height="20px" style={{ marginBottom: '1.5rem' }} />
        <SkeletonBox width="100%" height="16px" style={{ marginBottom: '0.75rem' }} />
        <SkeletonBox width="100%" height="16px" style={{ marginBottom: '0.75rem' }} />
        <SkeletonBox width="100%" height="22px" style={{ marginBottom: '1.5rem' }} />
        <SkeletonBox width="100%" height="48px" borderRadius="10px" />
      </div>
    </div>
  );
}

/* ── Order Card Skeleton ─────────────────────────────────────────── */

export function OrderCardSkeleton() {
  return (
    <div className="glass" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonBox width="100px" height="14px" />
          <SkeletonBox width="150px" height="16px" />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <SkeletonBox width="32px" height="32px" borderRadius="50%" />
        <SkeletonBox width="32px" height="32px" borderRadius="50%" />
        <SkeletonBox width="32px" height="32px" borderRadius="50%" />
      </div>
      <SkeletonBox width="100%" height="14px" style={{ marginBottom: '0.5rem' }} />
      <SkeletonBox width="80%" height="14px" style={{ marginBottom: '1rem' }} />
      <SkeletonBox width="100%" height="20px" />
    </div>
  );
}

export function OrderGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <OrderCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}
