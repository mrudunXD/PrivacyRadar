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
  const animScore = useCountUp(score, 1800);
  const color = score >= 81 ? '#ff3b3b' : score >= 61 ? '#f59e0b' : score >= 41 ? '#0ea5e9' : '#10b981';
  const label = score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH RISK' : score >= 41 ? 'MODERATE' : score >= 21 ? 'LOW RISK' : 'MINIMAL';
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (animScore / 100) * circumference;

  return (
    <div style={{ textAlign: 'center', padding: '28px 24px 12px' }}>
      <div style={{ fontSize: '10px', fontFamily: 'Space Mono', color: 'var(--text-dim)', letterSpacing: 2, marginBottom: '20px' }}>
        DIGITAL RISK SCORE
      </div>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Outer ambient glow */}
        <div style={{
          position: 'absolute', inset: '-12px', borderRadius: '50%',
          background: `radial-gradient(circle, ${color}18, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <svg width="156" height="156" viewBox="0 0 156 156" style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}>
          {/* Track */}
          <circle cx="78" cy="78" r="58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          {/* Fill */}
          <circle
            cx="78" cy="78" r="58"
            fill="none" stroke={`url(#gauge-grad-${score})`} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 78 78)"
            style={{ transition: 'stroke-dashoffset 0.04s linear' }}
          />
          <defs>
            <linearGradient id={`gauge-grad-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color === '#ff3b3b' ? '#f59e0b' : color} />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-52%)', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', fontFamily: 'JetBrains Mono', fontWeight: 700, color, lineHeight: 1 }}>
            {animScore}
          </div>
          <div style={{ fontSize: '9px', fontFamily: 'Space Mono', color: 'var(--text-dim)', letterSpacing: 1, marginTop: '2px' }}>/ 100</div>
        </div>
      </div>
      <div style={{
        marginTop: '12px', fontSize: '13px', fontFamily: 'Space Mono',
        color, fontWeight: 700, letterSpacing: 1,
        textShadow: `0 0 12px ${color}80`,
      }}>{label}</div>
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
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'Space Mono', marginBottom: '6px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color }}>{value}/{max}</span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${width}%`, borderRadius: '3px',
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 6px ${color}60`,
          transition: 'width 1s cubic-bezier(0.25,1,0.5,1)',
        }} />
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  const num = typeof value === 'number' ? useCountUp(value) : null;
  return (
    <div className="card" style={{ padding: '22px', textAlign: 'center', borderColor: `${color}30`, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 0%, ${color}08, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: '26px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '34px', fontFamily: 'Space Mono', fontWeight: 700, color, marginBottom: '4px', textShadow: `0 0 20px ${color}60` }}>
        {num !== null ? num : value}
      </div>
      <div style={{ fontSize: '10px', fontFamily: 'Space Mono', color: 'var(--text-dim)', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

const SEV = {
  CRITICAL: { color: '#ff3b3b', badge: 'badge-critical', cls: 'critical' },
  HIGH:     { color: '#f59e0b', badge: 'badge-high',     cls: 'high' },
  MEDIUM:   { color: '#0ea5e9', badge: 'badge-medium',   cls: 'medium' },
  LOW:      { color: '#10b981', badge: 'badge-low',      cls: 'low' },
};

function BreachCard({ breach }) {
  const sc = SEV[breach.severity] || SEV.MEDIUM;
  const dateStr = (() => {
    try { return new Date(breach.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }); }
    catch { return breach.date; }
  })();
  return (
    <div className={`breach-card ${sc.cls} animate-fade-in`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '17px', marginBottom: '5px', color: 'var(--text-primary)' }}>{breach.name}</h3>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
            {dateStr}
            {breach.records && breach.records !== 'N/A' && (
              <> · <span style={{ color: sc.color }}>{breach.records} records exposed</span></>
            )}
          </div>
        </div>
        <span className={`badge ${sc.badge}`}>{breach.severity}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {(breach.dataTypes || []).map(d => (
          <span key={d} className="chip">{d}</span>
        ))}
      </div>
      {breach.changeUrl && breach.changeUrl !== '#' && (
        <a
          href={breach.changeUrl}
          target="_blank" rel="noreferrer"
          className="btn-outline"
          style={{ fontSize: '12px', padding: '7px 16px', textDecoration: 'none', display: 'inline-block' }}
        >
          Change Password →
        </a>
      )}
    </div>
  );
}

const PLATFORM_ICONS = {
  GitHub: '🐙', Twitter: '🐦', Instagram: '📸', Reddit: '🔴', LinkedIn: '💼',
  Facebook: '📘', Pinterest: '📌', Spotify: '🎵', YouTube: '▶️', Twitch: '🎮',
  Discord: '💬', Steam: '🎯', TikTok: '🎵', Quora: '❓', DeviantArt: '🎨',
  Medium: '📝', Behance: '🎨', Dribbble: '⚽', Flickr: '📷', Tumblr: '📄',
  WordPress: '📰', Vimeo: '🎬', Patreon: '❤️', Snapchat: '👻', Telegram: '✈️',
  Keybase: '🔑', Mastodon: '🐘', HackerNews: '🔶', GitLab: '🦊', Bitbucket: '🪣',
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
    ...breaches.filter(b => b.severity === 'CRITICAL').map(b => ({
      id: `pw_${b.id}`, priority: 'CRITICAL', icon: '🔐',
      title: `Change your ${b.name} password immediately`,
      detail: 'Your credentials from this breach are actively circulated in automated attacks.',
      actionUrl: b.changeUrl, actionLabel: 'Change Password →',
    })),
    { id: '2fa', priority: 'CRITICAL', icon: '🛡️', title: 'Enable 2FA on email account', detail: 'Two-factor authentication blocks 99.9% of automated attacks.', actionUrl: 'https://myaccount.google.com/security', actionLabel: 'Enable 2FA →' },
    ...(breaches.length > 2 ? [{ id: 'pw_mgr', priority: 'HIGH', icon: '🔑', title: 'Use a Password Manager', detail: 'Bitwarden is free and generates unique passwords per site.', actionUrl: 'https://bitwarden.com', actionLabel: 'Get Bitwarden Free →' }] : []),
    ...(platforms.length > 15 ? [{ id: 'del_acc', priority: 'MEDIUM', icon: '🗑️', title: 'Delete unused accounts', detail: `${platforms.length} platform footprint reduces when you delete old accounts.`, actionUrl: 'https://justdeleteme.xyz', actionLabel: 'Find Deletion Guides →' }] : []),
    { id: 'monitor', priority: 'LOW', icon: '👁️', title: 'Set up breach monitoring', detail: 'Get notified when your email appears in future breaches.', actionUrl: 'https://haveibeenpwned.com/NotifyMe', actionLabel: 'Set Up Alerts →' },
  ];

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const toggleCheck = (id) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));

  const mask = (val) => {
    if (!val) return '***';
    if (val.includes('@')) { const [u, d] = val.split('@'); return u[0] + '**' + u[u.length - 1] + '@' + d; }
    return val[0] + '****' + val[val.length - 1];
  };

  const scoreColor = score.total >= 81 ? '#ff3b3b' : score.total >= 61 ? '#f59e0b' : score.total >= 41 ? '#0ea5e9' : '#10b981';

  return (
    <div style={{ position: 'relative', zIndex: 1, padding: '36px 0 80px' }}>
      <div className="container">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Intelligence Report</h1>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
              <span style={{ color: 'var(--accent-primary)' }}>{mask(input.value)}</span>
              {' · '}{new Date(results.timestamp).toLocaleString('en-IN')}
              {' · '}
              <span style={{ color: 'var(--accent-success)' }}>scan complete</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-outline" style={{ fontSize: '12px' }} onClick={onNewScan}>← New Scan</button>
            <button className="btn-primary" style={{ fontSize: '12px' }} onClick={handleExportPDF} disabled={pdfLoading}>
              {pdfLoading ? '⟳ Generating…' : '📄 Export PDF'}
            </button>
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <SummaryCard icon="🔓" label="BREACHES FOUND"  value={breaches.length}   color="#ff3b3b" />
          <SummaryCard icon="🌐" label="PLATFORMS FOUND" value={platforms.length}   color="var(--accent-primary)" />
          <SummaryCard icon="🕵️" label="DARK WEB HITS"   value={darkWebHits}        color="#f59e0b" />
          <SummaryCard icon="⚠️" label="RISK SCORE"      value={score.total}        color={scoreColor} />
        </div>

        {/* ── Main Grid: Risk Gauge + AI Narrative ── */}
        <div className="results-main-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '22px', marginBottom: '28px' }}>
          {/* Risk Gauge */}
          <div className="card" style={{ border: `1px solid ${scoreColor}30` }}>
            <RiskGauge score={score.total} />
            <div style={{ padding: '4px 24px 24px' }}>
              <CategoryBar label="CREDENTIALS"  value={score.breakdown?.credentials  || 0} max={35} color="#ff3b3b" delay={300} />
              <CategoryBar label="PII EXPOSURE"  value={score.breakdown?.pii          || 0} max={25} color="#f59e0b" delay={500} />
              <CategoryBar label="DARK WEB"     value={score.breakdown?.dark_web      || 0} max={25} color="#a855f7" delay={700} />
              <CategoryBar label="FOOTPRINT"    value={score.breakdown?.footprint     || 0} max={15} color="#0ea5e9" delay={900} />
            </div>
          </div>

          {/* AI Narrative */}
          <div className="ai-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="ai-card-header">
                <div className="ai-icon">✦</div>
                <span style={{ fontWeight: 700, color: '#c084fc', fontSize: '13px' }}>AI RISK ANALYSIS</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-dim)' }}>via Gemini 1.5 Flash</span>
              </div>
              <p className="ai-narrative">
                {narrative || 'Your scan results are being analysed by Gemini AI. Please wait a moment…'}
              </p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>
                Generated by Gemini AI · Not stored · Private
              </span>
              <button
                className="btn-outline"
                style={{ fontSize: '11px', padding: '5px 14px' }}
                onClick={onLegalClick}
              >
                📬 Generate Legal Letter →
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-bar">
          {['overview', 'breaches', 'platforms', 'remediation'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'overview'    ? '📊 Overview'
                : t === 'breaches'   ? `🔓 Breaches (${breaches.length})`
                : t === 'platforms'  ? `🌐 Platforms (${platforms.length})`
                : `✅ Remediation (${completedCount}/${remediation.length})`}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--text-dim)', letterSpacing: 2, marginBottom: '18px' }}>TOP BREACHES</h3>
              {breaches.length === 0 ? (
                <div style={{ color: 'var(--accent-success)', fontSize: '14px' }}>✓ No breaches found in scanned databases</div>
              ) : breaches.slice(0, 4).map(b => {
                const sc = SEV[b.severity] || SEV.MEDIUM;
                return (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${sc.color}` }}>
                    <span className={`badge ${sc.badge}`}>{b.severity}</span>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{b.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>{b.records}</span>
                  </div>
                );
              })}
              <button className="btn-outline" style={{ marginTop: '10px', width: '100%', fontSize: '12px' }} onClick={() => setActiveTab('breaches')}>
                View All Breaches →
              </button>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--text-dim)', letterSpacing: 2, marginBottom: '18px' }}>EXPOSURE SUMMARY</h3>
              {[
                ['Password Hashes', breaches.some(b => b.hasPasswords) ? 'EXPOSED' : 'CLEAN', breaches.some(b => b.hasPasswords) ? '#ff3b3b' : '#10b981'],
                ['Phone Number',    results.piiFound?.phone   ? 'FOUND' : 'NOT FOUND', results.piiFound?.phone ? '#f59e0b' : '#10b981'],
                ['Home Address',    results.piiFound?.address ? 'FOUND' : 'NOT FOUND', results.piiFound?.address ? '#ff3b3b' : '#10b981'],
                ['Dark Web Mentions', darkWebHits + (darkWebHits === 1 ? ' hit' : ' hits'), darkWebHits > 0 ? '#f59e0b' : '#10b981'],
                ['Platform Footprint', platforms.length + ' sites', platforms.length > 20 ? '#f59e0b' : '#0ea5e9'],
                ['EXIF Metadata Risk', 'LOW', '#10b981'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color, fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '12px' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Breaches ── */}
        {activeTab === 'breaches' && (
          <div>
            {breaches.length === 0 ? (
              <div className="card card-success" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ color: 'var(--accent-success)', marginBottom: '8px' }}>No Breaches Detected</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Your email was not found in any of the breach databases we checked. Stay vigilant.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'JetBrains Mono' }}>
                  <span style={{ color: '#ff3b3b', fontWeight: 700 }}>{breaches.length}</span> breach{breaches.length !== 1 ? 'es' : ''} found · Sorted by severity
                </div>
                {[...breaches].sort((a, b) => {
                  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                  return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                }).map((b, i) => (
                  <div key={b.id} style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'both' }}>
                    <BreachCard breach={b} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Platforms ── */}
        {activeTab === 'platforms' && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px', lineHeight: 1.6 }}>
              Your username/email was found on <strong style={{ color: 'var(--text-primary)' }}>{platforms.length} platforms</strong>. Each publicly linked account increases your attack surface and data exposure.
            </p>
            <div className="platform-grid">
              {platforms.map(p => (
                <div
                  key={p}
                  className="platform-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(p + ' ' + results.input.value + ' profile')}`, '_blank')}
                >
                  <span className="platform-dot" />
                  <span style={{ fontSize: '16px' }}>{PLATFORM_ICONS[p] || '🌐'}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Remediation ── */}
        {activeTab === 'remediation' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontFamily: 'Space Mono', letterSpacing: 1, color: 'var(--text-dim)' }}>REMEDIATION CHECKLIST</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
                {completedCount}/{remediation.length} completed
              </span>
            </div>
            <div className="progress-bar" style={{ height: '5px', marginBottom: '24px' }}>
              <div className="progress-fill" style={{ width: `${(completedCount / remediation.length) * 100}%` }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {remediation.map(item => {
                const sc = SEV[item.priority] || SEV.LOW;
                const checked = checkedItems[item.id];
                return (
                  <div key={item.id} className={`breach-card ${sc.cls}`} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '16px',
                    opacity: checked ? 0.45 : 1, transition: 'opacity 0.3s',
                  }}>
                    <input
                      type="checkbox"
                      checked={!!checked}
                      onChange={() => toggleCheck(item.id)}
                      style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '5px' }}>
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        <strong style={{ fontSize: '14px', textDecoration: checked ? 'line-through' : 'none' }}>{item.title}</strong>
                        <span className={`badge ${sc.badge}`} style={{ marginLeft: 'auto' }}>{item.priority}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.55 }}>{item.detail}</p>
                      {!checked && item.actionUrl && (
                        <a href={item.actionUrl} target="_blank" rel="noreferrer"
                          className="btn-outline"
                          style={{ fontSize: '11px', padding: '5px 14px', textDecoration: 'none', display: 'inline-block' }}>
                          {item.actionLabel}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <button className="btn-primary" onClick={handleExportPDF} disabled={pdfLoading}>
                {pdfLoading ? '⟳ Generating…' : '📄 Download PDF Report'}
              </button>
              <button className="btn-outline" onClick={onLegalClick}>📬 Legal Takedown Letter</button>
              <button className="btn-outline" onClick={onNewScan}>🔄 New Scan</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
