import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: products, isLoading } = useProducts(searchQuery || undefined);
  const { addItem } = useCart(!!user);
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Our Products</h2>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '300px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <button type="submit" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            Search
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-center mt-4 text-muted" style={{ padding: '3rem' }}>Loading products...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {products?.map((product) => (
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
          {products && products.length === 0 && (
            <div className="text-muted" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem' }}>
              No products found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
