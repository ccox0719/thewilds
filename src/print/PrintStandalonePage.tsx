import { RulesPrintView } from './RulesPrintView';
import { ReferenceSheetsPrintView } from './ReferenceSheetsPrintView';
import { PlayerBoardsPrintView } from './PlayerBoardsPrintView';
import { CardsPrintView } from './CardsPrintView';
import { TokensPrintView } from './TokensPrintView';

const PAGES: Record<string, React.ComponentType> = {
  'recipe-cards': () => <CardsPrintView mode="recipes" />,
  'specialty-cards': () => <CardsPrintView mode="specialties" />,
  tokens: TokensPrintView,
  'full-rules': RulesPrintView,
  'reference-sheet': ReferenceSheetsPrintView,
  'player-boards': PlayerBoardsPrintView,
};

export function PrintStandalonePage({ id }: { id: string }) {
  const Component = PAGES[id];
  if (!Component) return <p style={{ padding: 24 }}>Unknown print template: {id}</p>;
  return (
    <div style={{ background: '#101014', minHeight: '100vh', padding: '20px 16px 40px' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => window.print()} style={{ fontSize: 13 }}>Print</button>
        <button onClick={() => window.close()} style={{ fontSize: 13 }}>Close</button>
      </div>
      <div className="print-stack">
        <Component />
      </div>
    </div>
  );
}
