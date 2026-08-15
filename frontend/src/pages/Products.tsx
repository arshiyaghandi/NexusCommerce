import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Tag, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useCart } from '../hooks/useCart';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import PageTransition, { staggerItem, staggerContainer } from '../components/PageTransition';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const { data: products, isLoading: productsLoading } = useProducts(
    selectedCategoryId ? undefined : searchQuery || undefined,
    selectedCategoryId ?? undefined,
  );
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart(!!user);
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
    setSelectedCategoryId(null);
    setSearchQuery(searchTerm);
  };

  const toggleExpand = (id: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCategoryClick = (id: number | null) => {
    setSelectedCategoryId(id);
    setSearchQuery('');
    setSearchTerm('');
  };

  const selectedCategoryName = selectedCategoryId
    ? categories.flatMap(c => [c, ...c.children]).find(c => c.id === selectedCategoryId)?.name
    : null;

  return (
    <PageTransition>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* ── Category Sidebar ─────────────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '220px',
            flexShrink: 0,
            position: 'sticky',
            top: '2rem',
          }}
        >
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '14px' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              Categories
            </h4>

            {/* All Products */}
            <button
              onClick={() => handleCategoryClick(null)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: '0.5rem 0.6rem', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: selectedCategoryId === null ? 'var(--accent-primary)' : 'var(--text-primary)',
                background: selectedCategoryId === null ? 'rgba(99,102,241,0.12)' : 'transparent',
                fontSize: '0.9rem', fontWeight: selectedCategoryId === null ? '600' : '400',
                marginBottom: '0.25rem', transition: 'all 0.2s',
              }}
            >
              <LayoutGrid size={14} />
              All Products
            </button>

            {categoriesLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem' }}>Loading...</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id}>
                  {/* Root category row */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => handleCategoryClick(cat.id)}
                      style={{
                        flex: 1, textAlign: 'left', background: 'none', border: 'none',
                        cursor: 'pointer', padding: '0.5rem 0.6rem', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: selectedCategoryId === cat.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: selectedCategoryId === cat.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                        fontSize: '0.9rem', fontWeight: selectedCategoryId === cat.id ? '600' : '400',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Tag size={13} />
                      {cat.name}
                    </button>
                    {cat.children.length > 0 && (
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', padding: '0.25rem', display: 'flex',
                          transition: 'transform 0.2s',
                          transform: expandedCategories.has(cat.id) ? 'rotate(90deg)' : 'none',
                        }}
                      >
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>

                  {/* Subcategories */}
                  {cat.children.length > 0 && expandedCategories.has(cat.id) && (
                    <div style={{ paddingLeft: '1rem', marginBottom: '0.25rem' }}>
                      {cat.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleCategoryClick(child.id)}
                          style={{
                            width: '100%', textAlign: 'left', background: 'none', border: 'none',
                            cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '8px',
                            color: selectedCategoryId === child.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                            background: selectedCategoryId === child.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                            fontSize: '0.82rem', fontWeight: selectedCategoryId === child.id ? '600' : '400',
                            display: 'block', transition: 'all 0.2s',
                          }}
                        >
                          ↳ {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.aside>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                {selectedCategoryName ? selectedCategoryName : 'All Products'}
              </h2>
              {selectedCategoryName && (
                <button
                  onClick={() => handleCategoryClick(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', padding: 0, marginTop: '0.25rem' }}
                >
                  ← Back to All Products
                </button>
              )}
            </div>
            <motion.form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', gap: '0.5rem', width: '280px' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
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
            </motion.form>
          </div>

          {/* Product Grid */}
          {productsLoading ? (
            <div className="text-center mt-4 text-muted" style={{ padding: '3rem' }}>Loading products...</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategoryId ?? 'all'}
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}
              >
                {products?.map((product) => (
                  <motion.div
                    key={product.id}
                    className="glass glass-card"
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                    variants={staggerItem}
                    whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                  >
                    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {/* Product image placeholder */}
                      <div style={{ height: '140px', background: 'var(--bg-darker)', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', width: '90px', height: '90px', background: 'var(--accent-gradient)', borderRadius: '50%', filter: 'blur(28px)', opacity: 0.45 }} />
                      </div>

                      {/* Category badge */}
                      {product.categoryName && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.72rem', fontWeight: '500', padding: '0.2rem 0.6rem',
                          borderRadius: '20px', marginBottom: '0.5rem',
                          background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)',
                          border: '1px solid rgba(99,102,241,0.25)',
                        }}>
                          <Tag size={10} />
                          {product.categoryName}
                        </span>
                      )}

                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{product.name}</h3>
                      <p className="text-muted" style={{ flexGrow: 1, marginBottom: '1rem', fontSize: '0.88rem' }}>
                        {product.description?.length > 65 ? product.description.substring(0, 65) + '...' : product.description}
                      </p>
                    </Link>
                    <div className="flex-between" style={{ marginTop: 'auto' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                        ${product.price}
                      </span>
                      <motion.button
                        className="btn btn-primary"
                        onClick={() => handleAddToCart(product)}
                        style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShoppingCart size={14} /> Add
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
                {products && products.length === 0 && (
                  <div className="text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                    No products found{selectedCategoryName ? ` in "${selectedCategoryName}"` : ''}.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
