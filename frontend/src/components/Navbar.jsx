export default function Navbar({ onExifClick, onPasswordClick, onLegalClick, onScanClick }) {
  return (
    <nav>
      {/* Logo */}
      <a className="logo" onClick={onScanClick} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">🛡️</div>
        <span className="logo-text">
          PRIVACY<span>RADAR</span>
        </span>
      </a>

      {/* Nav Links */}
      <div className="nav-links">
        <a href="#features" className="hide-mobile" style={{ display: 'none' }}>Features</a>
        <button className="nav-link-btn hide-mobile" onClick={onExifClick}>EXIF Tool</button>
        <button className="nav-link-btn hide-mobile" onClick={onPasswordClick}>Password Check</button>
        <button className="nav-link-btn hide-mobile" onClick={onLegalClick}>Legal Letter</button>
        <button className="btn-primary nav-scan-btn" onClick={onScanClick}>Scan Now →</button>
      </div>
    </nav>
  );
}
