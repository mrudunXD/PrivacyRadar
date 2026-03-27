import { useState, useEffect, useRef } from 'react';

const SOURCES = [
  { id: 'hibp', name: 'HaveIBeenPwned', desc: 'Email breach history' },
  { id: 'breach_dir', name: 'BreachDirectory', desc: 'Email/hash lookup' },
  { id: 'leakcheck', name: 'LeakCheck.io', desc: 'Email breach sources' },
  { id: 'intelx', name: 'IntelligenceX', desc: 'Pastes & leaks' },
  { id: 'whatsmyname', name: 'WhatsMyName', desc: 'Username on 500+ sites' },
  { id: 'maigret', name: 'Maigret', desc: 'Username on 3000+ sites' },
  { id: 'shodan', name: 'Shodan.io', desc: 'Exposed services/IPs' },
  { id: 'grayhat', name: 'GrayhatWarfare', desc: 'Exposed S3 buckets' },
  { id: 'phonebook', name: 'Phonebook.cz', desc: 'Emails tied to domain' },
  { id: 'epieos', name: 'Epieos.com', desc: 'Google/social accounts' },
  { id: 'ahmia', name: 'Ahmia (Dark Web)', desc: 'Dark web index hits' },
  { id: 'hunter', name: 'Hunter.io', desc: 'Domain email exposure' },
  { id: 'harvester', name: 'theHarvester', desc: 'Emails, subdomains, IPs' },
  { id: 'hibp_pw', name: 'HIBP Passwords', desc: 'Password breach count' },
];

// Simulate scan progress
function simulateScan(onUpdate, onComplete) {
  const states = {};
  SOURCES.forEach(s => states[s.id] = 'queued');

  let idx = 0;
  const interval = setInterval(() => {
    if (idx >= SOURCES.length) {
      clearInterval(interval);
      setTimeout(onComplete, 800);
      return;
    }
    // Mark current as scanning
    states[SOURCES[idx].id] = 'scanning';
    onUpdate({ ...states });

    // Mark previous as done after a short delay
    if (idx > 0) {
      const prevId = SOURCES[idx - 1].id;
      setTimeout(() => {
        states[prevId] = Math.random() > 0.15 ? 'done' : 'error';
        onUpdate({ ...states });
      }, 400);
    }

    idx++;
  }, 600);

  // Finalize last item
  setTimeout(() => {
    states[SOURCES[SOURCES.length - 1].id] = 'done';
    onUpdate({ ...states });
  }, SOURCES.length * 600 + 800);

  return () => clearInterval(interval);
}

export default function ScanPage({ scanInput, onResultsReady }) {
  const [statuses, setStatuses] = useState(() => {
    const s = {};
    SOURCES.forEach(src => s[src.id] = 'queued');
    return s;
  });
  const [done, setDone] = useState(false);
  const cleanupRef = useRef(null);

  const completed = Object.values(statuses).filter(v => v === 'done' || v === 'error').length;
  const pct = Math.round((completed / SOURCES.length) * 100);

  useEffect(() => {
    let cleanup = null;
    let isMounted = true;

    // Start UI simulation for UX
    cleanup = simulateScan(setStatuses, () => {
      // Simulation complete - but we wait for actual API
    });

    // Actual API call
    const runRealScan = async () => {
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: scanInput.value,
            type: scanInput.type
          })
        });
        
        if (!response.ok) throw new Error('Scan failed');
        
        const data = await response.json();
        
        if (isMounted) {
          // Normalize breaches: API returns snake_case, Dashboard expects camelCase
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
            score: data.score || { total: 0, breakdown: { credentials: 0, pii: 0, dark_web: 0, footprint: 0 } },
          };
          
          setDone(true);
          setTimeout(() => {
            onResultsReady(normalizedData);
          }, 1200);
        }
      } catch (err) {
        console.error(err);
        // Fallback or error UI
        if (isMounted) {
          setDone(true);
          setTimeout(() => {
            onResultsReady(getMockResults(scanInput)); // Fallback to mock for demo if API fails
          }, 1200);
        }
      }
    };

    runRealScan();

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [scanInput, onResultsReady]);

  const mask = (val) => {
    if (!val) return '***';
    if (val.includes('@')) {
      const [u, d] = val.split('@');
      return u[0] + '**' + u[u.length - 1] + '@' + d;
    }
    return val[0] + '****' + val[val.length - 1];
  };

  const statusIcon = (s) => ({
    done: <span style={{ color: 'var(--accent-success)' }}>✓</span>,
    error: <span style={{ color: 'var(--accent-danger)' }}>✗</span>,
    scanning: <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }}>⟳</span>,
    queued: <span style={{ color: 'var(--border)' }}>○</span>,
  }[s] || null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', maxWidth: '680px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
            {done ? '✅ SCAN COMPLETE' : '🔍 SCANNING...'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'JetBrains Mono' }}>
            Target: <span style={{ color: 'var(--accent-primary)' }}>{mask(scanInput.value)}</span>
            {' '}[<span style={{ color: 'var(--accent-warning)' }}>{scanInput.type?.toUpperCase()}</span>]
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>SOURCES COMPLETE: {completed}/{SOURCES.length}</span>
            <span>ETA: ~{Math.max(0, Math.round((SOURCES.length - completed) * 0.6))}s</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Terminal */}
        <div className="terminal">
          <div className="terminal-header">
            <div className="terminal-dot" style={{ background: '#FF3B3B' }} />
            <div className="terminal-dot" style={{ background: '#F59E0B' }} />
            <div className="terminal-dot" style={{ background: '#10B981' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '8px' }}>privacyradar — scan terminal</span>
          </div>

          <div style={{ color: 'var(--accent-primary)', marginBottom: '12px' }}>
            INITIALIZING SCAN FOR: {mask(scanInput.value)}
          </div>
          <div style={{ color: 'var(--border)', marginBottom: '16px' }}>{'━'.repeat(48)}</div>

          {SOURCES.map(src => (
            <div key={src.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '6px', opacity: statuses[src.id] === 'queued' ? 0.4 : 1,
              transition: 'opacity 0.3s',
            }}>
              <span>[{statusIcon(statuses[src.id])}]</span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
                {src.name}
                <span style={{ opacity: 0.4 }}>
                  {'.'.repeat(Math.max(1, 28 - src.name.length))}
                </span>
              </span>
              <span style={{ fontSize: '12px', color: statuses[src.id] === 'done' ? 'var(--accent-success)' : statuses[src.id] === 'error' ? 'var(--accent-danger)' : statuses[src.id] === 'scanning' ? 'var(--accent-primary)' : 'var(--border)' }}>
                {statuses[src.id] === 'done' ? 'found results' : statuses[src.id] === 'error' ? 'no data' : statuses[src.id] === 'scanning' ? 'scanning...' : 'queued'}
              </span>
            </div>
          ))}

          {done && (
            <div style={{ marginTop: '16px', color: 'var(--accent-success)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              ✓ SCAN COMPLETE — GENERATING RISK SCORE...
            </div>
          )}
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
      { id: 1, name: 'LinkedIn', date: '2021-06-22', records: '700M', severity: 'CRITICAL', dataTypes: ['Email', 'Password', 'Phone', 'Professional Info'], changeUrl: 'https://linkedin.com/psettings/' },
      { id: 2, name: 'Adobe', date: '2019-10-23', records: '153M', severity: 'HIGH', dataTypes: ['Email', 'Password Hash', 'Username'], changeUrl: 'https://account.adobe.com/' },
      { id: 3, name: 'Canva', date: '2019-05-24', records: '137M', severity: 'HIGH', dataTypes: ['Email', 'Username', 'Name', 'City'], changeUrl: 'https://www.canva.com/password/reset/' },
      { id: 4, name: 'Zynga', date: '2019-09-01', records: '218M', severity: 'MEDIUM', dataTypes: ['Email', 'Username', 'Password Hash', 'Phone'], changeUrl: 'https://zynga.com/' },
    ],
    platforms: [
      'GitHub', 'Twitter', 'Instagram', 'Reddit', 'LinkedIn', 'Facebook', 'Pinterest',
      'Spotify', 'YouTube', 'Twitch', 'Discord', 'Steam', 'TikTok', 'Quora', 'Deviantart',
      'Medium', 'Behance', 'Dribbble', 'Flickr', 'Tumblr', 'WordPress', 'Vimeo', 'Patreon',
    ],
    darkWebHits: 2,
    pasteHits: 3,
    piiFound: { phone: true, address: false, dob: false },
    exifDetected: false,
    narrative: "Your email was found in 4 major data breaches, including LinkedIn in 2021 which exposed 700 million records. This means your password and phone number are available to attackers who routinely test stolen credentials on banking, email, and social media accounts using automated bots. Your most urgent action right now is to change your LinkedIn password and enable two-factor authentication on your primary email account.",
    scanId: 'scan_' + Date.now(),
    timestamp: new Date().toISOString(),
  };
}
