import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, addToCart } from '../services/api';
import { ShoppingCart } from 'lucide-react';

export default function Products({ refreshCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products", err);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1);
      refreshCart();
      // You could add a toast notification here
    } catch (e) {
      console.error("Add to cart failed", e);
    }
  };

  if (loading) return <div className="text-center mt-4 text-muted">Loading products...</div>;

  return (
    <div className="animate-fade-in-up">
      <h2 style={{marginBottom: '2rem'}}>Our Products</h2>
      <div className="grid grid-cols-3">
        {products.map(product => (
          <div key={product.id} className="glass glass-card" style={{padding: '1.5rem', display: 'flex', flexDirection: 'column'}}>
            <Link to={`/products/${product.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
              <div style={{ height: '150px', background: 'var(--bg-darker)', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', width: '100px', height: '100px', background: 'var(--accent-gradient)', borderRadius: '50%', filter: 'blur(30px)', opacity: 0.5 }} />
              </div>
              <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem', transition: 'color 0.2s'}} className="product-title">{product.name}</h3>
              <p className="text-muted" style={{flexGrow: 1, marginBottom: '1rem'}}>{product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description}</p>
            </Link>
            <div className="flex-between" style={{ marginTop: 'auto' }}>
              <span style={{fontSize: '1.25rem', fontWeight: '600', color: 'var(--accent-primary)'}}>
                ${product.price}
              </span>
              <button className="btn btn-primary" onClick={() => handleAddToCart(product)}>
                <ShoppingCart size={16} /> Add
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-muted">No products available at the moment.</div>
        )}
      </div>
    </div>
  );
}
