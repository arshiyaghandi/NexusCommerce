import { useState, useEffect } from 'react';
import { fetchRevenue, fetchTransactions } from "../services/api";
import { Activity, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revenueData, txData] = await Promise.all([
          fetchRevenue(),
          fetchTransactions()
        ]);
        setSummary(revenueData);
        setTransactions(txData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load admin data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-4 text-muted">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in-up">
      <h2 style={{ marginBottom: '2rem' }}>Admin Dashboard</h2>
      
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
    </div>
  );
}
