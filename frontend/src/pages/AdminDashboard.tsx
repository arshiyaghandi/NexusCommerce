import { useState } from 'react';
import { Activity, DollarSign, CreditCard, Plus, Edit2, Trash2, X, Package, Tag, ChevronDown } from 'lucide-react';
import { useAdminTransactions, useAdminFinanceSummary } from '../hooks/useFinance';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import { useAdminOrders } from '../hooks/useOrders';
import { useToast } from '../contexts/ToastContext';
import type { Product, Category } from '../types';
import AnimatedCounter from '../components/AnimatedCounter';

// ─── Product form ────────────────────────────────────────────────────────────
interface ProductFormData {
  skuCode: string;
  name: string;
  description: string;
  price: string;
  categoryId: string; // stored as string in form, parsed on submit
}
const emptyProductForm: ProductFormData = { skuCode: '', name: '', description: '', price: '', categoryId: '' };

// ─── Category form ───────────────────────────────────────────────────────────
interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
}
const emptyCategoryForm: CategoryFormData = { name: '', description: '', parentId: '' };

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders'>('overview');

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(emptyProductForm);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategoryForm);

  const { addToast } = useToast();
  const { data: summary, isLoading: summaryLoading } = useAdminFinanceSummary();
  const { data: transactions = [] } = useAdminTransactions();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: orders = [], isLoading: ordersLoading } = useAdminOrders();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const loading = summaryLoading || productsLoading || ordersLoading;

  // ── Product handlers ──────────────────────────────────────────────────────
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      skuCode: product.skuCode,
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.categoryId != null ? String(product.categoryId) : '',
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
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
    const price = parseFloat(productForm.price);
    if (isNaN(price) || price < 0) { addToast('Please enter a valid price', 'error'); return; }
    const payload = {
      skuCode: productForm.skuCode,
      name: productForm.name,
      description: productForm.description,
      price,
      categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
    };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, data: payload });
        addToast('Product updated successfully', 'success');
      } else {
        await createProduct.mutateAsync(payload);
        addToast('Product created successfully', 'success');
      }
      setShowProductModal(false);
    } catch {
      addToast('Failed to save product', 'error');
    }
  };

  // ── Category handlers ─────────────────────────────────────────────────────
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description ?? '',
      parentId: cat.parentId != null ? String(cat.parentId) : '',
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category? This will fail if products or subcategories are still assigned.')) return;
    try {
      await deleteCategory.mutateAsync(id);
      addToast('Category deleted', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete category';
      addToast(msg, 'error');
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: categoryForm.name,
      description: categoryForm.description,
      parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
    };
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data: payload });
        addToast('Category updated', 'success');
      } else {
        await createCategory.mutateAsync(payload);
        addToast('Category created', 'success');
      }
      setShowCategoryModal(false);
    } catch {
      addToast('Failed to save category', 'error');
    }
  };

  // helper: flat list for parent dropdown (excluding self when editing)
  const flatCategories = categories.flatMap(c => [c, ...c.children]);

  if (loading) return <div className="text-center mt-4 text-muted">Loading dashboard...</div>;

  const TABS = ['overview', 'products', 'categories', 'orders'] as const;

  return (
    <div className="animate-fade-in-up">
      {/* ── Tab Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
                background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s', textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
            {[
              { icon: <DollarSign size={32} color="var(--accent-primary)" />, bg: 'rgba(59,130,246,0.1)', label: 'Total Revenue', prefix: '$', value: summary?.totalAmount ?? 0, decimals: 2 },
              { icon: <Activity size={32} color="#10b981" />, bg: 'rgba(16,185,129,0.1)', label: 'Total Transactions', prefix: '', value: summary?.transactionCount ?? 0, decimals: 0 },
              { icon: <CreditCard size={32} color="var(--accent-secondary)" />, bg: 'rgba(139,92,246,0.1)', label: 'Avg. Order Value', prefix: '$', value: summary?.transactionCount ? summary.totalAmount / summary.transactionCount : 0, decimals: 2 },
            ].map(({ icon, bg, label, prefix, value, decimals }) => (
              <div key={label} className="glass glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: bg, padding: '1rem', borderRadius: '12px' }}>{icon}</div>
                <div>
                  <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
                  <h3 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
                    <AnimatedCounter value={value} prefix={prefix} decimals={decimals} duration={1} />
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="glass" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Recent Transactions</h3>
            {transactions.length === 0 ? <p className="text-muted">No transactions found.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['ID', 'Order ID', 'Amount', 'Type', 'Date'].map(h => <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem' }}>#{tx.id}</td>
                        <td style={{ padding: '1rem' }}>{tx.orderId}</td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>${tx.amount}</td>
                        <td style={{ padding: '1rem' }}><span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{tx.type}</span></td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Products Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Manage Products</h3>
            <button className="btn btn-primary" onClick={handleOpenAddProduct} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Product
            </button>
          </div>
          {products.length === 0 ? <p className="text-muted">No products found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {['ID', 'SKU', 'Name', 'Category', 'Price', ''].map((h, i) => (
                    <th key={i} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>#{product.id}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{product.skuCode}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{product.name}</td>
                      <td style={{ padding: '1rem' }}>
                        {product.categoryName ? (
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
                            <Tag size={10} style={{ marginRight: '0.3rem' }} />{product.categoryName}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: '600' }}>${product.price}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline" onClick={() => handleOpenEditProduct(product)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-outline" onClick={() => handleDeleteProduct(product.id)} style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title="Delete"><Trash2 size={14} /></button>
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

      {/* ── Categories Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Manage Categories</h3>
            <button className="btn btn-primary" onClick={handleOpenAddCategory} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Category
            </button>
          </div>
          {categoriesLoading ? <p className="text-muted">Loading...</p> : categories.length === 0 ? <p className="text-muted">No categories yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categories.map(cat => (
                <div key={cat.id}>
                  {/* Root category row */}
                  <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ background: 'rgba(99,102,241,0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                        <Tag size={16} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600' }}>{cat.name}</p>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{cat.description || '—'} · {cat.children.length} subcategory(ies)</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" onClick={() => handleOpenEditCategory(cat)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-outline" onClick={() => handleDeleteCategory(cat.id)} style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {/* Subcategories */}
                  {cat.children.map(child => (
                    <div key={child.id} style={{ marginLeft: '2rem', marginTop: '0.4rem', padding: '0.75rem 1.25rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <ChevronDown size={13} style={{ transform: 'rotate(-90deg)' }} />
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{child.name}</span>
                        <span style={{ fontSize: '0.8rem' }}>— {child.description || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={() => handleOpenEditCategory(child)} style={{ padding: '0.35rem', borderRadius: '6px' }} title="Edit"><Edit2 size={13} /></button>
                        <button className="btn btn-outline" onClick={() => handleDeleteCategory(child.id)} style={{ padding: '0.35rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>All Platform Orders</h3>
          {orders.length === 0 ? <p className="text-muted">No orders found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {['Order ID', 'User ID', 'Total Price', 'Status', 'Date'].map(h => <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>#{order.id}</td>
                      <td style={{ padding: '1rem' }}>{order.userId}</td>
                      <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--accent-primary)' }}>${order.totalPrice}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', background: order.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: order.status === 'COMPLETED' ? '#10b981' : '#f59e0b' }}>{order.status}</span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Product Modal ──────────────────────────────────────────────────── */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <button onClick={() => setShowProductModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'SKU Code', key: 'skuCode', type: 'text', placeholder: 'e.g. SKU004' },
                { label: 'Product Name', key: 'name', type: 'text', placeholder: 'e.g. Mechanical Keyboard' },
                { label: 'Price ($)', key: 'price', type: 'number', placeholder: 'e.g. 99.99' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</label>
                  <input type={type} step={type === 'number' ? '0.01' : undefined} required value={productForm[key as keyof ProductFormData]} onChange={e => setProductForm({ ...productForm, [key]: e.target.value })} placeholder={placeholder} className="form-input" />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                <textarea required rows={3} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Describe the product..." className="form-input" style={{ fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Tag size={12} style={{ marginRight: '0.3rem' }} /> Category (optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={productForm.categoryId}
                    onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="form-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">— No category —</option>
                    {categories.map(cat => (
                      <optgroup key={cat.id} label={cat.name}>
                        <option value={cat.id}>{cat.name}</option>
                        {cat.children.map(child => (
                          <option key={child.id} value={child.id}>↳ {child.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
                <button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', opacity: createProduct.isPending || updateProduct.isPending ? 0.7 : 1 }}>
                  {createProduct.isPending || updateProduct.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Category Modal ─────────────────────────────────────────────────── */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <button onClick={() => setShowCategoryModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmitCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Name *</label>
                <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Electronics" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                <input type="text" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Short description (optional)" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Parent Category (for subcategory)</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={categoryForm.parentId}
                    onChange={e => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                    className="form-input"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">— Root category —</option>
                    {flatCategories
                      .filter(c => editingCategory ? c.id !== editingCategory.id : true)
                      .filter(c => c.parentId === null) // only roots can be parents (1 level)
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
                <button type="submit" disabled={createCategory.isPending || updateCategory.isPending} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', opacity: createCategory.isPending || updateCategory.isPending ? 0.7 : 1 }}>
                  {createCategory.isPending || updateCategory.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
