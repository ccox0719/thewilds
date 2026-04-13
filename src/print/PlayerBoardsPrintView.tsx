import { profiles } from '../data/profiles';
import { config } from '../data/config';
import { PrintPage } from './PrintFrame';
import { chunk } from './printUtils';

export function PlayerBoardsPrintView() {
  const boards = Array.from({ length: 5 }, (_, index) => profiles[index % profiles.length]);
  const pages = chunk(boards, 2);

  return (
    <div className="print-stack">
      {pages.map((pageBoards, pageIndex) => (
        <PrintPage
          key={`board-page-${pageIndex}`}
          title="Player Boards"
          subtitle="Five seat baseline boards for tabletop prototyping"
          footer={`Page ${pageIndex + 1} of ${pages.length}`}
        >
          <div className="print-board-grid">
            {pageBoards.map((profile, index) => {
              const seatNumber = pageIndex * 2 + index + 1;
              return (
                <article key={`${profile.id}-${seatNumber}`} className="print-board">
                  <header className="print-board__header">
                    <div>
                      <div className="print-board__seat">Seat {seatNumber}</div>
                      <div className="print-board__name">{profile.name}</div>
                    </div>
                    <div className="print-board__perk">{profile.perk.name}</div>
                  </header>

                  <div className="print-board__row">
                    <div className="print-board__label">Vitality</div>
                    <div className="print-board__track">
                      {Array.from({ length: config.startingVitality }, (_, i) => (
                        <span key={i} className="print-board__pip" />
                      ))}
                    </div>
                  </div>

                  <div className="print-board__row">
                    <div className="print-board__label">Inventory</div>
                    <div className="print-board__slots">
                      {Array.from({ length: 8 }, (_, i) => (
                        <span key={i} className="print-board__slot" />
                      ))}
                    </div>
                  </div>

                  <div className="print-board__row">
                    <div className="print-board__label">Built</div>
                    <div className="print-board__builds">
                      {Array.from({ length: 6 }, (_, i) => (
                        <span key={i} className="print-board__build-slot" />
                      ))}
                    </div>
                  </div>

                  <div className="print-board__notes">
                    <div className="bold">Role</div>
                    <div>{profile.designNotes}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </PrintPage>
      ))}
    </div>
  );
}
