import { useState, useEffect } from 'react';
import { User, Lock, Mail, Shield, KeyRound, Check, Eye, EyeOff, Package, ShoppingCart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useProfile';
import PageTransition from '../components/PageTransition';
import TiltCard from '../components/TiltCard';

const TABS = ['profile', 'security', 'activity'] as const;
type Tab = typeof TABS[number];

export default function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
    } else if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateProfileMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      addToast(res.message || 'Profile updated successfully', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update profile';
      addToast(msg, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      addToast('Please enter your current password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    try {
      const res = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      addToast(res.message || 'Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password';
      addToast(msg, 'error');
    }
  };

  const displayName = profile?.name || user?.name || user?.username || 'Customer';
  const displayUsername = profile?.username || user?.username || user?.sub || 'user';
  const roles = profile?.roles || user?.roles || [];
  const memberDate = profile?.createdTimestamp
    ? new Date(profile.createdTimestamp).toLocaleDateString()
    : null;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'U';

  return (
    <PageTransition>
      <div className="animate-fade-in-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* ── Profile Header Banner ─────────────────────────────────── */}
        <div
          className="glass glass-card"
          style={{
            padding: '2.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: '800',
                color: '#fff',
                boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.85rem' }}>{displayName}</h2>
                {roles.map((r) => {
                  const isAdmin = r.toUpperCase().includes('ADMIN');
                  return (
                    <span
                      key={r}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '20px',
                        background: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                        color: isAdmin ? '#f87171' : 'var(--accent-primary)',
                        border: isAdmin ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {r.replace('ROLE_', '')}
                    </span>
                  );
                })}
              </div>
              <p className="text-muted" style={{ margin: '0.35rem 0 0 0', fontSize: '0.95rem' }}>
                @{displayUsername} {profile?.email ? `• ${profile.email}` : ''}
              </p>
            </div>
          </div>

          {/* Quick tab switcher */}
          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              background: 'rgba(255,255,255,0.05)',
              padding: '0.3rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.55rem 1.15rem',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.25s ease',
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                {tab === 'profile' && <User size={15} />}
                {tab === 'security' && <Lock size={15} />}
                {tab === 'activity' && <Sparkles size={15} />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>
            Loading customer profile...
          </div>
        ) : (
          <>
            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="glass"
                style={{ padding: '2.5rem', borderRadius: '18px' }}
              >
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Personal Information</h3>
                  <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                    Update your personal details and contact information.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Username
                      </label>
                      <input
                        type="text"
                        disabled
                        value={displayUsername}
                        className="form-input"
                        style={{ opacity: 0.65, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                        Usernames are managed by Keycloak identity provider.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Email Address
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="form-input"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                        <Mail
                          size={16}
                          style={{
                            position: 'absolute',
                            left: '0.85rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="btn btn-primary"
                      style={{
                        padding: '0.75rem 2rem',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: updateProfileMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      <Check size={17} />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 2. Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="glass"
                style={{ padding: '2.5rem', borderRadius: '18px' }}
              >
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={24} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Security & Password</h3>
                  </div>
                  <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                    Change your password to keep your NexusCommerce account secure.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} style={{ maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Current Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="form-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      New Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="form-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="form-input"
                    />
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="btn btn-primary"
                      style={{
                        padding: '0.75rem 2rem',
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: changePasswordMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      <KeyRound size={17} />
                      {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 3. Activity & Quick Shortcuts Tab */}
            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <TiltCard maxTilt={5}>
                    <div className="glass glass-card" style={{ padding: '2rem', height: '100%', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'rgba(59,130,246,0.15)', padding: '0.75rem', borderRadius: '12px' }}>
                          <Package size={26} color="var(--accent-primary)" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.15rem' }}>Order History</h4>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>Track all your platform orders</p>
                        </div>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        View live Saga execution states, transaction statuses, and past invoices.
                      </p>
                      <Link to="/orders" className="btn btn-outline" style={{ marginTop: '1.25rem', width: '100%', textAlign: 'center', display: 'block' }}>
                        View Orders
                      </Link>
                    </div>
                  </TiltCard>

                  <TiltCard maxTilt={5}>
                    <div className="glass glass-card" style={{ padding: '2rem', height: '100%', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'rgba(16,185,129,0.15)', padding: '0.75rem', borderRadius: '12px' }}>
                          <ShoppingCart size={26} color="#10b981" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.15rem' }}>Shopping Cart</h4>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>Active reserved items</p>
                        </div>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Review items in your cart, calculate prices, and proceed to checkout.
                      </p>
                      <Link to="/cart" className="btn btn-outline" style={{ marginTop: '1.25rem', width: '100%', textAlign: 'center', display: 'block' }}>
                        Go to Cart
                      </Link>
                    </div>
                  </TiltCard>
                </div>

                <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>Account Metadata</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account ID</span>
                      <p style={{ margin: '0.25rem 0 0', fontFamily: 'monospace', fontSize: '0.85rem' }}>{profile?.id || user?.sub || '—'}</p>
                    </div>
                    {memberDate && (
                      <div>
                        <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member Since</span>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem' }}>{memberDate}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Session Status</span>
                      <p style={{ margin: '0.25rem 0 0', color: '#10b981', fontWeight: '600' }}>Active & Verified</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
