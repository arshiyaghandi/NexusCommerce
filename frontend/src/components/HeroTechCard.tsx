import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import TiltCard from './TiltCard';

const SAGA_NODES = [
  { id: '1', name: 'Order Service', status: 'INITIATED', time: '1ms' },
  { id: '2', name: 'Inventory Reserve', status: 'LOCKED', time: '4ms' },
  { id: '3', name: 'Payment Process', status: 'AUTHORIZED', time: '9ms' },
  { id: '4', name: 'Saga Complete', status: 'CONFIRMED', time: '14ms' },
];

export default function HeroTechCard() {
  return (
    <TiltCard maxTilt={8} glare={true} style={{ width: '100%', maxWidth: '440px' }}>
      <div
        className="glass"
        style={{
          padding: '1.75rem',
          borderRadius: '20px',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(2, 6, 23, 0.95) 100%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px', color: '#e2e8f0' }}>
              REACTIVE SAGA PIPELINE
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontWeight: '600',
            }}
          >
            REAL-TIME
          </span>
        </div>

        {/* Dynamic Interactive Flow Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {SAGA_NODES.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.9rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc' }}>{node.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Event Stream Handled</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                  +{node.time}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '500' }}>{node.status}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.6rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Latency</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.15rem' }}>12ms</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Kafka TPS</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#a855f7', marginTop: '0.15rem' }}>4.8k/s</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Idempotency</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#10b981', marginTop: '0.15rem' }}>100%</div>
          </div>
        </div>

        {/* Ambient Corner Flare */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            right: '-20px',
            width: '90px',
            height: '90px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent 70%)',
            filter: 'blur(15px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </TiltCard>
  );
}
