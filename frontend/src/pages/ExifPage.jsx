import { useState, useRef, useCallback } from 'react';

// We'll dynamically import exifr to keep the bundle trim
const loadExifr = () => import('exifr');

// GPS decimal degrees conversion
function toDeg(val) {
  if (Array.isArray(val)) {
    return val[0] + val[1] / 60 + val[2] / 3600;
  }
  return val;
}

function MetaRow({ icon, label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontFamily: 'Space Mono', color: 'var(--text-secondary)', marginBottom: '2px' }}>{label}</div>
        <div style={{
          fontSize: '14px', fontFamily: 'JetBrains Mono',
          color: highlight ? 'var(--accent-danger)' : 'var(--text-primary)',
          fontWeight: highlight ? 700 : 400,
        }}>{value}</div>
      </div>
      {highlight && (
        <span style={{
          fontSize: '10px', fontFamily: 'Space Mono', color: 'var(--accent-danger)',
          background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)',
          borderRadius: '4px', padding: '2px 8px', flexShrink: 0,
        }}>EXPOSED</span>
      )}
    </div>
  );
}

// Simple Leaflet-based map using iframe (no key needed)
function GpsMap({ lat, lng }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{
        position: 'absolute', top: '10px', left: '10px', zIndex: 10,
        background: 'rgba(255,59,59,0.9)', color: '#fff',
        padding: '4px 12px', borderRadius: '20px',
        fontSize: '11px', fontFamily: 'Space Mono', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ animation: 'pulse-glow 1s ease-in-out infinite', width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
        LIVE LOCATION DETECTED
      </div>
      <iframe
        title="GPS Location"
        src={mapUrl}
        style={{ width: '100%', height: '280px', border: 'none', display: 'block' }}
        loading="lazy"
      />
    </div>
  );
}

export default function ExifPage() {
  const [dragging, setDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [exifData, setExifData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stripped, setStripped] = useState(false);
  const fileInputRef = useRef(null);
  const fileRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    fileRef.current = file;
    setFileName(file.name);
    setStripped(false);
    setExifData(null);
    setLoading(true);

    // Preview
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    try {
      const exifr = await loadExifr();
      const raw = await exifr.parse(file, {
        gps: true, tiff: true, exif: true, iptc: false, icc: false, jfif: false,
        translateKeys: true, translateValues: true,
      });

      const gpsLat = raw?.latitude ?? raw?.GPSLatitude;
      const gpsLng = raw?.longitude ?? raw?.GPSLongitude;

      setExifData({
        gps: gpsLat && gpsLng
          ? { lat: typeof gpsLat === 'number' ? gpsLat : toDeg(gpsLat), lng: typeof gpsLng === 'number' ? gpsLng : toDeg(gpsLng) }
          : null,
        make: raw?.Make,
        model: raw?.Model,
        software: raw?.Software,
        dateTime: raw?.DateTimeOriginal ?? raw?.DateTime,
        width: raw?.ImageWidth ?? raw?.PixelXDimension,
        height: raw?.ImageHeight ?? raw?.PixelYDimension,
        focalLength: raw?.FocalLength,
        fStop: raw?.FNumber,
        iso: raw?.ISO,
        exposureTime: raw?.ExposureTime,
        flash: raw?.Flash,
        orientation: raw?.Orientation,
        raw,
      });
    } catch (err) {
      setExifData({ error: 'No EXIF data found in this image.', raw: {} });
    }
    setLoading(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const stripExif = () => {
    if (!fileRef.current) return;
    const file = fileRef.current;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'clean_' + (file.name.replace(/\.[^.]+$/, '') || 'photo') + '.jpg';
        a.click();
        setStripped(true);
      }, 'image/jpeg', 0.95);
    };
    img.src = URL.createObjectURL(file);
  };

  const formatDate = (dt) => {
    if (!dt) return null;
    try {
      return new Date(dt).toLocaleString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return String(dt); }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block', padding: '6px 16px', marginBottom: '16px',
            background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.3)',
            borderRadius: '20px', fontSize: '12px', fontFamily: 'Space Mono', color: 'var(--accent-danger)',
          }}>
            📸 SHOWSTOPPER DEMO FEATURE
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', marginBottom: '12px' }}>
            EXIF <span className="gradient-text">Metadata</span> Extractor
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '560px', margin: '0 auto' }}>
            Upload any photo to reveal hidden GPS location, device info, and timestamp — then download a clean, metadata-free version.
          </p>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--accent-success)', fontFamily: 'Space Mono' }}>
            🔒 Your photo is processed locally — never uploaded to our servers
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent-primary)' : 'var(--border)'}`,
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
            background: dragging ? 'rgba(0,212,255,0.04)' : 'rgba(15,25,35,0.4)',
            marginBottom: imageUrl ? '32px' : '0',
            boxShadow: dragging ? 'var(--glow-cyan)' : 'none',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => processFile(e.target.files[0])}
          />
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
          <div style={{ fontSize: '18px', fontFamily: 'Space Mono', marginBottom: '8px' }}>
            {dragging ? 'DROP IT!' : 'DROP YOUR PHOTO HERE'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            or click to upload · JPEG, PNG, HEIC, TIFF supported
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
            <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
            <div style={{ marginTop: '12px', fontSize: '14px' }}>Extracting metadata...</div>
          </div>
        )}

        {/* Results */}
        {!loading && exifData && imageUrl && (
          <div>
            {/* Image preview + GPS map */}
            <div style={{ display: 'grid', gridTemplateColumns: exifData.gps ? '1fr 1fr' : '1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', maxHeight: '320px', objectFit: 'cover' }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
                  {fileName}
                </div>
              </div>
              {exifData.gps && (
                <div>
                  <GpsMap lat={exifData.gps.lat} lng={exifData.gps.lng} />
                  <div style={{ marginTop: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--accent-danger)' }}>
                    📍 {exifData.gps.lat.toFixed(6)}°N, {exifData.gps.lng.toFixed(6)}°E
                  </div>
                </div>
              )}
            </div>

            {/* Warning banner if GPS found */}
            {exifData.gps && (
              <div style={{
                background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.4)',
                borderRadius: '10px', padding: '14px 20px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '13px', color: 'var(--accent-danger)', fontWeight: 700, marginBottom: '4px' }}>
                    GPS LOCATION DETECTED — THIS IMAGE REVEALS YOUR EXACT LOCATION
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Anyone receiving this photo can pinpoint where it was taken. Use the stripped version below before sharing online.
                  </div>
                </div>
              </div>
            )}

            {/* EXIF data table */}
            {exifData.error ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                ℹ️ {exifData.error}
              </div>
            ) : (
              <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>Extracted Metadata</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', fontFamily: 'Space Mono' }}>HIDDEN IN YOUR PHOTO FILE</p>
                {exifData.gps && (
                  <MetaRow icon="📍" label="GPS LOCATION" highlight
                    value={`${exifData.gps.lat.toFixed(6)}°N, ${exifData.gps.lng.toFixed(6)}°E`} />
                )}
                {exifData.make && (
                  <MetaRow icon="📱" label="DEVICE MAKE" value={exifData.make} />
                )}
                {exifData.model && (
                  <MetaRow icon="📷" label="DEVICE MODEL" value={exifData.model} />
                )}
                {exifData.software && (
                  <MetaRow icon="💻" label="SOFTWARE" value={exifData.software} />
                )}
                {exifData.dateTime && (
                  <MetaRow icon="📅" label="DATE & TIME TAKEN" highlight
                    value={formatDate(exifData.dateTime) || String(exifData.dateTime)} />
                )}
                {(exifData.width || exifData.height) && (
                  <MetaRow icon="📐" label="RESOLUTION" value={`${exifData.width} × ${exifData.height} pixels`} />
                )}
                {exifData.focalLength && (
                  <MetaRow icon="🔭" label="FOCAL LENGTH" value={`${exifData.focalLength}mm`} />
                )}
                {exifData.fStop && (
                  <MetaRow icon="🌀" label="APERTURE" value={`f/${exifData.fStop}`} />
                )}
                {exifData.iso && (
                  <MetaRow icon="☀️" label="ISO" value={String(exifData.iso)} />
                )}
                {exifData.exposureTime && (
                  <MetaRow icon="⏱️" label="SHUTTER SPEED" value={`1/${Math.round(1 / exifData.exposureTime)}s`} />
                )}
                {!exifData.gps && !exifData.make && !exifData.model && !exifData.dateTime && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '16px 0' }}>
                    ✓ No sensitive metadata found in this image.
                  </div>
                )}
              </div>
            )}

            {/* Strip + Download */}
            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontFamily: 'Space Mono', fontSize: '15px', marginBottom: '6px' }}>
                  {stripped ? '✅ Clean version downloaded!' : '⬇️ Download Clean Version — No EXIF'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Photo redrawn on canvas — all metadata stripped. Visually identical.
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={stripExif}
                style={{ whiteSpace: 'nowrap' }}
              >
                {stripped ? 'Download Again ↺' : '⬇ Strip & Download'}
              </button>
            </div>

            {/* Try another */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className="btn-outline" onClick={() => { setImageUrl(null); setExifData(null); setFileName(''); setStripped(false); }}>
                ← Try Another Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
