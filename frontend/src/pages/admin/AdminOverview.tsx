import { DollarSign, Activity, CreditCard } from 'lucide-react';
import { useAdminTransactions, useAdminFinanceSummary } from '../../hooks/useFinance';
import AnimatedCounter from '../../components/AnimatedCounter';

export default function AdminOverview() {
  const { data: summary, isLoading } = useAdminFinanceSummary();
  const { data: transactions = [] } = useAdminTransactions();

  if (isLoading) return <div className="text-center mt-4 text-muted">Loading overview...</div>;

  const stats = [
    {
      icon: <DollarSign size={32} color="var(--accent-primary)" />,
      bg: 'rgba(59,130,246,0.1)',
      label: 'Total Revenue',
      prefix: '$',
      value: summary?.totalAmount ?? 0,
      decimals: 2,
    },
    {
      icon: <Activity size={32} color="#10b981" />,
      bg: 'rgba(16,185,129,0.1)',
      label: 'Total Transactions',
      prefix: '',
      value: summary?.transactionCount ?? 0,
      decimals: 0,
    },
    {
      icon: <CreditCard size={32} color="var(--accent-secondary)" />,
      bg: 'rgba(139,92,246,0.1)',
      label: 'Avg. Order Value',
      prefix: '$',
      value: summary?.transactionCount ? summary.totalAmount / summary.transactionCount : 0,
      decimals: 2,
    },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        {stats.map(({ icon, bg, label, prefix, value, decimals }) => (
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
        {transactions.length === 0 ? (
          <p className="text-muted">No transactions found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {['ID', 'Order ID', 'Amount', 'Type', 'Date'].map(h => (
                    <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>#{tx.id}</td>
                    <td style={{ padding: '1rem' }}>{tx.orderId}</td>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>${tx.amount}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
