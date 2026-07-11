import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, addToCart, getInventory } from '../services/api';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, PackageX, PackageCheck } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function ProductDetails({ refreshCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToast } = useToast();

  useEffect(() => {
    getProduct(id)
      .then(res => {
        setProduct(res.data);
        // Fetch inventory if skuCode exists (or name, but usually skuCode is needed. We might need to generate skuCode or rely on backend. Let's see if product has skuCode)
        const skuCode = res.data.skuCode || res.data.name.toLowerCase().replace(/ /g, '-');
        return getInventory(skuCode).catch(() => ({ data: { isInStock: false, quantity: 0 } }));
      })
      .then(invRes => {
        setStock(invRes?.data?.quantity || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load product/inventory", err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity);
      refreshCart();
      addToast(`${quantity}x ${product.name} added to cart`, 'success');
    } catch (e) {
      console.error("Add to cart failed", e);
      addToast('Failed to add item to cart', 'error');
    }
  };

  if (loading) return <div className="text-center mt-4 text-muted">Loading product details...</div>;
  if (!product) return <div className="text-center mt-4 text-muted">Product not found.</div>;

  return (
    <div className="animate-fade-in-up">
      <Link to="/products" className="btn btn-outline" style={{ padding: '0.5rem 1rem', marginBottom: '2rem', display: 'inline-flex' }}>
        <ArrowLeft size={18} /> Back to Catalog
      </Link>
      
      <div className="grid grid-cols-2">
        <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          {/* We use an abstract icon or placeholder for the image since we don't have real images in DB */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '250px', height: '250px', background: 'var(--accent-gradient)', borderRadius: '50%', margin: '0 auto 2rem', opacity: 0.8, filter: 'blur(40px)' }} />
            <h1 style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '6rem', opacity: 0.1, pointerEvents: 'none' }}>NX</h1>
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
              <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${stock > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {stock > 0 ? <><PackageCheck size={16} /> In Stock ({stock} available)</> : <><PackageX size={16} /> Out of Stock</>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '10px', opacity: stock === 0 ? 0.5 : 1, pointerEvents: stock === 0 ? 'none' : 'auto' }}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.25rem' }}
              >-</button>
              <span style={{ padding: '0 1rem', fontWeight: '600' }}>{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.25rem' }}
              >+</button>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '1rem', opacity: stock === 0 ? 0.5 : 1, cursor: stock === 0 ? 'not-allowed' : 'pointer' }} 
              onClick={handleAddToCart}
              disabled={stock === 0}
            >
              <ShoppingCart size={20} /> {stock === 0 ? 'Unavailable' : 'Add to Cart'}
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
