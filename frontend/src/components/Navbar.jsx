export default function Navbar({ onExifClick, onPasswordClick, onLegalClick, onScanClick }) {
  return (
    <nav>
      <div className="nav-inner">
        {/* Logo */}
        <div className="logo" onClick={onScanClick}>
          <div className="logo-mark">🛡️</div>
          <span>PrivacyRadar</span>
        </div>

        {/* Links */}
        <div className="nav-links">
          <button className="nav-link nav-hide" onClick={onExifClick}>EXIF Tool</button>
          <button className="nav-link nav-hide" onClick={onPasswordClick}>Password Check</button>
          <button className="nav-link nav-hide" onClick={onLegalClick}>Legal Letter</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onScanClick}
            style={{ marginLeft: '6px' }}
          >
            Start Scan →
          </button>
        </div>
      </div>
    </nav>
  );
}
