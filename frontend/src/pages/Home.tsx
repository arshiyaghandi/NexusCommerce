import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Zap, ShieldCheck, Truck, ShoppingCart, ArrowRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const featuredProducts = products?.slice(0, 3) ?? [];

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
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'url(/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6,
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to right, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.4) 100%)',
            zIndex: 1,
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
            {user ? (
              <Link to="/products" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                <ShoppingBag size={20} /> Shop Now
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                Get Started Free <ArrowRight size={20} />
              </Link>
            )}
            <Link to="/products" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)' }}>
              Explore Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="mb-8 animate-fade-in-up delay-100">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Featured Products</h2>
          <Link to="/products" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            View All
          </Link>
        </div>
        {isLoading ? (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>Loading products...</div>
        ) : featuredProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {featuredProducts.map((product) => (
              <div key={product.id} className="glass glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ height: '150px', background: 'var(--bg-darker)', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', width: '100px', height: '100px', background: 'var(--accent-gradient)', borderRadius: '50%', filter: 'blur(30px)', opacity: 0.5 }} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                  <p className="text-muted" style={{ flexGrow: 1, marginBottom: '1rem' }}>
                    {product.description?.length > 60 ? product.description.substring(0, 60) + '...' : product.description}
                  </p>
                </Link>
                <div className="flex-between" style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                    ${product.price}
                  </span>
                  <button className="btn btn-primary" onClick={() => handleAddToCart(product)}>
                    <ShoppingCart size={16} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted text-center" style={{ padding: '3rem' }}>
            No products available yet.
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="mb-8 animate-fade-in-up delay-100">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
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

      {/* CTA Section */}
      <section
        className="glass animate-fade-in-up delay-200"
        style={{
          padding: '4rem',
          textAlign: 'center',
          borderRadius: '24px',
          backgroundImage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%)',
        }}
      >
        <h2>Ready to start shopping?</h2>
        <p className="text-muted" style={{ fontSize: '1.2rem', margin: '1rem auto 2rem', maxWidth: '600px' }}>
          {user
            ? 'Browse our full catalog and find your next favorite product.'
            : 'Join thousands of satisfied customers. Create your free account and start shopping today.'}
        </p>
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
      </section>
    </div>
  );
}
