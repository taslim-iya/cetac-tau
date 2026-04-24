import { useState, useEffect } from 'react';
import { useStore } from '../store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(true);
  const login = useStore(s => s.login);
  const users = useStore(s => s.users);

  // Wait for remote sync to complete before enabling login
  useEffect(() => {
    // Check every 200ms if users have loaded (max 3 seconds)
    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      const currentUsers = useStore.getState().users;
      if (currentUsers.length > 1 || checks >= 15) {
        setLoading(false);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const ok = login(email, password);
    if (!ok) {
      // Debug: log what we're comparing
      const currentUsers = useStore.getState().users;
      console.log('[CETAC Login] Failed attempt:', {
        input: { email: email.trim().toLowerCase(), password: password.trim() },
        availableEmails: currentUsers.map(u => u.email),
        userCount: currentUsers.length,
      });
      setError(`Invalid credentials. ${currentUsers.length} accounts loaded.`);
    }
  };

  const quickLogin = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    // Small delay to ensure state is set before login fires
    setTimeout(() => login(e, p), 50);
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-box" style={{ textAlign: 'center', padding: 40 }}>
          <img src="/logo.jpg" alt="Cambridge ETA Club" style={{ height: 48, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading accounts...</div>
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
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}>
            Sign In
          </button>
        </form>

        {/* Quick login - always visible, easier access */}
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button onClick={() => setShowAccounts(!showAccounts)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', textDecoration: 'underline', fontFamily: 'var(--sans)', width: '100%', textAlign: 'center' }}>
            {showAccounts ? 'Hide accounts' : `Show available accounts (${users.length})`}
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
              {users.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: 8 }}>No accounts loaded — try refreshing</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
