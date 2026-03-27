import { useState, useEffect } from 'react';
import { exportScanPDF } from '../utils/exportPDF.js';

function useCountUp(target, duration = 1500) {
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
  }, [target]);
  return count;
}

function RiskGauge({ score }) {
  const animScore = useCountUp(score);
  const color = score >= 61 ? '#FF3B3B' : score >= 41 ? '#F59E0B' : score >= 21 ? '#0EA5E9' : '#10B981';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animScore / 100) * circumference;

  const label = score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH RISK' : score >= 41 ? 'MODERATE' : score >= 21 ? 'LOW RISK' : 'MINIMAL';

  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--text-secondary)', marginBottom: '16px', letterSpacing: '2px' }}>
        DIGITAL RISK SCORE
      </div>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="54" fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r="54"
            fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.5s' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontFamily: 'JetBrains Mono', fontWeight: 700, color }}>{animScore}</div>
        </div>
      </div>
      <div style={{ marginTop: '12px', fontSize: '14px', fontFamily: 'Space Mono', color, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function CategoryBar({ label, value, max, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), delay);
    return () => clearTimeout(t);
  }, [value, max, delay]);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'Space Mono', marginBottom: '6px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color }}>{value}/{max}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  const num = typeof value === 'number' ? useCountUp(value) : null;
  return (
    <div className="card" style={{ padding: '20px', textAlign: 'center', borderColor: `${color}44` }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontFamily: 'JetBrains Mono', fontWeight: 700, color, marginBottom: '4px' }}>
        {num !== null ? num : value}
      </div>
      <div style={{ fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

const SEVERITY_COLORS = {
  CRITICAL: { color: '#FF3B3B', badge: 'badge-critical' },
  HIGH: { color: '#F59E0B', badge: 'badge-high' },
  MEDIUM: { color: '#0EA5E9', badge: 'badge-medium' },
  LOW: { color: '#10B981', badge: 'badge-low' },
};

function BreachCard({ breach }) {
  const sc = SEVERITY_COLORS[breach.severity] || SEVERITY_COLORS.MEDIUM;
  return (
    <div className="card" style={{ padding: '20px', borderLeftWidth: '3px', borderLeftColor: sc.color }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{breach.name}</h3>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
            {new Date(breach.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })} · {breach.records} records
          </div>
        </div>
        <span className={`badge ${sc.badge}`}>{breach.severity}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {breach.dataTypes.map(d => <span key={d} className="chip">{d}</span>)}
      </div>
      <a href={breach.changeUrl} target="_blank" rel="noreferrer" className="btn-outline" style={{ fontSize: '12px', padding: '7px 16px', textDecoration: 'none', display: 'inline-block' }}>
        Change Password →
      </a>
    </div>
  );
}

const PLATFORM_ICONS = {
  GitHub: '🐙', Twitter: '🐦', Instagram: '📸', Reddit: '🔴', LinkedIn: '💼',
  Facebook: '📘', Pinterest: '📌', Spotify: '🎵', YouTube: '▶️', Twitch: '🎮',
  Discord: '💬', Steam: '🎯', TikTok: '🎵', Quora: '❓', Deviantart: '🎨',
  Medium: '📝', Behance: '🎨', Dribbble: '⚽', Flickr: '📷', Tumblr: '📄',
  WordPress: '📰', Vimeo: '🎬', Patreon: '❤️',
};

export default function ResultsDashboard({ results, onNewScan, onLegalClick }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [checkedItems, setCheckedItems] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try { await exportScanPDF(results); }
    catch (e) { console.error('PDF export error:', e); }
    finally { setPdfLoading(false); }
  };

  if (!results) return null;

  const { score, breaches, platforms, darkWebHits, narrative, input } = results;

  const remediation = [
    ...(breaches.filter(b => b.severity === 'CRITICAL').map(b => ({
      id: `pw_${b.id}`, priority: 'CRITICAL', icon: '🔐',
      title: `Change your ${b.name} password immediately`,
      detail: 'Your password from this breach may be reused on other sites.',
      actionUrl: b.changeUrl, actionLabel: 'Change Password →'
    }))),
    { id: '2fa', priority: 'CRITICAL', icon: '🛡️', title: 'Enable 2FA on your email account', detail: 'Two-factor authentication blocks 99.9% of automated attacks.', actionUrl: 'https://myaccount.google.com/security', actionLabel: 'Enable 2FA →' },
    ...(breaches.length > 2 ? [{ id: 'pw_mgr', priority: 'HIGH', icon: '🔑', title: 'Enable a Password Manager', detail: 'Use Bitwarden (free) to generate unique passwords for every site.', actionUrl: 'https://bitwarden.com', actionLabel: 'Get Bitwarden Free →' }] : []),
    ...(platforms.length > 15 ? [{ id: 'del_acc', priority: 'MEDIUM', icon: '🗑️', title: `Delete unused accounts`, detail: `You have accounts on ${platforms.length} platforms. Delete ones you no longer use.`, actionUrl: 'https://justdeleteme.xyz', actionLabel: 'Find Deletion Guides →' }] : []),
    { id: 'monitor', priority: 'LOW', icon: '👁️', title: 'Set up breach monitoring', detail: 'Get notified immediately when your email appears in future breaches.', actionUrl: 'https://haveibeenpwned.com/NotifyMe', actionLabel: 'Set Up Alerts →' },
  ];

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  const toggleCheck = (id) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));

  const mask = (val) => {
    if (!val) return '***';
    if (val.includes('@')) {
      const [u, d] = val.split('@');
      return u[0] + '**' + u[u.length - 1] + '@' + d;
    }
    return val[0] + '****' + val[val.length - 1];
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Scan Results</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
              {mask(input.value)} · {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>
          <button className="btn-outline" onClick={onNewScan}>← New Scan</button>
        </div>

        {/* Summary Cards */}
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          <SummaryCard icon="🔓" label="BREACHES FOUND" value={breaches.length} color="var(--accent-danger)" />
          <SummaryCard icon="🌐" label="PLATFORMS FOUND" value={platforms.length} color="var(--accent-primary)" />
          <SummaryCard icon="🕵️" label="DARK WEB HITS" value={darkWebHits} color="var(--accent-warning)" />
          <SummaryCard icon="⚠️" label="RISK SCORE" value={score.total} color={score.total >= 61 ? 'var(--accent-danger)' : 'var(--accent-warning)'} />
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Left: Risk Gauge */}
          <div className="card" style={{ padding: '0' }}>
            <RiskGauge score={score.total} />
            <div style={{ padding: '0 24px 24px' }}>
              <CategoryBar label="CREDENTIALS" value={score.breakdown.credentials} max={35} color="var(--accent-danger)" delay={200} />
              <CategoryBar label="PII EXPOSURE" value={score.breakdown.pii} max={25} color="var(--accent-warning)" delay={400} />
              <CategoryBar label="DARK WEB" value={score.breakdown.dark_web} max={25} color="var(--accent-primary)" delay={600} />
              <CategoryBar label="FOOTPRINT" value={score.breakdown.footprint} max={15} color="var(--accent-success)" delay={800} />
            </div>
          </div>

          {/* Right: AI Narrative */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <h2 style={{ fontSize: '16px' }}>AI RISK ANALYSIS</h2>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Space Mono' }}>via Gemini</span>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--accent-primary)', paddingLeft: '16px' }}>
              "{narrative}"
            </p>
            <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
              Generated by Gemini AI · Not stored · <button onClick={() => {}} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Regenerate ↺</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {['overview', 'breaches', 'platforms', 'remediation'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'overview' ? '📊 Overview' : t === 'breaches' ? `🔓 Breaches (${breaches.length})` : t === 'platforms' ? `🌐 Platforms (${platforms.length})` : `✅ Remediation`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'breaches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {breaches.map(b => <BreachCard key={b.id} breach={b} />)}
          </div>
        )}

        {activeTab === 'platforms' && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
              Your username was found on <strong style={{ color: 'var(--text-primary)' }}>{platforms.length} platforms</strong>. Click any to visit your profile or find removal guides.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {platforms.map(p => (
                <div key={p} className="card" style={{ padding: '16px', textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.open(`https://www.google.com/search?q=${p}+${results.input.value}+profile`, '_blank')}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{PLATFORM_ICONS[p] || '🌐'}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--text-secondary)' }}>{p}</div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-success)', margin: '8px auto 0' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'remediation' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px' }}>REMEDIATION CHECKLIST</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
                {completedCount} / {remediation.length} completed
              </span>
            </div>
            <div className="progress-bar" style={{ marginBottom: '24px' }}>
              <div className="progress-fill" style={{ width: `${(completedCount / remediation.length) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {remediation.map(item => {
                const sc = SEVERITY_COLORS[item.priority] || SEVERITY_COLORS.LOW;
                const checked = checkedItems[item.id];
                return (
                  <div key={item.id} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '16px', opacity: checked ? 0.5 : 1, borderLeftWidth: '3px', borderLeftColor: sc.color }}>
                    <input type="checkbox" checked={!!checked} onChange={() => toggleCheck(item.id)} style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span>{item.icon}</span>
                        <strong style={{ fontSize: '14px', textDecoration: checked ? 'line-through' : 'none' }}>{item.title}</strong>
                        <span className={`badge ${sc.badge}`} style={{ marginLeft: 'auto' }}>{item.priority}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{item.detail}</p>
                      {!checked && (
                        <a href={item.actionUrl} target="_blank" rel="noreferrer" className="btn-outline" style={{ fontSize: '11px', padding: '5px 14px', textDecoration: 'none', display: 'inline-block' }}>
                          {item.actionLabel}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleExportPDF} disabled={pdfLoading}>
                {pdfLoading ? '⟳ Generating...' : '📄 Download PDF Report'}
              </button>
              <button className="btn-outline" onClick={onLegalClick}>📬 Legal Takedown Letter</button>
              <button className="btn-outline" onClick={onNewScan}>🔄 Rescan</button>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>RECENT BREACHES</h3>
              {breaches.slice(0, 3).map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span className={`badge ${SEVERITY_COLORS[b.severity]?.badge}`}>{b.severity}</span>
                  <span style={{ flex: 1, fontSize: '14px' }}>{b.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{b.records}</span>
                </div>
              ))}
              <button className="btn-outline" style={{ marginTop: '8px', width: '100%', fontSize: '12px' }} onClick={() => setActiveTab('breaches')}>View All Breaches →</button>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>EXPOSURE SUMMARY</h3>
              {[
                ['Password Hashes Exposed', 'YES', 'var(--accent-danger)'],
                ['Phone Number Found', results.piiFound.phone ? 'YES' : 'NO', results.piiFound.phone ? 'var(--accent-warning)' : 'var(--accent-success)'],
                ['Dark Web Mentions', darkWebHits + ' hits', 'var(--accent-warning)'],
                ['Platform Exposure', platforms.length + ' sites', 'var(--accent-primary)'],
                ['EXIF Metadata Risk', 'LOW', 'var(--accent-success)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
