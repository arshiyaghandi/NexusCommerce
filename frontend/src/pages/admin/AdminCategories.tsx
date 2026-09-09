import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, ChevronDown, X } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { useToast } from '../../contexts/ToastContext';
import type { Category } from '../../types';

interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
}

const emptyForm: CategoryFormData = { name: '', description: '', parentId: '' };

export default function AdminCategories() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);

  const { addToast } = useToast();
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const flatCategories = categories.flatMap(c => [c, ...c.children]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      parentId: cat.parentId != null ? String(cat.parentId) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category? This will fail if products or subcategories are still assigned.')) return;
    try {
      await deleteCategory.mutateAsync(id);
      addToast('Category deleted', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete category';
      addToast(msg, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      parentId: form.parentId ? Number(form.parentId) : null,
    };
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data: payload });
        addToast('Category updated', 'success');
      } else {
        await createCategory.mutateAsync(payload);
        addToast('Category created', 'success');
      }
      setShowModal(false);
    } catch {
      addToast('Failed to save category', 'error');
    }
  };

  if (isLoading) return <div className="text-muted">Loading categories...</div>;

  return (
    <div className="glass" style={{ padding: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Manage Categories</h3>
        <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted">No categories yet.</p>
      ) : (
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
                  <button className="btn btn-outline" onClick={() => handleOpenEdit(cat)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="Edit"><Edit2 size={14} /></button>
                  <button className="btn btn-outline" onClick={() => handleDelete(cat.id)} style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title="Delete"><Trash2 size={14} /></button>
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
                    <button className="btn btn-outline" onClick={() => handleOpenEdit(child)} style={{ padding: '0.35rem', borderRadius: '6px' }} title="Edit"><Edit2 size={13} /></button>
                    <button className="btn btn-outline" onClick={() => handleDelete(child.id)} style={{ padding: '0.35rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Category Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Electronics" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description (optional)" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Parent Category (for subcategory)</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="form-input" style={{ appearance: 'none', cursor: 'pointer' }}>
                    <option value="">— Root category —</option>
                    {flatCategories
                      .filter(c => editingCategory ? c.id !== editingCategory.id : true)
                      .filter(c => c.parentId === null)
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
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
