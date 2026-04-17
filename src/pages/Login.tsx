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
          <div style={{ width: 48, height: 48, borderRadius: 4, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'var(--serif)', marginBottom: 16 }}>C</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>CETAC</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Cambridge ETA & Acquisition Club</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--text)' }}
              placeholder="admin@etacambridge.co.uk" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12, fontWeight: 500 }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
