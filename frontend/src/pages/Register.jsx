import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Lock, User, Mail, UserCircle, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { register } from '../services/api';
import { useToast } from '../components/Toast';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Contains lowercase', pass: /[a-z]/.test(password) },
    { label: 'Contains number', pass: /\d/.test(password) },
  ];
  const strength = checks.filter(c => c.pass).length;
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: i < strength ? colors[strength - 1] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: strength > 0 ? colors[strength - 1] : 'var(--text-muted)' }}>
        {strength > 0 ? labels[strength - 1] : ''}
      </span>
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {checks.map((check, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: check.pass ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
            {check.pass ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.875rem 1rem 0.875rem 3rem',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.3s, box-shadow 0.3s',
  boxSizing: 'border-box'
};

const iconStyle = {
  position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)'
};

export default function Register() {
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '', email: '', firstName: '', lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    if (formData.password.length < 8) {
      addToast("Password must be at least 8 characters", "error");
      return;
    }
    if (!formData.username.trim()) {
      addToast("Username is required", "error");
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.username, formData.password, formData.email, formData.firstName, formData.lastName);
      addToast("Registration successful! Redirecting to login...", "success");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      addToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 300px)', padding: '2rem' }}>
      <div className="glass animate-fade-in-up" style={{ padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.jpg" alt="NexusCommerce Logo" style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '0.75rem', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', background: 'linear-gradient(45deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create Account</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Join NexusCommerce for exclusive premium tech</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Name Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: 'var(--text-muted)', fontSize: '0.85rem' }}>First Name</label>
              <div style={{ position: 'relative' }}>
                <div style={iconStyle}><UserCircle size={18} /></div>
                <input type="text" value={formData.firstName} onChange={handleChange('firstName')} style={inputStyle} placeholder="John" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Last Name</label>
              <div style={{ position: 'relative' }}>
                <div style={iconStyle}><UserCircle size={18} /></div>
                <input type="text" value={formData.lastName} onChange={handleChange('lastName')} style={inputStyle} placeholder="Doe" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <div style={iconStyle}><Mail size={18} /></div>
              <input type="email" value={formData.email} onChange={handleChange('email')} style={inputStyle} placeholder="john@example.com" />
            </div>
          </div>

          {/* Username */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Username <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={iconStyle}><User size={18} /></div>
              <input type="text" value={formData.username} onChange={handleChange('username')} required style={inputStyle} placeholder="Choose a username" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={iconStyle}><Lock size={18} /></div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={formData.password} 
                onChange={handleChange('password')} 
                required 
                style={inputStyle} 
                placeholder="Create a password" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrength password={formData.password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Confirm Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={iconStyle}><Lock size={18} /></div>
              <input 
                type={showConfirm ? 'text' : 'password'} 
                value={formData.confirmPassword} 
                onChange={handleChange('confirmPassword')} 
                required 
                style={{
                  ...inputStyle,
                  borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password 
                    ? 'rgba(239, 68, 68, 0.5)' 
                    : formData.confirmPassword && formData.confirmPassword === formData.password
                      ? 'rgba(16, 185, 129, 0.5)'
                      : 'rgba(255,255,255,0.1)'
                }} 
                placeholder="Confirm your password" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.confirmPassword && formData.confirmPassword !== formData.password && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <XCircle size={12} /> Passwords do not match
              </p>
            )}
            {formData.confirmPassword && formData.confirmPassword === formData.password && (
              <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> Passwords match
              </p>
            )}
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', padding: '1rem', fontSize: '1.05rem',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              marginTop: '0.5rem', boxShadow: '0 8px 32px rgba(108, 92, 231, 0.4)',
              opacity: isLoading ? 0.7 : 1
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="spin" size={20} /> : (
              <>
                <UserPlus size={20} /> Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}
