import { useState, useEffect, useCallback } from 'react';

const PLACEHOLDERS = [
  'Try your email address...',
  'Try your username...',
  'Try a phone number...',
  'Try a domain name...',
];

const FEATURES = [
  {
    icon: '🎯',
    title: 'Digital Risk Score',
    desc: 'Instant 0–100 score with category breakdown across credential leaks, PII, dark web presence.',
    preview: (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '48px', fontFamily: 'JetBrains Mono', color: '#FF3B3B', fontWeight: 700 }}>74</div>
        <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono', marginTop: '4px' }}>HIGH RISK</div>
        <div style={{ marginTop: '12px', height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '74%', background: 'linear-gradient(90deg,#FF3B3B,#F59E0B)', borderRadius: '3px' }} />
        </div>
      </div>
    ),
  },
  {
    icon: '📸',
    title: 'EXIF Metadata Stripper',
    desc: 'Upload any photo to reveal hidden GPS coordinates, device model, and timestamp — then strip it.',
    preview: (
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', lineHeight: 1.8 }}>
        <div style={{ color: '#FF3B3B' }}>📍 GPS: 18.9220°N, 72.8347°E</div>
        <div>📱 Device: iPhone 14 Pro</div>
        <div>📅 Taken: Mar 15, 2024</div>
      </div>
    ),
  },
  {
    icon: '🤖',
    title: 'AI Risk Narrative',
    desc: 'Gemini AI translates your scan results into a plain-English explanation with specific action steps.',
    preview: (
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
        "Your email was found in 4 major breaches. Automated bots may be testing your credentials on banking and social sites right now..."
      </div>
    ),
  },
  {
    icon: '⚖️',
    title: 'Legal Takedown Letter',
    desc: 'Auto-generate DPDP Act 2023 compliant notices to demand data brokers erase your records.',
    preview: (
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', lineHeight: 1.8 }}>
        <div style={{ color: 'var(--accent-primary)', marginBottom: '4px' }}>REMOVAL REQUEST</div>
        <div>Section 13, DPDP Act 2023</div>
        <div>Immediately erase personal data</div>
        <div style={{ color: 'var(--accent-success)' }}>✓ Legally compliant</div>
      </div>
    ),
  },
];

const STATS_DISPLAY = [
  { value: '29.5B+', label: 'Records in breach databases' },
  { value: '77%', label: 'People unaware of exposure' },
  { value: '₹5,800Cr', label: 'Annual data fraud losses in India' },
];

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function AnimatedCounter({ value }) {
  const num = useCountUp(value);
  return <>{num.toLocaleString()}</>;
}

export default function LandingPage({ onScan, onExifClick }) {
  const [input, setValue] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [inputType, setInputType] = useState(null);
  const [liveScanTarget, setLiveScanTarget] = useState(14832);
  const scanCount = useCountUp(liveScanTarget);

  // Fetch live scan count from backend
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (d.scans_completed) setLiveScanTarget(d.scans_completed); })
      .catch(() => {}); // silently fallback to default
  }, []);

  // Cycling placeholder
  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  // Input type detection
  const detectType = useCallback((val) => {
    if (!val) return null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'email';
    if (/^\+?[\d\s\-().]{9,15}$/.test(val)) return 'phone';
    if (/^[a-zA-Z0-9][a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}$/.test(val)) return 'domain';
    return 'username';
  }, []);

  const handleChange = e => {
    setValue(e.target.value);
    setInputType(detectType(e.target.value));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!input.trim()) return;
    onScan({ value: input.trim(), type: inputType || 'username' });
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 60px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: '20px', padding: '6px 16px', marginBottom: '32px',
          fontSize: '12px', color: 'var(--accent-primary)', fontFamily: 'Space Mono',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block', animation: 'pulse-glow 2s ease-in-out infinite' }} />
          CIPHATHO 26' · CIPH-PS-007 · Team CipherX
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', lineHeight: 1.1, marginBottom: '20px', maxWidth: '800px' }}>
          KNOW YOUR{' '}
          <span className="gradient-text">EXPOSURE.</span>
          <br />
          OWN YOUR{' '}
          <span style={{ color: 'var(--accent-primary)' }}>PRIVACY.</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '560px', lineHeight: 1.6 }}>
          Scan your digital footprint across <strong style={{ color: 'var(--text-primary)' }}>14+ breach databases</strong> in 90 seconds. Free, forever.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: '12px', width: '100%', maxWidth: '600px',
          flexWrap: 'wrap', marginBottom: '20px',
        }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
            <input
              id="scan-input"
              className="input-field"
              type="text"
              value={input}
              onChange={handleChange}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              style={{ paddingRight: inputType ? '90px' : '20px', fontSize: '16px' }}
              autoComplete="off"
            />
            {inputType && (
              <span style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '11px', background: 'rgba(0,212,255,0.15)', color: 'var(--accent-primary)',
                padding: '3px 8px', borderRadius: '12px', fontFamily: 'Space Mono',
              }}>
                {inputType.toUpperCase()}
              </span>
            )}
          </div>
          <button type="submit" className="btn-primary" style={{ fontSize: '15px', padding: '14px 32px', whiteSpace: 'nowrap' }}>
            SCAN NOW →
          </button>
        </form>

        {/* Trust badges */}
        <div style={{
          display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center',
          fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '40px',
        }}>
          <span>🔒 Zero data stored</span>
          <span>⚡ Results in 90 seconds</span>
          <span>🆓 100% Free</span>
        </div>

        {/* Live counter */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          background: 'rgba(15,25,35,0.8)', border: '1px solid var(--border)',
          borderRadius: '30px', padding: '8px 20px', fontSize: '13px', color: 'var(--text-secondary)',
          fontFamily: 'JetBrains Mono',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF3B3B', animation: 'pulse-glow 1s ease-in-out infinite' }} />
          <span style={{ color: 'var(--text-primary)' }}>{scanCount.toLocaleString()}</span> scans completed today
          <span style={{ opacity: 0.5 }}>·</span>
          <span>2 active right now</span>
        </div>
      </section>

      {/* Trust Bar */}
      <section style={{ padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(13,17,23,0.8)', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Space Mono' }}>POWERED BY</div>
          {['HIBP', 'Shodan', 'IntelX', 'Ahmia', 'Maigret'].map(name => (
            <span key={name} style={{
              padding: '4px 14px', background: 'rgba(0,212,255,0.05)',
              border: '1px solid var(--border)', borderRadius: '6px',
              fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)',
            }}>{name}</span>
          ))}
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>+ 9 more sources</div>
          <div style={{
            padding: '4px 14px', background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px',
            fontSize: '12px', color: 'var(--accent-success)', fontFamily: 'Space Mono',
          }}>✓ DPDP 2023 Compliant</div>
        </div>
      </section>

      {/* Stats Row */}
      <section style={{ padding: '60px 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="grid-3">
            {STATS_DISPLAY.map((s, i) => (
              <div key={i} className="card" style={{ padding: '28px', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(28px,4vw,42px)', fontFamily: 'Space Mono', color: 'var(--accent-primary)', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" style={{ padding: '60px 0 100px', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', marginBottom: '12px' }}>
              Everything You Need to <span className="gradient-text">Take Back Control</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Used by journalists, students, HR professionals, and everyday citizens.
            </p>
          </div>
          <div className="grid-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '16px', letterSpacing: '-0.3px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, flexGrow: 1 }}>{f.desc}</p>
                <div style={{ background: 'rgba(0,212,255,0.04)', borderRadius: '8px', padding: '14px' }}>
                  {f.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '80px 0', background: 'rgba(13,17,23,0.6)', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px,3vw,36px)', marginBottom: '56px' }}>
            How It Works
          </h2>
          <div className="grid-4" style={{ gap: '0' }}>
            {[
              { step: '01', title: 'Enter Your Info', desc: 'Email, username, phone, or domain. We auto-detect the type.' },
              { step: '02', title: 'Parallel Scan', desc: '14 free sources scanned simultaneously in under 90 seconds.' },
              { step: '03', title: 'Risk Score', desc: 'Instant 0–100 score with breakdown by category and severity.' },
              { step: '04', title: 'Take Action', desc: 'Step-by-step remediation, legal letters, and PDF reports.' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '32px 24px', position: 'relative', textAlign: 'center' }}>
                {i < 3 && (
                  <div style={{ position: 'absolute', right: 0, top: '40%', color: 'rgba(0,212,255,0.2)', fontSize: '20px' }}>→</div>
                )}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontFamily: 'Space Mono', fontSize: '14px', color: 'var(--accent-primary)',
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', marginBottom: '16px' }}>
          Is Your Data <span style={{ color: 'var(--accent-danger)' }}>Already Out There?</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
          It takes 90 seconds to find out. It costs you nothing. It could save your identity.
        </p>
        <button className="btn-primary" style={{ fontSize: '16px', padding: '16px 48px' }} onClick={() => document.getElementById('scan-input').focus()}>
          Start Free Scan →
        </button>
      </section>
    </div>
  );
}
