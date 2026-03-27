import { useState } from 'react';
import ParticleBackground from './components/ParticleBackground.jsx';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ScanPage from './pages/ScanPage.jsx';
import ResultsDashboard from './pages/ResultsDashboard.jsx';
import ExifPage from './pages/ExifPage.jsx';
import PasswordPage from './pages/PasswordPage.jsx';
import LegalLetterPage from './pages/LegalLetterPage.jsx';

// Simple client-side router via state
export default function App() {
  const [page, setPage] = useState('landing');
  const [scanInput, setScanInput] = useState(null);
  const [scanResults, setScanResults] = useState(null);

  const handleScan = (input) => {
    setScanInput(input);
    setPage('scan');
    window.scrollTo(0, 0);
  };

  const handleResultsReady = (results) => {
    setScanResults(results);
    setPage('results');
    window.scrollTo(0, 0);
  };

  const handleNewScan = () => {
    setScanInput(null);
    setScanResults(null);
    setPage('landing');
    window.scrollTo(0, 0);
  };

  return (
    <>
      <ParticleBackground />
      <Navbar
        onScanClick={() => { setPage('landing'); window.scrollTo(0, 0); }}
        onExifClick={() => { setPage('exif'); window.scrollTo(0, 0); }}
        onPasswordClick={() => { setPage('password'); window.scrollTo(0, 0); }}
        onLegalClick={() => { setPage('legal'); window.scrollTo(0, 0); }}
      />
      {page === 'landing' && <LandingPage onScan={handleScan} onExifClick={() => { setPage('exif'); window.scrollTo(0, 0); }} />}
      {page === 'scan' && <ScanPage scanInput={scanInput} onResultsReady={handleResultsReady} />}
      {page === 'results' && <ResultsDashboard results={scanResults} onNewScan={handleNewScan} onLegalClick={() => { setPage('legal'); window.scrollTo(0, 0); }} />}
      {page === 'exif' && <ExifPage />}
      {page === 'password' && <PasswordPage />}
      {page === 'legal' && <LegalLetterPage />}
    </>
  );
}
