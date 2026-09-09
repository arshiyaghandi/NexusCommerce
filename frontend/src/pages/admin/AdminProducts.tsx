import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, ChevronDown, X } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../contexts/ToastContext';
import type { Product } from '../../types';

interface ProductFormData {
  skuCode: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
}

const emptyForm: ProductFormData = { skuCode: '', name: '', description: '', price: '', categoryId: '' };

export default function AdminProducts() {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);

  const { addToast } = useToast();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      skuCode: product.skuCode,
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.categoryId != null ? String(product.categoryId) : '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { addToast('Please enter a valid price', 'error'); return; }
    const payload = {
      skuCode: form.skuCode,
      name: form.name,
      description: form.description,
      price,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
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

  if (isLoading) return <div className="text-muted">Loading products...</div>;

  return (
    <div className="glass" style={{ padding: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Manage Products</h3>
        <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-muted">No products found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['ID', 'SKU', 'Name', 'Category', 'Price', ''].map((h, i) => (
                  <th key={i} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
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
                      <button className="btn btn-outline" onClick={() => handleOpenEdit(product)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-outline" onClick={() => handleDelete(product.id)} style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Product Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'SKU Code', key: 'skuCode', type: 'text', placeholder: 'e.g. SKU004' },
                { label: 'Product Name', key: 'name', type: 'text', placeholder: 'e.g. Mechanical Keyboard' },
                { label: 'Price ($)', key: 'price', type: 'number', placeholder: 'e.g. 99.99' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</label>
                  <input type={type} step={type === 'number' ? '0.01' : undefined} required value={form[key as keyof ProductFormData]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="form-input" />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                <textarea required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the product..." className="form-input" style={{ fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Tag size={12} style={{ marginRight: '0.3rem' }} /> Category (optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="form-input" style={{ appearance: 'none', cursor: 'pointer' }}>
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
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
                <button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', opacity: createProduct.isPending || updateProduct.isPending ? 0.7 : 1 }}>
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
