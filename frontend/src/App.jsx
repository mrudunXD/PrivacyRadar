import { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ScanPage from './pages/ScanPage.jsx';
import ResultsDashboard from './pages/ResultsDashboard.jsx';
import ExifPage from './pages/ExifPage.jsx';
import PasswordPage from './pages/PasswordPage.jsx';
import LegalLetterPage from './pages/LegalLetterPage.jsx';

export default function App() {
  const [page, setPage] = useState('landing');
  const [scanInput, setScanInput] = useState(null);
  const [scanResults, setScanResults] = useState(null);

  const go = (p) => { setPage(p); window.scrollTo(0, 0); };

  const handleScan = (input) => { setScanInput(input); go('scan'); };
  const handleResultsReady = (results) => { setScanResults(results); go('results'); };
  const handleNewScan = () => { setScanInput(null); setScanResults(null); go('landing'); };

  return (
    <>
      <Navbar
        onScanClick={() => go('landing')}
        onExifClick={() => go('exif')}
        onPasswordClick={() => go('password')}
        onLegalClick={() => go('legal')}
      />
      {page === 'landing'   && <LandingPage onScan={handleScan} />}
      {page === 'scan'      && <ScanPage scanInput={scanInput} onResultsReady={handleResultsReady} />}
      {page === 'results'   && <ResultsDashboard results={scanResults} onNewScan={handleNewScan} onLegalClick={() => go('legal')} />}
      {page === 'exif'      && <ExifPage />}
      {page === 'password'  && <PasswordPage />}
      {page === 'legal'     && <LegalLetterPage />}
    </>
  );
}
