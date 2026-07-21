import { useState } from 'react';
import { Activity, DollarSign, CreditCard, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useTransactions, useFinanceSummary } from '../hooks/useFinance';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { useToast } from '../contexts/ToastContext';
import type { Product } from '../types';

interface ProductFormData {
  skuCode: string;
  name: string;
  description: string;
  price: string;
}

const emptyForm: ProductFormData = { skuCode: '', name: '', description: '', price: '' };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);

  const { addToast } = useToast();
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary();
  const { data: transactions = [] } = useTransactions();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const loading = summaryLoading || productsLoading;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      skuCode: product.skuCode,
      name: product.name,
      description: product.description,
      price: String(product.price),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct.mutateAsync(id);
      addToast('Product deleted successfully', 'success');
    } catch {
      addToast('Failed to delete product', 'error');
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      addToast('Please enter a valid price', 'error');
      return;
    }
    const payload = { ...formData, price };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, data: payload });
        addToast('Product updated successfully', 'success');
      } else {
        await createProduct.mutateAsync(payload);
        addToast('Product created successfully', 'success');
      }
      setShowModal(false);
    } catch {
      addToast('Failed to save product', 'error');
    }
  };

  if (loading) return <div className="text-center mt-4 text-muted">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
          {(['overview', 'products'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
                background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
            <div className="glass glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <DollarSign size={32} color="var(--accent-primary)" />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</p>
                <h3 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>${summary?.totalAmount?.toFixed(2) ?? '0.00'}</h3>
              </div>
            </div>

            <div className="glass glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <Activity size={32} color="#10b981" />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Transactions</p>
                <h3 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>{summary?.transactionCount ?? 0}</h3>
              </div>
            </div>

            <div className="glass glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                <CreditCard size={32} color="var(--accent-secondary)" />
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg. Order Value</p>
                <h3 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
                  ${summary?.transactionCount ? (summary.totalAmount / summary.transactionCount).toFixed(2) : '0.00'}
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
                      {['ID', 'Order ID', 'Amount', 'Type', 'Date'].map((h) => (
                        <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem' }}>#{tx.id}</td>
                        <td style={{ padding: '1rem' }}>{tx.orderId}</td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>${tx.amount}</td>
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem',
                              background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                            }}
                          >
                            {tx.type}
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
                    {['ID', 'SKU', 'Name', 'Description', 'Price', ''].map((h, i) => (
                      <th key={i} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>#{product.id}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{product.skuCode}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{product.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.description}</td>
                      <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: '600' }}>${product.price}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline" onClick={() => handleOpenEdit(product)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => handleDelete(product.id)}
                            style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            title="Delete"
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

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          }}
        >
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>

            <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>SKU Code</label>
                <input type="text" required value={formData.skuCode} onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })} placeholder="e.g. SKU004" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Product Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Mechanical Keyboard" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the product details..."
                  className="form-input"
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Price ($)</label>
                <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="e.g. 99.99" className="form-input" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '0.75rem' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem', opacity: createProduct.isPending || updateProduct.isPending ? 0.7 : 1 }}
                >
                  {createProduct.isPending || updateProduct.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
