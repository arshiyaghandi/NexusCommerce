import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, Cpu, Server, Sparkles } from 'lucide-react';

const TICKER_ITEMS = [
  { icon: Zap, label: 'REACTIVE EVENT-DRIVEN' },
  { icon: Server, label: 'KAFKA DISTRIBUTED STREAMING' },
  { icon: Cpu, label: 'SAGA CHOREOGRAPHY ENGINE' },
  { icon: ShieldCheck, label: 'OAUTH2 JWT HARDENED' },
  { icon: Activity, label: 'SUB-20MS REACTION PIPELINE' },
  { icon: Sparkles, label: 'AI DYNAMIC RECOMMENDATIONS' },
];

export default function CyberTicker() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        padding: '0.85rem 0',
        background: 'linear-gradient(90deg, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.95))',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '3.5rem',
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      <motion.div
        style={{
          display: 'flex',
          gap: '3rem',
          width: 'max-content',
          alignItems: 'center',
        }}
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Double array for seamless loop */}
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '1.5px',
                color: 'rgba(203, 213, 225, 0.75)',
                textTransform: 'uppercase',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  display: 'inline-block',
                }}
              />
              <Icon size={14} color="var(--accent-primary)" />
              <span>{item.label}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.15)', marginLeft: '1.5rem' }}>//</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
