import { useState } from 'react';
import { PlayView } from './views/PlayView';
import { SimView } from './views/SimView';
import { DebugView } from './views/DebugView';
import { PrintView } from './print/PrintView';
import { PrintStandalonePage } from './print/PrintStandalonePage';
import { getPrintParam } from './print/printStandalone';

type View = 'play' | 'sim' | 'debug' | 'print';

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'play', label: 'Play' },
  { id: 'sim', label: 'Simulation' },
  { id: 'debug', label: 'Data / Debug' },
  { id: 'print', label: 'Print' },
];

export default function App() {
  const [view, setView] = useState<View>('play');
  const printParam = getPrintParam();
  if (printParam) return <PrintStandalonePage id={printParam} />;

  return (
    <div className="app-container">
      <div className="nav">
        <span className="nav-title">The Wilds</span>
        <div className="flex">
          {NAV_ITEMS.map(({ id, label }) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="app-content">
        {view === 'play'  && <PlayView />}
        {view === 'sim'   && <SimView />}
        {view === 'debug' && <DebugView />}
        {view === 'print' && <PrintView />}
      </div>
    </div>
  );
}
