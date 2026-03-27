import { useState, useEffect, useCallback, useRef } from 'react';

const PLACEHOLDERS = [
  'your.email@example.com',
  '@your_username',
  '+91 98765 43210',
  'yourdomain.com',
];

const LIVE_THREATS = [
  { city: 'Mumbai',    action: 'Credentials found in LinkedIn breach' },
  { city: 'Delhi',     action: 'Email exposed in 3 databases' },
  { city: 'Bengaluru', action: 'Account footprint on 18 platforms' },
  { city: 'Hyderabad', action: 'Dark web paste detected' },
  { city: 'Chennai',   action: 'Phone number in BigBasket leak' },
  { city: 'Kolkata',   action: 'Password hash in Collection #1' },
  { city: 'Pune',      action: 'Username found on 24 sites' },
];

const STATS = [
  { value: '29.5B+', label: 'Records in breach databases', color: '#ff3b3b' },
  { value: '77%',    label: 'People unaware of their exposure', color: '#f59e0b' },
  { value: '₹5,800Cr', label: 'Annual identity fraud in India', color: '#a855f7' },
];

const SOURCES = [
  { name: 'HaveIBeenPwned', logo: '🛡️' },
  { name: 'XposedOrNot',    logo: '🔍' },
  { name: 'IntelligenceX',  logo: '🧠' },
  { name: 'Shodan.io',      logo: '🌐' },
  { name: 'WhatsMyName',    logo: '👤' },
  { name: 'Ahmia Dark Web', logo: '🕸️' },
  { name: 'EmailRep.io',    logo: '📧' },
  { name: 'Maigret',        logo: '🔎' },
];

const FEATURES = [
  {
    icon: '🎯',
    color: '#ff3b3b',
    title: 'Digital Risk Score',
    desc: 'Composite 0–100 score across credentials, PII exposure, dark web presence and digital footprint.',
    preview: (
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,59,59,0.15)" strokeWidth="8"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="#ff3b3b" strokeWidth="8"
              strokeDasharray="183" strokeDashoffset="50"
              strokeLinecap="round" transform="rotate(-90 50 50)"
              style={{ filter: 'drop-shadow(0 0 6px #ff3b3b)' }}/>
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontFamily: 'Space Mono', color: '#ff3b3b', fontWeight: 700 }}>74</div>
            <div style={{ fontSize: '8px', color: '#f59e0b', fontFamily: 'Space Mono', letterSpacing: 1 }}>HIGH RISK</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '12px' }}>
          {[['Credentials','#ff3b3b', '86%'],['PII Exposure','#f59e0b','76%'],['Dark Web','#a855f7','60%']].map(([k,c,w]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', width: '70px', textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{k}</span>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: w, background: c, borderRadius: '2px', boxShadow: `0 0 6px ${c}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: '🤖',
    color: '#a855f7',
    title: 'Gemini AI Analysis',
    desc: 'Google Gemini 1.5 Flash translates technical breach data into plain-English risk summaries with specific action steps.',
    preview: (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg,#a855f7,#00d4ff)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          <span style={{ fontSize: '10px', fontFamily: 'Space Mono', color: '#a855f7', letterSpacing: 1 }}>AI RISK ANALYSIS · via Gemini</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic', borderLeft: '2px solid rgba(168,85,247,0.5)', paddingLeft: '12px' }}>
          "Your credentials are actively circulated in dark web markets. Change your primary email password immediately and enable 2FA…"
        </p>
      </div>
    ),
  },
  {
    icon: '📸',
    color: '#00d4ff',
    title: 'EXIF Metadata Stripper',
    desc: 'Reveal hidden GPS coordinates, device model and timestamps embedded in your photos — then strip them instantly.',
    preview: (
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', lineHeight: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-dim)' }}>GPS Lat:</span><span style={{ color: '#ff3b3b' }}>18.9220°N</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-dim)' }}>GPS Lon:</span><span style={{ color: '#ff3b3b' }}>72.8347°E</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-dim)' }}>Device:</span><span style={{ color: 'var(--text-secondary)' }}>iPhone 14 Pro</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-dim)' }}>Software:</span><span style={{ color: '#10b981' }}>Stripped ✓</span></div>
      </div>
    ),
  },
  {
    icon: '⚖️',
    color: '#10b981',
    title: 'DPDP Act 2023 Letters',
    desc: 'Auto-generate legally compliant erasure requests under the Digital Personal Data Protection Act 2023.',
    preview: (
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', lineHeight: 1.9 }}>
        <div style={{ color: '#10b981', marginBottom: '6px', letterSpacing: 1 }}>ERASURE REQUEST — GENERATED</div>
        <div style={{ color: 'var(--text-dim)' }}>Authority:  <span style={{ color: 'var(--text-secondary)' }}>Data Protection Board</span></div>
        <div style={{ color: 'var(--text-dim)' }}>Basis:      <span style={{ color: 'var(--text-secondary)' }}>§13, DPDP Act 2023</span></div>
        <div style={{ color: 'var(--text-dim)' }}>Deadline:   <span style={{ color: '#f59e0b' }}>30 days to comply</span></div>
        <div style={{ color: '#10b981', marginTop: '4px' }}>✓ Legally compliant · PDF ready</div>
      </div>
    ),
  },
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

export default function LandingPage({ onScan, onExifClick }) {
  const [input, setValue] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [inputType, setInputType] = useState(null);
  const [liveScanTarget, setLiveScanTarget] = useState(14832);
  const [threatIdx, setThreatIdx] = useState(0);
  const [threatVisible, setThreatVisible] = useState(true);
  const scanCount = useCountUp(liveScanTarget);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (d.scans_completed) setLiveScanTarget(d.scans_completed); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setThreatVisible(false);
      setTimeout(() => {
        setThreatIdx(i => (i + 1) % LIVE_THREATS.length);
        setThreatVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const detectType = useCallback((val) => {
    if (!val) return null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'email';
    if (/^\+?[\d\s\-(). ]{9,15}$/.test(val)) return 'phone';
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

  const t = LIVE_THREATS[threatIdx];

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Ambient glows */}
      <div className="hero-ambient hero-ambient-cyan" />
      <div className="hero-ambient hero-ambient-purple" />

      {/* ── HERO ── */}
      <section style={{
        minHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px 60px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Hackathon badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '24px', padding: '7px 18px', marginBottom: '32px',
          fontSize: '11px', color: '#c084fc', fontFamily: 'Space Mono', letterSpacing: '0.5px',
        }}>
          <span className="live-dot cyan" />
          CIPHATHO 26' · CIPH-PS-007 · Team CipherX
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(38px, 6.5vw, 82px)', lineHeight: 1.05,
          marginBottom: '24px', maxWidth: '900px',
          letterSpacing: '-0.03em',
        }}>
          KNOW YOUR{' '}
          <span className="gradient-text">EXPOSURE.</span>
          <br />
          OWN YOUR{' '}
          <span style={{
            color: 'transparent',
            background: 'linear-gradient(135deg, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}>PRIVACY.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-secondary)',
          marginBottom: '48px', maxWidth: '540px', lineHeight: 1.7,
        }}>
          Scan your entire digital footprint across{' '}
          <strong style={{ color: 'var(--accent-primary)' }}>14+ real breach databases</strong>{' '}
          and 3,000+ platforms — powered by AI.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: '10px', width: '100%', maxWidth: '620px',
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
              style={{ paddingRight: inputType ? '96px' : '20px', fontSize: '16px', borderRadius: '12px' }}
              autoComplete="off"
            />
            {inputType && (
              <span style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '10px', background: 'rgba(0,212,255,0.15)', color: 'var(--accent-primary)',
                padding: '4px 10px', borderRadius: '12px', fontFamily: 'Space Mono', letterSpacing: 1,
              }}>
                {inputType.toUpperCase()}
              </span>
            )}
          </div>
          <button type="submit" className="btn-primary" style={{ fontSize: '14px', padding: '16px 36px', whiteSpace: 'nowrap', borderRadius: '12px' }}>
            SCAN NOW →
          </button>
        </form>

        {/* Trust row */}
        <div style={{
          display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center',
          fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '36px',
        }}>
          {['🔒 Zero data stored', '⚡ Results in 90 sec', '🆓 Completely free', '🇮🇳 DPDP 2023 compliant'].map(s => (
            <span key={s}>{s}</span>
          ))}
        </div>

        {/* Live counter + threat feed */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(8,15,28,0.9)', border: '1px solid var(--border)',
            borderRadius: '30px', padding: '8px 20px', fontSize: '12px',
            color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono',
          }}>
            <span className="live-dot red" />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{scanCount.toLocaleString()}</span>
            <span>scans completed today</span>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(8,15,28,0.9)', border: '1px solid var(--border)',
            borderRadius: '30px', padding: '8px 20px', fontSize: '12px',
            color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono',
            opacity: threatVisible ? 1 : 0, transition: 'opacity 0.3s',
            maxWidth: '340px',
          }}>
            <span className="live-dot green" />
            <span style={{ color: '#10b981' }}>{t.city}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.action}
            </span>
          </div>
        </div>
      </section>

      {/* ── SOURCE STRIP ─ */}
      <section style={{
        padding: '18px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        background: 'rgba(8,15,28,0.6)', position: 'relative', zIndex: 1,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'Space Mono', letterSpacing: 1 }}>POWERED BY</span>
          <div className="source-strip">
            {SOURCES.map(s => (
              <div key={s.name} className="source-badge">
                {s.logo} {s.name}
              </div>
            ))}
          </div>
          <div style={{
            padding: '4px 14px', background: 'rgba(16,185,129,0.07)',
            border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px',
            fontSize: '11px', color: 'var(--accent-success)', fontFamily: 'Space Mono', whiteSpace: 'nowrap',
          }}>✓ DPDP Act 2023</div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '72px 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              display: 'inline-flex', gap: '6px', alignItems: 'center',
              fontSize: '11px', fontFamily: 'Space Mono', letterSpacing: 2,
              color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px',
            }}>
              <span className="live-dot red" style={{ width: '6px', height: '6px' }} />
              The Privacy Crisis in Numbers
            </span>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', color: 'var(--text-primary)' }}>
              Why This Matters <span className="gradient-text">Right Now</span>
            </h2>
          </div>
          <div className="grid-3">
            {STATS.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-value" style={{ color: s.color, textShadow: `0 0 20px ${s.color}60` }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '60px 0 100px', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', marginBottom: '12px' }}>
              Everything You Need to{' '}
              <span className="gradient-text">Take Back Control</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
              Used by journalists, HR professionals, security researchers, and everyday citizens.
            </p>
          </div>
          <div className="grid-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="card animate-fade-in" style={{
                padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px',
                animationDelay: `${i * 0.1}s`, animationFillMode: 'both',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${f.color}18`, border: `1px solid ${f.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, flexGrow: 1 }}>{f.desc}</p>
                <div style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '14px',
                }}>
                  {f.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 0', background: 'rgba(8,15,28,0.5)', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px,3vw,32px)', marginBottom: '60px' }}>
            How It <span className="gradient-text">Works</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
            {/* connector line */}
            <div style={{
              position: 'absolute', top: '28px', left: '12.5%', right: '12.5%', height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
              opacity: 0.3, zIndex: 0,
            }} />
            {[
              { step: '01', title: 'Enter Your Info', desc: 'Email, username, phone, or domain — auto-detected instantly.' },
              { step: '02', title: 'Parallel Scan', desc: '14+ sources scanned simultaneously in real time via async APIs.' },
              { step: '03', title: 'AI Risk Score', desc: 'Gemini AI generates a 0–100 score with plain-English explanation.' },
              { step: '04', title: 'Take Action', desc: 'Legal letters, remediation steps, PDF reports, and password checks.' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '32px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '54px', height: '54px', borderRadius: '50%',
                  background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontFamily: 'Space Mono', fontSize: '16px', color: 'var(--accent-primary)', fontWeight: 700,
                  boxShadow: '0 0 20px rgba(0,212,255,0.1)',
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-block',
          padding: '64px',
          background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(168,85,247,0.05))',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: '24px',
          maxWidth: '640px', width: '100%',
        }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', marginBottom: '16px' }}>
            Is Your Data{' '}
            <span className="gradient-text-danger">Already Out There?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '17px', marginBottom: '36px', lineHeight: 1.6 }}>
            90 seconds. Zero cost. Complete picture of your digital exposure.
          </p>
          <button
            className="btn-primary"
            style={{ fontSize: '15px', padding: '16px 56px', borderRadius: '12px' }}
            onClick={() => document.getElementById('scan-input').focus()}
          >
            Start Free Scan →
          </button>
          <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-dim)' }}>
            No account required · No data stored · Results are private
          </div>
        </div>
      </section>
    </div>
  );
}
