import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart, User, Package, LogOut } from 'lucide-react';

export default function Layout({ user, cartItemCount }) {
  return (
    <div className="container">
      <nav className="navbar glass">
        <div className="nav-content container">
          <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpg" alt="NexusCommerce Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
            NexusCommerce
          </Link>
          
          <div className="nav-links">
            <Link to="/products" className="nav-link">Products</Link>
            {user && !user.error ? (
              <>
                {user.roles && user.roles.includes('ROLE_ADMIN') && (
                  <Link to="/admin" className="nav-link" style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>
                    Dashboard
                  </Link>
                )}
                <Link to="/orders" className="nav-link flex-between" style={{gap: '0.5rem'}}>
                  <Package size={18} /> Orders
                </Link>
                <Link to="/cart" className="nav-link flex-between" style={{gap: '0.5rem'}}>
                  <ShoppingCart size={18} /> 
                  Cart {cartItemCount > 0 && <span style={{background: 'var(--accent-primary)', color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '12px'}}>{cartItemCount}</span>}
                </Link>
                <div className="nav-link flex-between" style={{gap: '0.5rem', color: 'var(--accent-secondary)'}}>
                  <User size={18} /> {user.name}
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                  }}
                  className="btn btn-outline flex-between" 
                  style={{gap: '0.5rem', padding: '0.5rem 1rem'}}
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary flex-between" style={{gap: '0.5rem'}}>
                <User size={18} /> Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Outlet />
      </main>

      <footer className="glass" style={{ marginTop: '4rem', padding: '3rem 2rem', borderRadius: 'var(--border-radius) var(--border-radius) 0 0', borderBottom: 'none' }}>
        <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
          <div>
            <h3 className="nav-brand" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>NexusCommerce</h3>
            <p className="text-muted">Elevating your lifestyle with premium products, secure payments, and lightning-fast delivery.</p>
          </div>
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/" className="text-muted" style={{ textDecoration: 'none' }}>Home</Link>
              <Link to="/products" className="text-muted" style={{ textDecoration: 'none' }}>Products</Link>
              <Link to="/cart" className="text-muted" style={{ textDecoration: 'none' }}>Cart</Link>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Contact</h4>
            <p className="text-muted">support@nexuscommerce.com</p>
            <p className="text-muted">+1 (555) 123-4567</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} NexusCommerce. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
