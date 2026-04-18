import { profiles } from '../data/profiles';
import { config } from '../data/config';
import { getMaterialGlyph, getMeterGlyph } from '../data/iconography';

const SEAT_COUNT = 5;
const ROUND_COUNT = config.pressureSchedule.length;

function PlayerBoard({ seatNumber, profile }: { seatNumber: number; profile: typeof profiles[0] }) {
  return (
    <article
      className="print-board"
      style={{
        '--board-accent': profile.theme.accent,
        '--board-light': profile.theme.light,
      } as React.CSSProperties}
    >
      {/* ── CHARACTER HEADER ──────────────────────────── */}
      <div className="print-board__header">
        <div className="print-board__header-main">
          <div className="print-board__role-label">{profile.theme.roleLabel}</div>
          <div className="print-board__character-name">{profile.name}</div>
        </div>
        <div className="print-board__header-meta">
          <div className="print-board__seat-badge">Seat {seatNumber}</div>
        </div>
      </div>

      {/* ── PERK ────────────────────────────────────────── */}
      <div className="print-board__perk-block">
        <div className="print-board__perk-row">
          <span className="print-board__perk-eyebrow">Perk</span>
          <span className="print-board__perk-name">{profile.perk.name}</span>
          <label className="print-board__perk-used-label">
            <span className="print-board__checkbox" />
            Used
          </label>
        </div>
        <div className="print-board__perk-text">{profile.perk.description}</div>
      </div>

      {/* ── ROUND TRACK ─────────────────────────────────── */}
      <div className="print-board__section">
        <div className="print-board__section-label">
          <span className="print-board__section-icon" aria-hidden="true">{getMeterGlyph('vitality')}</span>
          Round
        </div>
        <div className="print-board__round-track">
          {Array.from({ length: ROUND_COUNT }, (_, i) => (
            <div key={i} className="print-board__round-box">
              <span className="print-board__round-num">{i + 1}</span>
              <span className="print-board__round-check" />
            </div>
          ))}
        </div>
      </div>

      {/* ── VITALITY ────────────────────────────────────── */}
      <div className="print-board__section">
        <div className="print-board__section-label">
          <span className="print-board__section-icon" aria-hidden="true">{getMeterGlyph('vitality')}</span>
          Vitality
        </div>
        <div className="print-board__track">
          {Array.from({ length: config.startingVitality }, (_, i) => (
            <span key={i} className="print-board__pip">
              <span className="print-board__pip-num">{config.startingVitality - i}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HUNGER ──────────────────────────────────────── */}
      <div className="print-board__section">
        <div className="print-board__section-label">
          <span className="print-board__section-icon" aria-hidden="true">{getMaterialGlyph('Food')}</span>
          Hunger
        </div>
        <div className="print-board__hunger-track">
          {Array.from({ length: config.hungerMissesPerDamage }, (_, i) => (
            <span key={i} className="print-board__hunger-tick" />
          ))}
          <span className="print-board__hunger-note">missed feeds → -1 Vitality</span>
        </div>
      </div>

      {/* ── HYDRATION ───────────────────────────────────── */}
      <div className="print-board__section">
        <div className="print-board__section-label">
          <span className="print-board__section-icon" aria-hidden="true">{getMeterGlyph('thirst')}</span>
          Hydration
        </div>
        <div className="print-board__hydration-buffer">
          <div className="print-board__hydration-buffer-intro">
            Safe water fills the buffer. Raw water only protects for the round.
          </div>
          <div className="print-board__hydration-buffer-slots">
            {(['-3', '-2', '-1'] as const).map((label) => (
              <div key={label} className="print-board__hydration-buffer-block">
                <span className="print-board__hydration-buffer-penalty">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WARMTH ──────────────────────────────────────── */}
      <div className="print-board__section">
        <div className="print-board__section-label">
          <span className="print-board__section-icon" aria-hidden="true">{getMeterGlyph('warmth')}</span>
          Warmth
        </div>
        <div className="print-board__warmth-block">
          <div className="print-board__warmth-track">
            {[
              { label: 'Cold 3', cls: 'cold-3' },
              { label: 'Cold 2', cls: 'cold-2' },
              { label: 'Cold 1', cls: 'cold-1' },
              { label: 'Comfort', cls: 'center' },
              { label: 'Heat 1', cls: 'heat-1' },
              { label: 'Heat 2', cls: 'heat-2' },
              { label: 'Heat 3', cls: 'heat-3' },
            ].map(({ label, cls }) => (
              <div
                key={label}
                className={`print-board__warmth-cell print-board__warmth-cell--${cls}`}
              >
                <span className="print-board__warmth-cell-label">{label}</span>
                <span className="print-board__round-check" />
              </div>
            ))}
          </div>
          <div className="print-board__warmth-legend">
            <span className="print-board__warmth-legend-cold">← Cold</span>
            <span className="print-board__warmth-legend-center">Comfort</span>
            <span className="print-board__warmth-legend-hot">Heat →</span>
          </div>
        </div>
      </div>

      {/* ── RESCUE ──────────────────────────────────────── */}
      <div className="print-board__section">
        <div className="print-board__section-label">
          <span className="print-board__section-icon" aria-hidden="true">{getMeterGlyph('rescue')}</span>
          Shared Rescue
        </div>
        <div className="print-board__round-track">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="print-board__round-box">
              <span className="print-board__round-num">{i + 1}</span>
              <span className="print-board__round-check" />
            </div>
          ))}
        </div>
      </div>

    </article>
  );
}

export function PlayerBoardsPrintView() {
  const seats = Array.from({ length: SEAT_COUNT }, (_, i) => ({
    seatNumber: i + 1,
    profile: profiles[i % profiles.length],
  }));

  // pair up seats: 2 per landscape page
  const pages: (typeof seats)[] = [];
  for (let i = 0; i < seats.length; i += 2) {
    pages.push(seats.slice(i, i + 2));
  }

  return (
    <div className="print-stack">
      {pages.map((pair, pageIdx) => (
        <section key={pageIdx} className="print-page print-page--landscape print-page--boards">
          <div className="print-board-pair">
            {pair.map(({ seatNumber, profile }) => (
              <PlayerBoard key={seatNumber} seatNumber={seatNumber} profile={profile} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
