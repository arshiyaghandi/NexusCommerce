import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Zap, ShieldCheck, Truck, ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useRecommendations } from '../hooks/useRecommendations';
import { useCart } from '../hooks/useCart';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import PageTransition, { staggerItem, staggerContainer } from '../components/PageTransition';
import TiltCard from '../components/TiltCard';
import MouseSpotlight from '../components/MouseSpotlight';
import { ProductGridSkeleton } from '../components/Skeleton';
import HeroTechCard from '../components/HeroTechCard';
import CyberTicker from '../components/CyberTicker';
import ProductVisual from '../components/ProductVisual';

/* ── Animation variants ──────────────────────────────────────────── */
const heroTextVariants = {
  initial: { opacity: 0, x: -40, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const heroSubtitleVariants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
};

const heroButtonVariants = {
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -8,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const featureIconVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: {
    rotate: [0, -10, 10, 0],
    scale: 1.15,
    transition: { duration: 0.5 },
  },
};

const floatingOrb = {
  animate: {
    y: [0, -15, 0],
    scale: [1, 1.08, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const { data: recommendations } = useRecommendations();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart(!!user);
  const navigate = useNavigate();
  const location = useLocation();

  const featuredProducts = products?.slice(0, 3) ?? [];
  
  const recommendedProducts = recommendations
    ? recommendations.map(r => {
        const prod = products?.find(p => p.id === r.productId);
        return prod ? { ...prod, aiReason: r.reason } : null;
      }).filter((p): p is NonNullable<typeof p> => p !== null)
    : [];

  const handleAddToCart = async (product: NonNullable<typeof products>[number]) => {
    if (!user) {
      addToast('Please sign in to add items to your cart', 'info');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      await addItem({ product, quantity: 1 });
      addToast(`${product.name} added to cart`, 'success');
    } catch {
      addToast('Failed to add item to cart', 'error');
    }
  };

  return (
    <PageTransition>
      {/* Hero Section */}
      <motion.section
        className="glass"
        style={{
          position: 'relative',
          padding: '4.5rem 3.5rem',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          minHeight: '520px',
        }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'url(/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.45,
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(105deg, rgba(2, 6, 23, 0.98) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(2, 6, 23, 0.7) 100%)',
            zIndex: 1,
          }}
        />

        {/* Floating decorative ambient light */}
        <motion.div
          style={{
            position: 'absolute', top: '15%', left: '30%',
            width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
            filter: 'blur(60px)', zIndex: 1,
          }}
          variants={floatingOrb}
          animate="animate"
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Hero Copy & CTA */}
          <div style={{ maxWidth: '580px' }}>
            {/* High-Tech Cyber Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 1rem',
                borderRadius: '30px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 10px #38bdf8',
                }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#93c5fd' }}>
                ⚡ NEXT-GEN REACTIVE COMMERCE
              </span>
            </motion.div>

            <motion.h1
              style={{ fontSize: '3.6rem', marginBottom: '1.25rem', lineHeight: '1.1', fontWeight: '800' }}
              variants={heroTextVariants}
              initial="initial"
              animate="animate"
            >
              Elevate Your <br />
              <span className="text-gradient">Digital Universe</span>
            </motion.h1>
            <motion.p
              style={{ fontSize: '1.15rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6' }}
              variants={heroSubtitleVariants}
              initial="initial"
              animate="animate"
            >
              Discover ultra-premium tech gear and curated items backed by an idempotent, reactive Saga pipeline for millisecond-precision checkout.
            </motion.p>
            <motion.div
              style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
              variants={heroButtonVariants}
              initial="initial"
              animate="animate"
            >
              {user ? (
                <Link to="/products" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}>
                  <ShoppingBag size={20} /> Shop Catalog
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}>
                  Start Free Account <ArrowRight size={20} />
                </Link>
              )}
              <Link to="/products" className="btn btn-outline" style={{ padding: '1rem 2.2rem', fontSize: '1.05rem', background: 'rgba(255,255,255,0.04)' }}>
                Explore Categories
              </Link>
            </motion.div>

            {/* Quick trust metrics */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                <Zap size={15} color="#38bdf8" />
                <span>Zero Latency</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                <ShieldCheck size={15} color="#a855f7" />
                <span>Bank-Grade Saga</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                <Sparkles size={15} color="#10b981" />
                <span>AI Curated</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic Tech HUD Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <HeroTechCard />
          </div>
        </div>
      </motion.section>

      {/* Cyberpunk Status Ticker */}
      <CyberTicker />

      {/* Featured Products Section */}
      <motion.section
        style={{ marginBottom: '3rem' }}
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={staggerItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
              Curated Selection
            </span>
            <h2 style={{ margin: '0.25rem 0 0 0' }}>Featured Hardware & Gear</h2>
          </div>
          <Link to="/products" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            View Full Catalog <ArrowRight size={14} />
          </Link>
        </motion.div>
        {isLoading ? (
          <ProductGridSkeleton count={3} />
        ) : featuredProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {featuredProducts.map((product) => (
              <TiltCard key={product.id} maxTilt={6}>
                <MouseSpotlight
                  className="glass glass-card"
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ProductVisual name={product.name} category={product.categoryName} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{product.name}</h3>
                    <p className="text-muted" style={{ flexGrow: 1, marginBottom: '1rem', fontSize: '0.9rem' }}>
                      {product.description?.length > 60 ? product.description.substring(0, 60) + '...' : product.description}
                    </p>
                  </Link>
                  <div className="flex-between" style={{ marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                      ${product.price}
                    </span>
                    <motion.button
                      className="btn btn-primary"
                      onClick={() => handleAddToCart(product)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </motion.button>
                  </div>
                </MouseSpotlight>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="text-muted text-center" style={{ padding: '3rem' }}>
            No products available yet.
          </div>
        )}
      </motion.section>

      {/* Recommended Products Section */}
      {user && recommendedProducts.length > 0 && (
        <motion.section
          style={{ marginBottom: '2rem' }}
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={staggerItem} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles color="var(--accent-primary)" />
            </motion.div>
            <h2 style={{ margin: 0 }}>Recommended for You</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {recommendedProducts.map((product, i) => (
              <TiltCard key={product.id} maxTilt={6}>
                <MouseSpotlight
                  className="glass glass-card"
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
                >
                  <motion.div
                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--accent-gradient)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', zIndex: 10 }}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    {product.aiReason}
                  </motion.div>
                  <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ProductVisual name={product.name} category={product.categoryName} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{product.name}</h3>
                    <p className="text-muted" style={{ flexGrow: 1, marginBottom: '1rem', fontSize: '0.9rem' }}>
                      {product.description?.length > 60 ? product.description.substring(0, 60) + '...' : product.description}
                    </p>
                  </Link>
                  <div className="flex-between" style={{ marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                      ${product.price}
                    </span>
                    <motion.button
                      className="btn btn-primary"
                      onClick={() => handleAddToCart(product)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </motion.button>
                  </div>
                </MouseSpotlight>
              </TiltCard>
            ))}
          </div>
        </motion.section>
      )}

      {/* Features Section */}
      <motion.section
        style={{ marginBottom: '2rem' }}
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { icon: Zap, title: 'Lightning Fast', desc: 'Experience our high-speed global delivery network.', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)' },
            { icon: ShieldCheck, title: 'Secure Payments', desc: 'Your transactions are protected by bank-level security.', color: 'var(--accent-secondary)', bg: 'rgba(139, 92, 246, 0.1)' },
            { icon: Truck, title: 'Free Returns', desc: 'Not satisfied? Return it within 30 days, no questions asked.', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              className="glass glass-card"
              style={{ padding: '2rem', textAlign: 'center' }}
              variants={staggerItem}
              whileHover="hover"
              initial="rest"
              animate="rest"
              custom={i}
            >
              <motion.div
                style={{ background: feature.bg, width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}
                variants={featureIconVariants}
              >
                <feature.icon size={32} color={feature.color} />
              </motion.div>
              <h3 style={{ marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p className="text-muted">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="glass"
        style={{
          padding: '4rem',
          textAlign: 'center',
          borderRadius: '24px',
          backgroundImage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%)',
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Ready to start shopping?
        </motion.h2>
        <motion.p
          className="text-muted"
          style={{ fontSize: '1.2rem', margin: '1rem auto 2rem', maxWidth: '600px' }}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {user
            ? 'Browse our full catalog and find your next favorite product.'
            : 'Join thousands of satisfied customers. Create your free account and start shopping today.'}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {user ? (
            <Link to="/products" className="btn btn-primary" style={{ padding: '1rem 3rem' }}>
              Browse Catalog
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 3rem' }}>
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '1rem 2.5rem' }}>
                Sign In
              </Link>
            </div>
          )}
        </motion.div>
      </motion.section>
    </PageTransition>
  );
}
