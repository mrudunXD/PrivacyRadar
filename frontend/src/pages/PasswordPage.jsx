import { useState } from 'react';

// Hash password with SHA-1 using Web Crypto API (browser-native, no dependencies)
async function sha1(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Check HIBP Pwned Passwords API via k-Anonymity
async function checkPassword(password) {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  });
  if (!res.ok) throw new Error('HIBP API unavailable');

  const text = await res.text();
  const lines = text.split('\r\n');

  for (const line of lines) {
    const [hashSuffix, countStr] = line.split(':');
    if (hashSuffix === suffix) {
      return { found: true, count: parseInt(countStr, 10) };
    }
  }
  return { found: false, count: 0 };
}

function StrengthMeter({ password }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#FF3B3B', '#F59E0B', '#F59E0B', '#0EA5E9', '#10B981'];

  if (!password) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: i <= score ? colors[score] : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '11px', fontFamily: 'Space Mono', color: colors[score] }}>
        {labels[score]}
      </div>
    </div>
  );
}

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await checkPassword(password);
      setResult(data);
    } catch (err) {
      setError('Could not reach HIBP API. Please try again later.');
    }
    setLoading(false);
  };

  const isBreached = result?.found;
  const countDisplay = result?.count
    ? result.count >= 1000000
      ? `${(result.count / 1000000).toFixed(1)}M`
      : result.count >= 1000
        ? `${(result.count / 1000).toFixed(0)}K`
        : String(result.count)
    : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block', padding: '6px 16px', marginBottom: '16px',
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: '20px', fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--accent-primary)',
          }}>
            🔒 ZERO KNOWLEDGE — YOUR PASSWORD NEVER LEAVES YOUR DEVICE
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,42px)', marginBottom: '12px' }}>
            Password <span className="gradient-text">Breach Checker</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
            Check if your password has appeared in known data breaches — without ever sending it to any server.
          </p>
        </div>

        {/* How it works (collapsed explanation) */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(0,212,255,0.03)' }}>
          <div style={{ fontSize: '13px', fontFamily: 'Space Mono', color: 'var(--accent-primary)', marginBottom: '12px' }}>⚙️ HOW k-ANONYMITY WORKS</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: 'JetBrains Mono' }}>
            {[
              ['1.', 'Your password is hashed with SHA-1 in your browser'],
              ['2.', 'Only the first 5 characters of the hash are sent to HIBP'],
              ['3.', 'HIBP returns ~500 matching hashes'],
              ['4.', 'We check locally if your full hash is in the list'],
              ['5.', 'Your actual password never leaves your device ✓'],
            ].map(([step, desc]) => (
              <div key={step} style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>{step}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Input form */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <form onSubmit={handleCheck}>
            <label style={{ display: 'block', fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              ENTER PASSWORD TO CHECK
            </label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                id="password-input"
                className="input-field"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter any password..."
                autoComplete="off"
                style={{ paddingRight: '60px', fontFamily: 'JetBrains Mono', letterSpacing: show ? '0' : '3px' }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: '18px',
                }}
              >
                {show ? '🙈' : '👁'}
              </button>
            </div>
            <StrengthMeter password={password} />
            <button
              type="submit"
              className="btn-primary"
              disabled={!password || loading}
              style={{ width: '100%', marginTop: '20px', fontSize: '15px', padding: '14px', opacity: (!password || loading) ? 0.6 : 1 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                  Checking...
                </span>
              ) : 'CHECK PASSWORD'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="card" style={{ padding: '20px', borderColor: 'rgba(255,59,59,0.4)', background: 'rgba(255,59,59,0.05)' }}>
            <p style={{ color: 'var(--accent-danger)', fontFamily: 'Space Mono', fontSize: '13px' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card" style={{
            padding: '28px',
            borderColor: isBreached ? 'rgba(255,59,59,0.5)' : 'rgba(16,185,129,0.5)',
            background: isBreached ? 'rgba(255,59,59,0.05)' : 'rgba(16,185,129,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '48px' }}>{isBreached ? '⚠️' : '✅'}</div>
              <div>
                <div style={{
                  fontSize: '20px', fontFamily: 'Space Mono', fontWeight: 700,
                  color: isBreached ? 'var(--accent-danger)' : 'var(--accent-success)',
                  marginBottom: '4px',
                }}>
                  {isBreached ? 'COMPROMISED' : 'NOT FOUND'}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {isBreached
                    ? `This password has been seen ${countDisplay} times in data breach databases.`
                    : 'This password was not found in any known breach database.'}
                </div>
              </div>
            </div>

            {isBreached && (
              <>
                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                  🔴 You should change this password <strong style={{ color: 'var(--text-primary)' }}>everywhere you use it — immediately.</strong> Attackers use automated tools to test breached passwords on bank accounts, email, and social media.
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <a href="https://bitwarden.com" target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 20px' }}>
                    Get Bitwarden (Free) →
                  </a>
                  <button className="btn-outline" onClick={() => { setPassword(''); setResult(null); }} style={{ fontSize: '13px' }}>
                    Check Another
                  </button>
                </div>
              </>
            )}

            {!isBreached && (
              <>
                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  ✅ Good news — but remember: use a unique password for every site and enable 2FA on your critical accounts.
                </div>
              </>
            )}
          </div>
        )}

        {/* SHA-1 transparency note */}
        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', lineHeight: 1.8 }}>
          Powered by{' '}
          <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            HIBP Pwned Passwords
          </a>
          {' '}· k-Anonymity protocol · Web Crypto API · No server logs
        </div>
      </div>
    </div>
  );
}
