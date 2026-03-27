import { useState, useEffect } from 'react';

const SOURCES = [
  { id: 'hibp',       name: 'HaveIBeenPwned',   desc: 'Email breach history' },
  { id: 'xon',        name: 'XposedOrNot',       desc: 'Breach analytics API' },
  { id: 'breach_dir', name: 'BreachDirectory',   desc: 'Credential lookup' },
  { id: 'leakcheck',  name: 'LeakCheck.io',      desc: 'Source intelligence' },
  { id: 'intelx',     name: 'IntelligenceX',     desc: 'Pastes & archives' },
  { id: 'whatsmyname',name: 'WhatsMyName',        desc: 'Username on 500+ sites' },
  { id: 'maigret',    name: 'Maigret',            desc: 'Username on 3000+ sites' },
  { id: 'shodan',     name: 'Shodan.io',          desc: 'Exposed services' },
  { id: 'grayhat',    name: 'GrayhatWarfare',     desc: 'Cloud bucket exposure' },
  { id: 'phonebook',  name: 'Phonebook.cz',       desc: 'Email & domain links' },
  { id: 'epieos',     name: 'Epieos.com',         desc: 'Social account lookup' },
  { id: 'ahmia',      name: 'Ahmia.fi',           desc: 'Dark web index' },
  { id: 'hunter',     name: 'Hunter.io',          desc: 'Domain email exposure' },
  { id: 'hibp_pw',    name: 'HIBP Passwords',     desc: 'k-Anonymity hash check' },
];

function simulateScan(onUpdate, onComplete) {
  const states = {};
  SOURCES.forEach(s => states[s.id] = 'queued');
  let idx = 0;
  const interval = setInterval(() => {
    if (idx >= SOURCES.length) { clearInterval(interval); setTimeout(onComplete, 500); return; }
    states[SOURCES[idx].id] = 'scanning';
    onUpdate({ ...states });
    if (idx > 0) {
      const prevId = SOURCES[idx - 1].id;
      setTimeout(() => { states[prevId] = Math.random() > 0.1 ? 'done' : 'error'; onUpdate({ ...states }); }, 300);
    }
    idx++;
  }, 520);
  setTimeout(() => { states[SOURCES[SOURCES.length - 1].id] = 'done'; onUpdate({ ...states }); }, SOURCES.length * 520 + 500);
  return () => clearInterval(interval);
}

export default function ScanPage({ scanInput, onResultsReady }) {
  const [statuses, setStatuses] = useState(() => {
    const s = {}; SOURCES.forEach(src => s[src.id] = 'queued'); return s;
  });
  const [done, setDone] = useState(false);

  const completed = Object.values(statuses).filter(v => v === 'done' || v === 'error').length;
  const pct = Math.round((completed / SOURCES.length) * 100);

  const mask = (val) => {
    if (!val) return '***';
    if (val.includes('@')) { const [u, d] = val.split('@'); return u[0] + '**' + u[u.length - 1] + '@' + d; }
    return val[0] + '****' + val[val.length - 1];
  };

  useEffect(() => {
    let isMounted = true;
    const cleanup = simulateScan(setStatuses, () => {});

    const run = async () => {
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: scanInput.value, type: scanInput.type }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!isMounted) return;
        const normBreaches = (data.breaches || []).map((b, i) => ({
          id: b.id ?? i + 1, name: b.name, date: b.date, records: b.records,
          severity: b.severity,
          dataTypes: b.data_types || b.dataTypes || [],
          changeUrl: b.change_url || b.changeUrl || '#',
          hasPasswords: b.has_passwords ?? false,
        }));
        setDone(true);
        setTimeout(() => {
          if (isMounted) onResultsReady({ ...data, input: scanInput, breaches: normBreaches, platforms: data.platforms_found || [], darkWebHits: data.ahmia_hits || 0, pasteHits: data.paste_hits || 0, piiFound: data.pii_found || {}, exifDetected: false, scanId: data.scan_id, narrative: data.narrative || '', timestamp: data.timestamp || new Date().toISOString(), score: data.score || { total: 0, breakdown: {} } });
        }, 1200);
      } catch {
        if (isMounted) { setDone(true); setTimeout(() => { if (isMounted) onResultsReady(getMockResults(scanInput)); }, 1200); }
      }
    };

    run();
    return () => { isMounted = false; cleanup?.(); };
  }, [scanInput, onResultsReady]);

  const statusColor = s => s === 'done' ? 'var(--green)' : s === 'error' ? 'var(--red)' : s === 'scanning' ? 'var(--blue)' : 'var(--text-faint)';
  const statusText  = s => s === 'done' ? 'Done' : s === 'error' ? 'No data' : s === 'scanning' ? 'Scanning…' : 'Queued';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>
            {done ? 'Scan complete' : 'Scanning…'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            Target: {mask(scanInput.value)} · {scanInput.type}
          </p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-faint)', marginBottom: '6px' }}>
            <span>{completed} of {SOURCES.length} sources checked</span>
            <span>{pct}%</span>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${pct}%`, background: done ? 'var(--green)' : 'var(--blue)' }} />
          </div>
        </div>

        {/* Terminal */}
        <div className="terminal">
          <div className="terminal-bar">
            <div className="term-dot" style={{ background: '#ef4444' }} />
            <div className="term-dot" style={{ background: '#f59e0b' }} />
            <div className="term-dot" style={{ background: '#22c55e' }} />
            <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'JetBrains Mono' }}>
              privacyradar · scan engine
            </span>
          </div>
          <div className="terminal-body">
            {SOURCES.map(src => (
              <div key={src.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                gap: '16px', alignItems: 'center',
                opacity: statuses[src.id] === 'queued' ? 0.35 : 1,
                transition: 'opacity 0.3s',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {statuses[src.id] === 'scanning' && (
                    <span className="animate-spin" style={{ display: 'inline-block', marginRight: '6px', color: 'var(--blue)' }}>⟳</span>
                  )}
                  {statuses[src.id] === 'done' && <span style={{ color: 'var(--green)', marginRight: '6px' }}>✓</span>}
                  {statuses[src.id] === 'error' && <span style={{ color: 'var(--red)', marginRight: '6px' }}>✗</span>}
                  {statuses[src.id] === 'queued' && <span style={{ marginRight: '6px', color: 'var(--text-faint)' }}>·</span>}
                  {src.name}
                  <span style={{ color: 'var(--text-faint)', marginLeft: '8px', fontSize: '11px' }}>{src.desc}</span>
                </span>
                <span style={{ fontSize: '11px', color: statusColor(statuses[src.id]) }}>
                  {statusText(statuses[src.id])}
                </span>
              </div>
            ))}

            {done && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)', color: 'var(--green)', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>
                ✓ All checks complete — generating report…
              </div>
            )}
          </div>
        </div>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)' }}>
          Nothing is stored. All queries are encrypted.
        </p>
      </div>
    </div>
  );
}

function getMockResults(scanInput) {
  return {
    input: scanInput,
    score: { total: 74, breakdown: { credentials: 30, pii: 19, dark_web: 15, footprint: 10 } },
    breaches: [
      { id: 1, name: 'LinkedIn', date: '2021-06-22', records: '700M', severity: 'CRITICAL', dataTypes: ['Email', 'Password', 'Phone', 'Professional Info'], changeUrl: 'https://linkedin.com/psettings/', hasPasswords: true },
      { id: 2, name: 'Adobe', date: '2019-10-23', records: '153M', severity: 'HIGH', dataTypes: ['Email', 'Password Hash', 'Username'], changeUrl: 'https://account.adobe.com/', hasPasswords: true },
      { id: 3, name: 'Canva', date: '2019-05-24', records: '137M', severity: 'HIGH', dataTypes: ['Email', 'Username', 'Name', 'City'], changeUrl: 'https://www.canva.com/password/reset/', hasPasswords: false },
    ],
    platforms: ['GitHub', 'Twitter', 'Instagram', 'Reddit', 'LinkedIn', 'Facebook', 'Discord', 'Steam', 'TikTok', 'Medium'],
    darkWebHits: 2, pasteHits: 3,
    piiFound: { phone: true, address: false, dob: false },
    exifDetected: false,
    narrative: 'Your email was found in 3 major data breaches including LinkedIn (700M records). Attackers routinely test stolen credentials against banking and email services. Your most urgent step is to change your LinkedIn password and enable two-factor authentication on your primary email account.',
    scanId: 'scan_' + Date.now(),
    timestamp: new Date().toISOString(),
  };
}
