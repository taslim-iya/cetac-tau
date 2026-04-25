import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { isRemoteLoaded } from '../lib/sync';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showAccounts, setShowAccounts] = useState(false);
  const [ready, setReady] = useState(false);
  const login = useStore(s => s.login);
  const users = useStore(s => s.users);

  // Wait for remote sync to actually complete
  useEffect(() => {
    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      if (isRemoteLoaded() || checks >= 25) { // 25 * 200ms = 5 seconds max
        setReady(true);
        clearInterval(interval);
      }
    }, 200);
    // Also check immediately in case it loaded already
    if (isRemoteLoaded()) { setReady(true); clearInterval(interval); }
    return () => clearInterval(interval);
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const attemptLogin = async (userEmail: string, userPassword: string) => {
    setError('');
    setSubmitting(true);
    try {
      const ok = await login(userEmail, userPassword);
      if (!ok) {
        // If your account was just created on another device and you're seeing
        // this, ask the admin who added you to refresh their browser once —
        // that pushes their local-only changes to the shared store.
        setError('Invalid email or password. If you were just added, ask the admin to refresh their browser.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void attemptLogin(email, password);
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    void attemptLogin(userEmail, userPassword);
  };

  if (!ready) {
    return (
      <div className="login-container">
        <div className="login-box" style={{ textAlign: 'center', padding: 40 }}>
          <img src="/logo.jpg" alt="Cambridge ETA Club" style={{ height: 48, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.jpg" alt="Cambridge ETA Club" style={{ height: 48, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Management Platform</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 2, fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--text)' }}
              placeholder="name@etacambridge.co.uk" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 2, fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 12, fontWeight: 600 }}>{error}</div>}
          <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button onClick={() => setShowAccounts(!showAccounts)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', textDecoration: 'underline', fontFamily: 'var(--sans)', width: '100%', textAlign: 'center' }}>
            {showAccounts ? 'Hide accounts' : `Show accounts (${users.length})`}
          </button>
          {showAccounts && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
              {users.map(u => (
                <button key={u.id} onClick={() => quickLogin(u.email, u.password)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', cursor: 'pointer', textAlign: 'left', gap: 8, fontSize: 11, fontFamily: 'var(--sans)', color: 'var(--text)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: u.role === 'super_admin' ? 'var(--gold-light)' : 'var(--blue-light)', color: u.role === 'super_admin' ? 'var(--gold)' : 'var(--blue)', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {u.role === 'super_admin' ? 'Admin' : 'Member'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
