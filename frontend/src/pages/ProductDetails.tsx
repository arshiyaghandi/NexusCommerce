import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, PackageX, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProduct } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { useCart } from '../hooks/useCart';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useTrackInteraction } from '../hooks/useRecommendations';
import PageTransition from '../components/PageTransition';
import ProductVisual from '../components/ProductVisual';
import AnimatedCounter from '../components/AnimatedCounter';
import TiltCard from '../components/TiltCard';


/* ── animation variants ────────────────────────────────────────── */
const infoContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const infoItem = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

const stockBadge = {
  hidden: { opacity: 0, scale: 0.4 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 15, delay: 0.35 } },
};

const bottomContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
};

const bottomItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } },
};

const orbFloat = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.7, 0.9, 0.7],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading: productLoading } = useProduct(productId);
  const [quantity, setQuantity] = useState(1);
  const { addToast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart(!!user);
  const navigate = useNavigate();
  const location = useLocation();
  const { trackView, trackCart } = useTrackInteraction();

  const skuCode = product?.skuCode ?? '';
  const { data: inventory } = useInventory(skuCode);
  const stock = inventory?.quantity ?? null;
  const outOfStock = stock === null || stock === 0;

  // Track 'view' interaction when the product page mounts (silent — won't block render)
  useEffect(() => {
    if (productId) trackView(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (productLoading) {
    return <div className="text-center mt-4 text-muted">Loading product details...</div>;
  }
  if (!product) {
    return <div className="text-center mt-4 text-muted">Product not found.</div>;
  }

  const handleAddToCart = async () => {
    if (!user) {
      addToast('Please sign in to add items to your cart', 'info');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      await addItem({ product, quantity });
      trackCart(productId);   // Track 'cart' interaction
      addToast(`${quantity}x ${product.name} added to cart`, 'success');
    } catch {
      addToast('Failed to add item to cart', 'error');
    }
  };


  return (
    <PageTransition>
      <div className="animate-fade-in-up">
        <Link to="/products" className="btn btn-outline" style={{ padding: '0.5rem 1rem', marginBottom: '2rem', display: 'inline-flex' }}>
          <ArrowLeft size={18} /> Back to Catalog
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
          {/* ── Futuristic Holographic Product Visual ─────────────── */}
          <TiltCard maxTilt={6} glare={true}>
            <div
              className="glass"
              style={{
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '420px',
                borderRadius: '24px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div style={{ width: '100%', maxWidth: '320px' }}>
                <ProductVisual name={product.name} category={product.categoryName} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  AUTHENTIC HARDWARE
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  IMMEDIATE SAGA DISPATCH
                </span>
              </div>
            </div>
          </TiltCard>

          {/* ── Product info – slides in from the right ─────────── */}
          <motion.div variants={infoContainer} initial="hidden" animate="show">
            <motion.h2 variants={infoItem} style={{ fontSize: '2.5rem', marginBottom: '0.75rem', fontWeight: '800' }}>
              {product.name}
            </motion.h2>

            <motion.div variants={infoItem} style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
              <AnimatedCounter value={product.price} prefix="$" decimals={2} duration={0.8} />
            </motion.div>

            <motion.div variants={infoItem} className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#e2e8f0' }}>Description & Specifications</h4>
              <p className="text-muted" style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>{product.description}</p>
            </motion.div>

            {/* ── Stock badge – pops in with spring ──────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {stock !== null && (
                <motion.div
                  variants={stockBadge}
                  initial="hidden"
                  animate="show"
                  className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                  style={{
                    background: stock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: stock > 0 ? '#10b981' : '#ef4444',
                    border: `1px solid ${stock > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: '9999px',
                    padding: '0.5rem 1rem',
                  }}
                >
                  {stock > 0 ? <><PackageCheck size={16} /> In Stock ({stock} available)</> : <><PackageX size={16} /> Out of Stock</>}
                </motion.div>
              )}
            </div>

            {/* ── Quantity & Add to Cart ─────────────────────────── */}
            <motion.div variants={infoItem} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div
                className="glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  opacity: outOfStock ? 0.5 : 1,
                  pointerEvents: outOfStock ? 'none' : 'auto',
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.15 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  -
                </motion.button>
                <span style={{ padding: '0 1rem', fontWeight: '600' }}>{quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.15 }}
                  onClick={() => setQuantity(Math.min(stock ?? 1, quantity + 1))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  +
                </motion.button>
              </div>

              <motion.button
                className="btn btn-primary"
                style={{ flex: 1, padding: '1rem', opacity: outOfStock ? 0.5 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
                onClick={handleAddToCart}
                disabled={outOfStock}
                whileHover={outOfStock ? {} : { scale: 1.03, boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}
                whileTap={outOfStock ? {} : { scale: 0.97 }}
              >
                <ShoppingCart size={20} /> {outOfStock ? 'Unavailable' : 'Add to Cart'}
              </motion.button>
            </motion.div>

            {/* ── Warranty / Shipping – stagger in ─────────────── */}
            <motion.div
              variants={bottomContainer}
              initial="hidden"
              animate="show"
              style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}
            >
              <motion.div variants={bottomItem} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={20} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.9rem' }}>2 Year Warranty</span>
              </motion.div>
              <motion.div variants={bottomItem} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <Truck size={20} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.9rem' }}>Free Global Shipping</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
