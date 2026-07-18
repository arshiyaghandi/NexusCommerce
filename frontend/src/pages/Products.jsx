import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, addToCart } from '../services/api';
import { ShoppingCart, Search } from 'lucide-react';

export default function Products({ refreshCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getProducts(searchQuery)
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products", err);
        setLoading(false);
      });
  }, [searchQuery]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1);
      refreshCart();
      // You could add a toast notification here
    } catch (e) {
      console.error("Add to cart failed", e);
    }
  };

  const handleSearchSubmit = (e) => {
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
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button type="submit" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Search</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center mt-4 text-muted" style={{ padding: '3rem' }}>Loading products...</div>
      ) : (
        <div className="grid grid-cols-3">
          {products.map(product => (
            <div key={product.id} className="glass glass-card" style={{padding: '1.5rem', display: 'flex', flexDirection: 'column'}}>
              <Link to={`/products/${product.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                <div style={{ height: '150px', background: 'var(--bg-darker)', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', width: '100px', height: '100px', background: 'var(--accent-gradient)', borderRadius: '50%', filter: 'blur(30px)', opacity: 0.5 }} />
                </div>
                <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem', transition: 'color 0.2s'}} className="product-title">{product.name}</h3>
                <p className="text-muted" style={{flexGrow: 1, marginBottom: '1rem'}}>{product.description && product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description}</p>
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
            <div className="text-muted" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem' }}>No products found matching your search.</div>
          )}
        </div>
      )}
    </div>
  );
}
