import { useState } from 'react';
import AdminOverview from './admin/AdminOverview';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminOrders from './admin/AdminOrders';

const TABS = ['overview', 'products', 'categories', 'orders'] as const;
type Tab = typeof TABS[number];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="animate-fade-in-up">
      {/* ── Tab Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '500',
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

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      {activeTab === 'overview'    && <AdminOverview />}
      {activeTab === 'products'    && <AdminProducts />}
      {activeTab === 'categories'  && <AdminCategories />}
      {activeTab === 'orders'      && <AdminOrders />}
    </div>
  );
}
