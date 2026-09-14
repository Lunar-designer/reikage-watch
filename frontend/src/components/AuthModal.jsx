import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert, CheckCircle, Lock, User, KeyRound } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, login, register, openAuthModal } = useAuth();
  const [mode, setMode] = useState(authModalMode || 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep internal mode in sync when context updates
  React.useEffect(() => {
    setMode(authModalMode);
    setError('');
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await register(username, password, confirmPassword);
      }
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn-icon btn-ghost"
          onClick={closeAuthModal}
          style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-secondary)' }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.svg" alt="Reikage" width="48" height="48" style={{ marginBottom: '8px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.04em' }}>
            {mode === 'login' ? 'SIGN IN TO REIKAGE' : 'JOIN THE REIKAGE CLAN'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {mode === 'login'
              ? 'Access match uploads, private scrims, and your creator studio.'
              : 'Direct clan account creation. No external Google/Gmail required.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#000000' : 'var(--text-secondary)',
              padding: '8px',
              borderRadius: 'var(--radius-xs)'
            }}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#000000' : 'var(--text-secondary)',
              padding: '8px',
              borderRadius: 'var(--radius-xs)'
            }}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger-text)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              REIKAGE USERNAME
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. shadow_sniper"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', paddingLeft: '38px' }}
              />
              <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingLeft: '38px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px', padding: '12px' }}
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to Reikage Watch'
              : 'Create Reikage Account'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11.5px',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ fontWeight: 800, color: '#e0e0e0', marginBottom: '4px' }}>Demo Clan Accounts:</div>
          <div>Admin Staff: <span style={{ color: '#fff' }}>reikage_admin</span> / <span style={{ color: '#fff' }}>Admin123!</span></div>
          <div>Pro Creator: <span style={{ color: '#fff' }}>lunar_reikage</span> / <span style={{ color: '#fff' }}>Lunar123!</span></div>
        </div>
      </div>
    </div>
  );
}
