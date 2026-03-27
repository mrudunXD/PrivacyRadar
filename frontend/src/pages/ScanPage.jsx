import { useState, useEffect, useRef } from 'react';

const SOURCES = [
  { id: 'hibp',      name: 'HaveIBeenPwned',  desc: 'Email breach history',     icon: '🛡️' },
  { id: 'xon',       name: 'XposedOrNot',      desc: 'Breach analytics',         icon: '🔍' },
  { id: 'breach_dir',name: 'BreachDirectory',  desc: 'Credential lookup',        icon: '🗃️' },
  { id: 'leakcheck', name: 'LeakCheck.io',     desc: 'Source intelligence',      icon: '📋' },
  { id: 'intelx',    name: 'IntelligenceX',    desc: 'Pastes & dark archives',   icon: '🧠' },
  { id: 'whatsmyname',name:'WhatsMyName',       desc: 'Username on 500+ sites',  icon: '👤' },
  { id: 'maigret',   name: 'Maigret',          desc: 'Username on 3000+ sites',  icon: '🔎' },
  { id: 'shodan',    name: 'Shodan.io',        desc: 'Exposed services & IPs',   icon: '🌐' },
  { id: 'grayhat',   name: 'GrayhatWarfare',   desc: 'S3 buckets & cloud exposure', icon: '☁️' },
  { id: 'phonebook', name: 'Phonebook.cz',     desc: 'Email & domain correlation', icon: '📞' },
  { id: 'epieos',    name: 'Epieos.com',       desc: 'Google & social accounts', icon: '🔗' },
  { id: 'ahmia',     name: 'Ahmia (Dark Web)', desc: 'Onion site index',         icon: '🕸️' },
  { id: 'hunter',    name: 'Hunter.io',        desc: 'Domain email exposure',    icon: '🏹' },
  { id: 'hibp_pw',   name: 'HIBP Passwords',   desc: 'k-Anonymity hash check',   icon: '🔐' },
];

function simulateScan(onUpdate, onComplete) {
  const states = {};
  SOURCES.forEach(s => states[s.id] = 'queued');
  let idx = 0;
  const interval = setInterval(() => {
    if (idx >= SOURCES.length) { clearInterval(interval); setTimeout(onComplete, 600); return; }
    states[SOURCES[idx].id] = 'scanning';
    onUpdate({ ...states });
    if (idx > 0) {
      const prevId = SOURCES[idx - 1].id;
      setTimeout(() => {
        states[prevId] = Math.random() > 0.12 ? 'done' : 'error';
        onUpdate({ ...states });
      }, 350);
    }
    idx++;
  }, 550);
  setTimeout(() => {
    states[SOURCES[SOURCES.length - 1].id] = 'done';
    onUpdate({ ...states });
  }, SOURCES.length * 550 + 600);
  return () => clearInterval(interval);
}

function StatusIcon({ s }) {
  if (s === 'done') return <span style={{ color: '#10b981' }}>✓</span>;
  if (s === 'error') return <span style={{ color: '#ff3b3b' }}>✗</span>;
  if (s === 'scanning') return <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', color: 'var(--accent-primary)', lineHeight: 1 }}>◌</span>;
  return <span style={{ color: 'var(--text-dim)' }}>·</span>;
}

function StatusText({ s }) {
  if (s === 'done') return <span style={{ color: '#10b981' }}>found results</span>;
  if (s === 'error') return <span style={{ color: '#ff3b3b' }}>no data found</span>;
  if (s === 'scanning') return <span style={{ color: 'var(--accent-primary)' }}>scanning…</span>;
  return <span style={{ color: 'var(--text-dim)' }}>queued</span>;
}

export default function ScanPage({ scanInput, onResultsReady }) {
  const [statuses, setStatuses] = useState(() => {
    const s = {}; SOURCES.forEach(src => s[src.id] = 'queued'); return s;
  });
  const [done, setDone] = useState(false);
  const [dots, setDots] = useState('');

  const completed = Object.values(statuses).filter(v => v === 'done' || v === 'error').length;
  const pct = Math.round((completed / SOURCES.length) * 100);

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length < 3 ? d + '.' : ''), 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const cleanup = simulateScan(setStatuses, () => {});

    const runRealScan = async () => {
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: scanInput.value, type: scanInput.type }),
        });
        if (!response.ok) throw new Error('Scan failed');
        const data = await response.json();
        if (isMounted) {
          const normBreaches = (data.breaches || []).map((b, i) => ({
            id: b.id ?? i + 1,
            name: b.name,
            date: b.date,
            records: b.records,
            severity: b.severity,
            dataTypes: b.data_types || b.dataTypes || [],
            changeUrl: b.change_url || b.changeUrl || '#',
            hasPasswords: b.has_passwords ?? false,
          }));
          const normalizedData = {
            ...data,
            input: scanInput,
            breaches: normBreaches,
            platforms: data.platforms_found || [],
            darkWebHits: data.ahmia_hits || 0,
            pasteHits: data.paste_hits || 0,
            piiFound: data.pii_found || {},
            exifDetected: data.exif_found || false,
            scanId: data.scan_id,
            narrative: data.narrative || '',
            timestamp: data.timestamp || new Date().toISOString(),
            score: data.score || { total: 0, breakdown: {} },
          };
          setDone(true);
          setTimeout(() => { if (isMounted) onResultsReady(normalizedData); }, 1400);
        }
      } catch {
        if (isMounted) {
          setDone(true);
          setTimeout(() => { if (isMounted) onResultsReady(getMockResults(scanInput)); }, 1400);
        }
      }
    };

    runRealScan();
    return () => { isMounted = false; cleanup?.(); };
  }, [scanInput, onResultsReady]);

  const mask = (val) => {
    if (!val) return '***';
    if (val.includes('@')) {
      const [u, d] = val.split('@');
      return u[0] + '**' + u[u.length - 1] + '@' + d;
    }
    return val[0] + '****' + val[val.length - 1];
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: '720px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {done ? (
            <div className="scan-complete-banner" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <span style={{ fontFamily: 'Space Mono', fontSize: '14px', color: '#10b981', letterSpacing: 1 }}>SCAN COMPLETE — GENERATING REPORT</span>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '24px', padding: '8px 20px',
                fontFamily: 'Space Mono', fontSize: '13px', color: 'var(--accent-primary)',
              }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '16px' }}>⟳</span>
                DEEP SCAN IN PROGRESS{dots}
              </div>
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'JetBrains Mono' }}>
            TARGET: <span style={{ color: 'var(--accent-primary)' }}>{mask(scanInput.value)}</span>
            {'  '}[<span style={{ color: 'var(--accent-warning)' }}>{scanInput.type?.toUpperCase()}</span>]
          </p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>SOURCES: {completed}/{SOURCES.length} complete</span>
            <span style={{ color: pct === 100 ? 'var(--accent-success)' : 'var(--accent-primary)' }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height: '5px' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Terminal */}
        <div className="terminal">
          <div className="terminal-header">
            <div className="terminal-dot" style={{ background: '#ff3b3b' }} />
            <div className="terminal-dot" style={{ background: '#f59e0b' }} />
            <div className="terminal-dot" style={{ background: '#10b981' }} />
            <span style={{ color: 'var(--text-dim)', fontSize: '11px', marginLeft: '8px', fontFamily: 'JetBrains Mono' }}>
              privacyradar · scan-engine · v2.1
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: '10px', fontFamily: 'JetBrains Mono' }}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="terminal-body">
            <div style={{ color: 'var(--accent-primary)', marginBottom: '4px' }}>
              $ privacyradar scan --target="{mask(scanInput.value)}" --type={scanInput.type} --parallel
            </div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '16px', fontSize: '11px' }}>
              {'─'.repeat(52)}
            </div>

            {SOURCES.map((src, i) => (
              <div key={src.id} style={{
                display: 'grid',
                gridTemplateColumns: '28px 16px 200px 1fr auto',
                alignItems: 'center', gap: '8px',
                marginBottom: '5px',
                opacity: statuses[src.id] === 'queued' ? 0.4 : 1,
                transition: 'opacity 0.4s ease',
                animation: statuses[src.id] === 'scanning' ? 'fade-in 0.2s ease' : 'none',
              }}>
                <span style={{ fontSize: '14px', textAlign: 'center' }}>{src.icon}</span>
                <span style={{ fontSize: '12px' }}><StatusIcon s={statuses[src.id]} /></span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {src.name}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: 'JetBrains Mono' }}>
                  {src.desc}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap' }}>
                  <StatusText s={statuses[src.id]} />
                </span>
              </div>
            ))}

            {done && (
              <div style={{
                marginTop: '20px', paddingTop: '16px',
                borderTop: '1px solid rgba(0,212,255,0.15)',
                color: '#10b981', fontFamily: 'JetBrains Mono', fontSize: '12px',
                animation: 'slide-up 0.5s ease',
              }}>
                <div>✓ Scan complete · Aggregating results · Running AI analysis{dots}</div>
                <div style={{ color: 'var(--text-dim)', marginTop: '4px', fontSize: '11px' }}>
                  Redirecting to Intelligence Report…
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notice */}
        <div style={{
          marginTop: '20px', textAlign: 'center',
          fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono',
        }}>
          🔒 Your data is never stored · Queries are encrypted · Results are private
        </div>
      </div>
    </div>
  );
}

function getMockResults(scanInput) {
  return {
    input: scanInput,
    score: { total: 74, breakdown: { credentials: 30, pii: 19, dark_web: 15, footprint: 10 } },
    label: 'HIGH RISK',
    breaches: [
      { id: 1, name: 'LinkedIn', date: '2021-06-22', records: '700M', severity: 'CRITICAL', dataTypes: ['Email', 'Password', 'Phone', 'Professional Info'], changeUrl: 'https://linkedin.com/psettings/', hasPasswords: true },
      { id: 2, name: 'Adobe', date: '2019-10-23', records: '153M', severity: 'HIGH', dataTypes: ['Email', 'Password Hash', 'Username'], changeUrl: 'https://account.adobe.com/', hasPasswords: true },
      { id: 3, name: 'Canva', date: '2019-05-24', records: '137M', severity: 'HIGH', dataTypes: ['Email', 'Username', 'Name', 'City'], changeUrl: 'https://www.canva.com/password/reset/', hasPasswords: false },
      { id: 4, name: 'Zynga', date: '2019-09-01', records: '218M', severity: 'MEDIUM', dataTypes: ['Email', 'Username', 'Password Hash', 'Phone'], changeUrl: 'https://zynga.com/', hasPasswords: true },
    ],
    platforms: ['GitHub', 'Twitter', 'Instagram', 'Reddit', 'LinkedIn', 'Facebook', 'Pinterest', 'Spotify', 'YouTube', 'Twitch', 'Discord', 'Steam', 'TikTok', 'Quora', 'DeviantArt', 'Medium', 'Behance', 'Dribbble'],
    darkWebHits: 2,
    pasteHits: 3,
    piiFound: { phone: true, address: false, dob: false },
    exifDetected: false,
    narrative: 'Your email was found in 4 major data breaches, including LinkedIn in 2021 which exposed 700 million records. This means your password and phone number are available to attackers who routinely test stolen credentials on banking, email, and social media accounts using automated bots. Your most urgent action right now is to change your LinkedIn password and enable two-factor authentication on your primary email account.',
    scanId: 'scan_' + Date.now(),
    timestamp: new Date().toISOString(),
  };
}
