import { Link } from 'react-router-dom';
import { ShoppingBag, Zap, ShieldCheck, Truck } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section 
        className="glass animate-fade-in-up" 
        style={{
          position: 'relative',
          padding: '6rem 4rem',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '4rem',
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Background Image with Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'url(/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6,
            zIndex: 0
          }}
        />
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to right, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.4) 100%)',
            zIndex: 1
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
            Elevate Your <br />
            <span className="text-gradient">Lifestyle</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            Discover a curated collection of premium products. 
            From cutting-edge electronics to luxury fashion, 
            find exactly what you need at NexusCommerce.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/products" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              <ShoppingBag size={20} /> Shop Now
            </Link>
            <Link to="/products" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)' }}>
              Explore Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-8 animate-fade-in-up delay-100">
        <div className="grid grid-cols-3">
          <div className="glass glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Zap size={32} color="var(--accent-primary)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Lightning Fast</h3>
            <p className="text-muted">Experience our high-speed global delivery network.</p>
          </div>
          
          <div className="glass glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShieldCheck size={32} color="var(--accent-secondary)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Secure Payments</h3>
            <p className="text-muted">Your transactions are protected by bank-level security.</p>
          </div>
          
          <div className="glass glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Truck size={32} color="#10b981" />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Free Returns</h3>
            <p className="text-muted">Not satisfied? Return it within 30 days, no questions asked.</p>
          </div>
        </div>
      </section>

      {/* Featured Banner */}
      <section className="glass animate-fade-in-up delay-200" style={{ padding: '4rem', textAlign: 'center', borderRadius: '24px', backgroundImage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%)' }}>
        <h2>Ready to start shopping?</h2>
        <p className="text-muted" style={{ fontSize: '1.2rem', margin: '1rem auto 2rem', maxWidth: '600px' }}>
          Join thousands of satisfied customers who have made NexusCommerce their primary destination for premium goods.
        </p>
        <Link to="/products" className="btn btn-primary" style={{ padding: '1rem 3rem' }}>
          Browse Catalog
        </Link>
      </section>
    </div>
  );
}
