import { useState, useEffect, useCallback } from 'react';

const FEATURES = [
  {
    icon: '🔍',
    title: 'Breach Detection',
    desc: 'Check against 14+ databases including HaveIBeenPwned, XposedOrNot, and IntelligenceX. Real-time results in under 90 seconds.',
  },
  {
    icon: '🤖',
    title: 'AI Risk Analysis',
    desc: 'Google Gemini AI reads your results and explains your real risk in plain English — not technical jargon.',
  },
  {
    icon: '📸',
    title: 'EXIF Metadata Check',
    desc: 'Upload a photo to see hidden GPS coordinates, device info, and timestamps embedded in your images.',
  },
  {
    icon: '⚖️',
    title: 'Legal Takedown Letters',
    desc: 'Generate DPDP Act 2023 compliant erasure requests to remove your data from brokers and platforms.',
  },
  {
    icon: '🔐',
    title: 'Password Breach Check',
    desc: 'Check if any of your passwords have appeared in known breaches using k-Anonymity — nothing ever leaves your device.',
  },
  {
    icon: '📄',
    title: 'PDF Report Export',
    desc: 'Download a complete privacy report to share with your organisation, legal team, or for your own records.',
  },
];

export default function LandingPage({ onScan }) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState(null);
  const [scanCount, setScanCount] = useState(14832);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (d.scans_completed) setScanCount(d.scans_completed); })
      .catch(() => {});
  }, []);

  const detectType = useCallback((val) => {
    if (!val) return null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'email';
    if (/^\+?[\d\s\-(). ]{9,15}$/.test(val)) return 'phone';
    if (/^[a-zA-Z0-9][a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}$/.test(val)) return 'domain';
    return 'username';
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onScan({ value: input.trim(), type: inputType || 'username' });
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 24px 72px', maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
        {/* Eyebrow label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', marginBottom: '28px',
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '6px', fontSize: '12px', fontWeight: '600',
          color: 'var(--blue)', letterSpacing: '0.3px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Open-source · CIPHATHO 2026
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, marginBottom: '20px', color: 'var(--text)', lineHeight: 1.1 }}>
          Find out what the internet
          <br />
          knows about <span style={{ color: 'var(--blue)' }}>you</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 40px' }}>
          PrivacyRadar scans breach databases, social platforms, and dark web indices to give you a complete picture of your digital exposure — in 90 seconds.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '560px', margin: '0 auto 16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              id="scan-input"
              className="input"
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setInputType(detectType(e.target.value)); }}
              placeholder="Enter your email, username, or phone number"
              autoComplete="off"
              style={{ paddingRight: inputType ? '88px' : '14px' }}
            />
            {inputType && (
              <span style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '11px', fontWeight: '600', color: 'var(--blue)',
                background: 'var(--blue-dim)', padding: '2px 8px', borderRadius: '4px',
                fontFamily: 'JetBrains Mono',
              }}>
                {inputType}
              </span>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            Scan Now
          </button>
        </form>

        {/* Trust line */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-faint)' }}>
          <span>No account required</span>
          <span>·</span>
          <span>Nothing is stored</span>
          <span>·</span>
          <span>{scanCount.toLocaleString()} scans completed</span>
          <span>·</span>
          <span>DPDP Act 2023 compliant</span>
        </div>
      </section>

      {/* ── Powered by strip ── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '14px 24px' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>
            Data sources
          </span>
          {['HaveIBeenPwned', 'XposedOrNot', 'IntelligenceX', 'Shodan', 'WhatsMyName', 'Ahmia', 'EmailRep', 'BreachDirectory'].map(s => (
            <span key={s} style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{s}</span>
          ))}
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>+ 6 more</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <section style={{ padding: '64px 24px' }}>
        <div className="container">
          <div className="grid-3">
            {[
              { value: '29.5B+', label: 'Records in breach databases', sublabel: 'Monitored continuously' },
              { value: '77%',    label: 'People unaware of their exposure', sublabel: 'Based on industry research' },
              { value: '₹5,800Cr', label: 'Annual identity fraud in India', sublabel: 'RBI Annual Report 2024' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-value" style={{ color: 'var(--blue)' }}>{s.value}</div>
                <div style={{ fontSize: '14px', color: 'var(--text)', marginTop: '6px', fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>{s.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '64px 24px', borderTop: '1px solid var(--border)', background: 'rgba(30,41,59,0.4)' }}>
        <div className="container">
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', marginBottom: '10px' }}>Everything in one place</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
              A complete privacy toolkit — from breach detection to legal action.
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '24px', marginBottom: '14px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', marginBottom: '40px' }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { n: '1', title: 'Enter your identifier', desc: 'Type your email address, username, phone number, or domain. PrivacyRadar auto-detects what type of data you\'ve entered.' },
              { n: '2', title: 'We scan 14+ sources in parallel', desc: 'Our backend queries HaveIBeenPwned, XposedOrNot, IntelligenceX, Shodan, WhatsMyName, and more — simultaneously.' },
              { n: '3', title: 'AI analyses your results', desc: 'Google Gemini reads the raw data and writes a plain-English summary of your real exposure and what to do next.' },
              { n: '4', title: 'Take action', desc: 'Work through the remediation checklist, generate a DPDP legal letter, export a PDF report, or check your passwords.' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: '24px', padding: '28px 0',
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--blue-dim)', color: 'var(--blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px',
                }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>{s.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid var(--border)', background: 'rgba(30,41,59,0.4)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', marginBottom: '12px' }}>
          Start your free privacy scan
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          No account. No data stored. 90 seconds.
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => document.getElementById('scan-input')?.focus()}
        >
          Start Scan →
        </button>
      </section>
    </div>
  );
}
