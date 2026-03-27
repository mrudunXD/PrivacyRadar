import { useState, useEffect } from 'react';
import { exportScanPDF } from '../utils/exportPDF.js';

function useCountUp(target, duration = 1200) {
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

/* Risk score ring — simple SVG */
function ScoreRing({ score }) {
  const animScore = useCountUp(score, 1600);
  const color = score >= 75 ? 'var(--red)' : score >= 50 ? 'var(--amber)' : score >= 25 ? 'var(--blue)' : 'var(--green)';
  const label = score >= 75 ? 'High Risk' : score >= 50 ? 'Moderate' : score >= 25 ? 'Low Risk' : 'Minimal';
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animScore / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
        Risk Score
      </div>
      <div style={{ position: 'relative' }}>
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 64 64)"
            style={{ transition: 'stroke-dashoffset 0.04s linear, stroke 0.4s' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{animScore}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px' }}>/100</div>
        </div>
      </div>
      <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 600, color }}>{label}</div>
    </div>
  );
}

function ScoreBar({ label, value, max, color, delay }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((value / max) * 100), delay); return () => clearTimeout(t); }, [value, max, delay]);
  return (
    <div className="score-row">
      <span className="score-row-label">{label}</span>
      <div className="score-row-bar"><div className="score-row-fill" style={{ width: `${w}%`, background: color }} /></div>
      <span className="score-row-val">{value}/{max}</span>
    </div>
  );
}

const SEV_MAP = {
  CRITICAL: { color: 'var(--red)',   badgeClass: 'badge-red',   cls: 'CRITICAL' },
  HIGH:     { color: 'var(--amber)', badgeClass: 'badge-amber', cls: 'HIGH' },
  MEDIUM:   { color: 'var(--blue)',  badgeClass: 'badge-blue',  cls: 'MEDIUM' },
  LOW:      { color: 'var(--green)', badgeClass: 'badge-green', cls: 'LOW' },
};

const PLATFORM_ICONS = {
  GitHub: '🐙', Twitter: '🐦', Instagram: '📸', Reddit: '🔴', LinkedIn: '💼',
  Facebook: '📘', Spotify: '🎵', YouTube: '▶️', Twitch: '🎮', Discord: '💬',
  Steam: '🎯', TikTok: '🎵', Medium: '📝', Snapchat: '👻', Telegram: '✈️',
};

export default function ResultsDashboard({ results, onNewScan, onLegalClick }) {
  const [tab, setTab] = useState('overview');
  const [checked, setChecked] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!results) return null;

  const { score, breaches, platforms, darkWebHits, narrative, input, piiFound } = results;

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportScanPDF(results); } catch (e) { console.error(e); } finally { setPdfLoading(false); }
  };

  const mask = (val) => {
    if (!val) return '***';
    if (val.includes('@')) { const [u, d] = val.split('@'); return u[0] + '**' + u[u.length - 1] + '@' + d; }
    return val[0] + '****' + val[val.length - 1];
  };

  const remediation = [
    ...breaches.filter(b => b.severity === 'CRITICAL').map(b => ({
      id: `pw_${b.id}`, priority: 'CRITICAL', icon: '🔐',
      title: `Change your ${b.name} password`,
      detail: 'Credentials from this breach are actively circulated in automated attacks.',
      link: b.changeUrl, linkLabel: 'Change password →',
    })),
    { id: '2fa', priority: 'CRITICAL', icon: '🛡️', title: 'Enable two-factor authentication on your email', detail: 'Blocks 99.9% of automated login attacks.', link: 'https://myaccount.google.com/security', linkLabel: 'Enable 2FA →' },
    ...(breaches.length > 2 ? [{ id: 'pw_mgr', priority: 'HIGH', icon: '🔑', title: 'Use a password manager', detail: 'Bitwarden (free) generates unique passwords for every site.', link: 'https://bitwarden.com', linkLabel: 'Get Bitwarden →' }] : []),
    ...(platforms.length > 15 ? [{ id: 'cleanup', priority: 'MEDIUM', icon: '🗑️', title: 'Delete unused accounts', detail: `${platforms.length} linked accounts increase your attack surface.`, link: 'https://justdeleteme.xyz', linkLabel: 'Find deletion guides →' }] : []),
    { id: 'alerts', priority: 'LOW', icon: '🔔', title: 'Set up breach monitoring', detail: 'Get notified when your email appears in future leaks.', link: 'https://haveibeenpwned.com/NotifyMe', linkLabel: 'Set up alerts →' },
  ];

  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', padding: '32px 0 80px' }}>
      <div className="container">

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Privacy Report</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              {mask(input.value)} · {new Date(results.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={onNewScan}>← New Scan</button>
            <button className="btn btn-secondary btn-sm" onClick={onLegalClick}>Legal Letter</button>
            <button className="btn btn-primary btn-sm" onClick={handlePDF} disabled={pdfLoading}>
              {pdfLoading ? 'Generating…' : '↓ Export PDF'}
            </button>
          </div>
        </div>

        {/* ── Summary row ── */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          {[
            { label: 'Breaches found', value: breaches.length, color: breaches.length > 0 ? 'var(--red)' : 'var(--green)' },
            { label: 'Platforms detected', value: platforms.length, color: 'var(--blue)' },
            { label: 'Dark web mentions', value: darkWebHits, color: darkWebHits > 0 ? 'var(--amber)' : 'var(--green)' },
            { label: 'Risk score', value: score.total, color: score.total >= 61 ? 'var(--red)' : score.total >= 41 ? 'var(--amber)' : 'var(--blue)' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Main grid: Score + AI ── */}
        <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Score panel */}
          <div className="card">
            <ScoreRing score={score.total} />
            <div style={{ padding: '0 20px 20px' }}>
              <div className="divider" style={{ marginBottom: '16px' }} />
              <ScoreBar label="Credentials" value={score.breakdown?.credentials || 0} max={35} color="var(--red)"   delay={200} />
              <ScoreBar label="PII"         value={score.breakdown?.pii          || 0} max={25} color="var(--amber)" delay={400} />
              <ScoreBar label="Dark Web"    value={score.breakdown?.dark_web     || 0} max={25} color="var(--blue)"  delay={600} />
              <ScoreBar label="Footprint"   value={score.breakdown?.footprint    || 0} max={15} color="var(--green)" delay={800} />
            </div>
          </div>

          {/* AI Narrative */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px' }}>AI Risk Summary</h2>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'JetBrains Mono' }}>
                Gemini 1.5 Flash
              </span>
            </div>
            <div className="alert alert-blue" style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text)' }}>
                {narrative || 'AI analysis is being generated…'}
              </p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('remediation')}>
                View action plan →
              </button>
              <button className="btn btn-ghost btn-sm" onClick={onLegalClick}>
                Generate legal letter →
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs" style={{ marginBottom: '24px' }}>
          {[
            { id: 'overview',    label: 'Overview' },
            { id: 'breaches',    label: `Breaches (${breaches.length})` },
            { id: 'platforms',   label: `Platforms (${platforms.length})` },
            { id: 'remediation', label: `Action Plan (${completedCount}/${remediation.length})` },
          ].map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {tab === 'overview' && (
          <div className="grid-2">
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Top Breaches
              </h3>
              {breaches.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--green)' }}>✓ No breaches found</p>
              ) : (
                <table className="table">
                  <tbody>
                    {breaches.slice(0, 5).map(b => {
                      const sc = SEV_MAP[b.severity] || SEV_MAP.MEDIUM;
                      return (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 500 }}>{b.name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>{b.records}</td>
                          <td><span className={`badge ${sc.badgeClass}`}>{b.severity}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '12px', width: '100%' }} onClick={() => setTab('breaches')}>
                View all →
              </button>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Exposure Summary
              </h3>
              <table className="table">
                <tbody>
                  {[
                    ['Password hashes', breaches.some(b => b.hasPasswords) ? '⚠ Exposed' : '✓ Clean', breaches.some(b => b.hasPasswords) ? 'var(--red)' : 'var(--green)'],
                    ['Phone number', piiFound?.phone ? '⚠ Found' : '✓ Not found', piiFound?.phone ? 'var(--amber)' : 'var(--green)'],
                    ['Home address', piiFound?.address ? '⚠ Found' : '✓ Not found', piiFound?.address ? 'var(--red)' : 'var(--green)'],
                    ['Dark web mentions', darkWebHits > 0 ? `${darkWebHits} found` : '✓ None found', darkWebHits > 0 ? 'var(--amber)' : 'var(--green)'],
                    ['Platform footprint', `${platforms.length} sites`, platforms.length > 20 ? 'var(--amber)' : 'var(--text-muted)'],
                  ].map(([label, val, color]) => (
                    <tr key={label}>
                      <td style={{ color: 'var(--text-muted)' }}>{label}</td>
                      <td style={{ color, fontFamily: 'JetBrains Mono', fontSize: '12px', textAlign: 'right' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Breaches ── */}
        {tab === 'breaches' && (
          <div>
            {breaches.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ color: 'var(--green)', marginBottom: '8px' }}>No breaches detected</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Your email was not found in any of the breach databases we checked.</p>
              </div>
            ) : (
              <div className="card">
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Records</th>
                      <th>Data Exposed</th>
                      <th>Severity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...breaches].sort((a, b) => {
                      const o = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                      return (o[a.severity] ?? 4) - (o[b.severity] ?? 4);
                    }).map(b => {
                      const sc = SEV_MAP[b.severity] || SEV_MAP.MEDIUM;
                      const dateStr = (() => { try { return new Date(b.date).getFullYear(); } catch { return b.date; } })();
                      return (
                        <tr key={b.id} className="animate-in">
                          <td style={{ fontWeight: 600 }}>{b.name}</td>
                          <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{dateStr}</td>
                          <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{b.records}</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {(b.dataTypes || []).map(d => <span key={d} className="chip">{d}</span>)}
                            </div>
                          </td>
                          <td><span className={`badge ${sc.badgeClass}`}>{b.severity}</span></td>
                          <td>
                            {b.changeUrl && b.changeUrl !== '#' && (
                              <a href={b.changeUrl} target="_blank" rel="noreferrer"
                                className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                Change password
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Platforms ── */}
        {tab === 'platforms' && (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              Your username or email was found on <strong style={{ color: 'var(--text)' }}>{platforms.length} platforms</strong>. Each linked account is a potential entry point for attackers.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {platforms.map(p => (
                <div
                  key={p}
                  className="platform-pill"
                  onClick={() => window.open(`https://www.google.com/search?q=site:${p.toLowerCase()}.com+${encodeURIComponent(results.input.value)}`, '_blank')}
                >
                  <span className="dot-online" />
                  {PLATFORM_ICONS[p] && <span>{PLATFORM_ICONS[p]}</span>}
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Remediation ── */}
        {tab === 'remediation' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px' }}>Action Plan</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                {completedCount} of {remediation.length} completed
              </span>
            </div>
            <div className="progress" style={{ marginBottom: '24px' }}>
              <div className="progress-bar" style={{ width: `${(completedCount / remediation.length) * 100}%`, background: 'var(--green)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {remediation.map(item => {
                const sc = SEV_MAP[item.priority] || SEV_MAP.LOW;
                const isChecked = checked[item.id];
                return (
                  <div key={item.id} className="card" style={{
                    padding: '16px 20px',
                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                    opacity: isChecked ? 0.45 : 1,
                    borderLeft: `3px solid ${sc.color}`,
                    transition: 'opacity 0.2s',
                  }}>
                    <input
                      type="checkbox"
                      checked={!!isChecked}
                      onChange={() => setChecked(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--blue)', width: '15px', height: '15px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span>{item.icon}</span>
                        <strong style={{ fontSize: '14px', textDecoration: isChecked ? 'line-through' : 'none' }}>{item.title}</strong>
                        <span className={`badge ${sc.badgeClass}`} style={{ marginLeft: 'auto' }}>{item.priority}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: isChecked ? 0 : '10px' }}>{item.detail}</p>
                      {!isChecked && item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer"
                          className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                          {item.linkLabel}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handlePDF} disabled={pdfLoading}>
                {pdfLoading ? 'Generating…' : '↓ Download PDF Report'}
              </button>
              <button className="btn btn-secondary" onClick={onLegalClick}>Legal Takedown Letter</button>
              <button className="btn btn-ghost" onClick={onNewScan}>Run New Scan</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
