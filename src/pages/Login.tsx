import { useState } from 'react';
import { useStore } from '../store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useStore(s => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = login(email, password);
    if (!ok) setError('Invalid credentials');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 28, color: 'var(--text)', letterSpacing: '-0.02em' }}>ETA</span>
            <span style={{ width: 1, height: 22, background: 'var(--border)' }} />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, lineHeight: 1.3, textAlign: 'left' }}>Cambridge<br />Judge</span>
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Management Platform</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 2, fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--text)' }}
              placeholder="admin@etacambridge.co.uk" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 2, fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
