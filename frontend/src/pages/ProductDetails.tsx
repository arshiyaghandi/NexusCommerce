import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, PackageX, PackageCheck } from 'lucide-react';
import { useProduct } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { useCart } from '../hooks/useCart';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading: productLoading } = useProduct(productId);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart(!!user);
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const skuCode = product?.skuCode ?? '';
  const { data: inventory } = useInventory(skuCode);
  const stock = inventory?.quantity ?? null;
  const outOfStock = stock === null || stock === 0;

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
      addToast(`${quantity}x ${product.name} added to cart`, 'success');
    } catch {
      addToast('Failed to add item to cart', 'error');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <Link to="/products" className="btn btn-outline" style={{ padding: '0.5rem 1rem', marginBottom: '2rem', display: 'inline-flex' }}>
        <ArrowLeft size={18} /> Back to Catalog
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '250px', height: '250px', background: 'var(--accent-gradient)', borderRadius: '50%', margin: '0 auto 2rem', opacity: 0.8, filter: 'blur(40px)' }} />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{product.name}</h2>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
            ${product.price}
          </div>

          <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Description</h4>
            <p className="text-muted" style={{ lineHeight: '1.8' }}>{product.description}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            {stock !== null && (
              <div
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
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
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
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                -
              </button>
              <span style={{ padding: '0 1rem', fontWeight: '600' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stock ?? 1, quantity + 1))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                +
              </button>
            </div>

            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '1rem', opacity: outOfStock ? 0.5 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <ShoppingCart size={20} /> {outOfStock ? 'Unavailable' : 'Add to Cart'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={20} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.9rem' }}>2 Year Warranty</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <Truck size={20} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.9rem' }}>Free Global Shipping</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
