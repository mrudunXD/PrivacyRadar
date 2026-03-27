import { useState, useEffect } from 'react';

export default function Navbar({ onScanClick, onExifClick, onPasswordClick, onLegalClick }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav style={{ background: scrolled ? 'rgba(2,8,23,0.97)' : 'rgba(2,8,23,0.7)' }}>
      <a href="/" className="logo">⬡ PRIVACY<span style={{ color: 'var(--text-primary)' }}>RADAR</span></a>
      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onExifClick?.(); }}>EXIF Tool</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onPasswordClick?.(); }}>Password Check</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onLegalClick?.(); }}>Legal Letter</a>
        <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={onScanClick}>
          Scan Now →
        </button>
      </div>
    </nav>
  );
}
