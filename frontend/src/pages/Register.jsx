import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Lock, User, Loader2 } from 'lucide-react';
import { register } from '../services/api';
import { useToast } from '../components/Toast';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }

    setIsLoading(true);
    try {
      await register(username, password);
      addToast("Registration successful! Please log in.", "success");
      // Wait a moment before redirecting to login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      addToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 300px)', padding: '2rem' }}>
      <div className="glass animate-fade-in-up" style={{ padding: '3rem', borderRadius: '24px', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.jpg" alt="NexusCommerce Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'linear-gradient(45deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create Account</h2>
          <p className="text-muted">Join NexusCommerce for exclusive premium tech</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem 1rem 1rem 3rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                placeholder="Choose a username"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem 1rem 1rem 3rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                placeholder="Create a password"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem 1rem 1rem 3rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              boxShadow: '0 8px 32px rgba(108, 92, 231, 0.4)'
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="spin" size={20} /> : (
              <>Sign Up <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}
