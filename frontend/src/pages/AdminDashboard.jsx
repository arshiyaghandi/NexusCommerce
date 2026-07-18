import { useState, useEffect } from 'react';
import { fetchRevenue, fetchTransactions, getProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import { Activity, DollarSign, CreditCard, ShoppingBag, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'products'
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ skuCode: '', name: '', description: '', price: '' });
  const [saving, setSaving] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revenueData, txData, productsData] = await Promise.all([
        fetchRevenue(),
        fetchTransactions(),
        getProducts()
      ]);
      setSummary(revenueData.data);
      setTransactions(txData.data);
      setProducts(productsData.data || []);
    } catch (err) {
      console.error("Failed to load admin data", err);
      addToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ skuCode: '', name: '', description: '', price: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      skuCode: product.skuCode || '',
      name: product.name || '',
      description: product.description || '',
      price: product.price || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      addToast("Product deleted successfully", "success");
      // Refresh list
      const res = await getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error("Delete failed", err);
      addToast("Failed to delete product", "error");
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price)
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        addToast("Product updated successfully", "success");
      } else {
        await createProduct(payload);
        addToast("Product created successfully", "success");
      }
      setShowModal(false);
      // Refresh list
      const res = await getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error("Save product failed", err);
      addToast("Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-4 text-muted">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        
        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
              background: activeTab === 'overview' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'overview' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.3s'
            }}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            style={{
              padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
              background: activeTab === 'products' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'products' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.3s'
            }}
          >
            Products
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
            <div className="glass glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <DollarSign size={32} color="var(--accent-primary)" />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</p>
                <h3 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>${summary?.totalRevenue?.toFixed(2) || '0.00'}</h3>
              </div>
            </div>

            <div className="glass glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <Activity size={32} color="#10b981" />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Transactions</p>
                <h3 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>{summary?.transactionCount || 0}</h3>
              </div>
            </div>

            <div className="glass glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <CreditCard size={32} color="var(--accent-secondary)" />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg. Order Value</p>
                <h3 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
                  ${summary?.transactionCount ? (summary.totalRevenue / summary.transactionCount).toFixed(2) : '0.00'}
                </h3>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-muted">No transactions found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>ID</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Order ID</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Amount</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Status</th>
                      <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem' }}>#{tx.id}</td>
                        <td style={{ padding: '1rem' }}>{tx.orderId}</td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                          ${tx.amount}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '20px', 
                            fontSize: '0.85rem',
                            background: tx.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: tx.status === 'COMPLETED' ? '#10b981' : '#ef4444'
                          }}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Products Tab */
        <div className="glass" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Manage Products</h3>
            <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <p className="text-muted">No products found. Click 'Add Product' to create one.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>ID</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>SKU</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Price</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>#{product.id}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{product.skuCode}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{product.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: '600' }}>${product.price}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => handleOpenEdit(product)}
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => handleDelete(product.id)}
                            style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={20} color="var(--accent-primary)" />
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            
            <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>SKU Code</label>
                <input
                  type="text"
                  required
                  value={formData.skuCode}
                  onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                  placeholder="e.g. SKU004"
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mechanical Keyboard"
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the product details..."
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 99.99"
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
