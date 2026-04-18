import { useState, useCallback } from 'react';
import type { AIStrategy, BatchSimulationResult, SimulationResult } from '../types';
import { runGameSimulation, runBatchSimulation } from '../engine/simulation';
import { scenarios } from '../data/scenarios';
import { profiles } from '../data/profiles';
import { randomSeed } from '../utils/rng';

type BatchCount = 10 | 100 | 1000;
const BATCH_COUNTS: BatchCount[] = [10, 100, 1000];
const STRATEGIES: AIStrategy[] = ['balanced', 'cautious', 'rescueFocused'];

export function SimView() {
  const [playerCount, setPlayerCount] = useState(5);
  const [scenarioId, setScenarioId] = useState('forest');
  const [playerProfiles, setPlayerProfiles] = useState<string[]>(['builder', 'provider', 'trapper', 'scout', 'builder']);
  const [playerStrategies, setPlayerStrategies] = useState<AIStrategy[]>(['balanced', 'balanced', 'balanced', 'balanced', 'balanced']);
  const [batchCount, setBatchCount] = useState<BatchCount>(10);
  const [customBatch, setCustomBatch] = useState('');

  const [singleResult, setSingleResult] = useState<SimulationResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchSimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  const buildConfig = useCallback(() => {
    const scenario = scenarios.find((s) => s.id === scenarioId)!;
    const selectedProfiles = playerProfiles.map((id) => profiles.find((p) => p.id === id)!);
    return { playerCount, scenario, profiles: selectedProfiles, aiStrategies: playerStrategies };
  }, [playerCount, scenarioId, playerProfiles, playerStrategies]);

  const runSingle = () => {
    setRunning(true);
    setTimeout(() => {
      const result = runGameSimulation({ ...buildConfig(), rngSeed: randomSeed() });
      setSingleResult(result);
      setBatchResult(null);
      setRunning(false);
    }, 0);
  };

  const runBatch = () => {
    const count = customBatch ? parseInt(customBatch) : batchCount;
    if (isNaN(count) || count < 1) return;
    setRunning(true);
    setTimeout(() => {
      const result = runBatchSimulation({ ...buildConfig(), rngSeed: 1 }, count);
      setBatchResult(result);
      setSingleResult(null);
      setRunning(false);
    }, 0);
  };

  const updatePlayerCount = (n: number) => {
    setPlayerCount(n);
    setPlayerProfiles((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(profiles[next.length % profiles.length].id);
      return next.slice(0, n);
    });
    setPlayerStrategies((prev) => {
      const next = [...prev];
      while (next.length < n) next.push('balanced');
      return next.slice(0, n);
    });
  };

  const downloadJSON = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBatchCSV = (result: BatchSimulationResult) => {
    const rows = [['profile', 'avgScore', 'avgRescue', 'avgVitality', 'survivalPct', 'perkUsagePct', 'firstTier2Round', 'firstTier3Round'].join(',')];
    for (const [profile, stats] of Object.entries(result.byProfile)) {
      rows.push([
        profile,
        stats.avgScore.toFixed(2),
        stats.avgRescue.toFixed(2),
        stats.avgVitality.toFixed(2),
        stats.survivalPercent,
        stats.perkUsagePercent,
        stats.firstTier2RecipeAvgRound.toFixed(2),
        stats.firstTier3RecipeAvgRound.toFixed(2),
      ].join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'wilds-batch.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-col gap-3 p-3" style={{ maxWidth: 760, overflowY: 'auto', height: '100%' }}>
      <h2>Simulation Lab</h2>

      {/* ── Config card ── */}
      <div className="card flex-col gap-3">
        <h3>Setup</h3>

        <div className="flex gap-3 align-center wrap">
          <div className="flex-col gap-1">
            <label>Players</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} className={playerCount === n ? 'primary' : ''} onClick={() => updatePlayerCount(n)}>{n}</button>
              ))}
            </div>
          </div>
          <div className="flex-col gap-1">
            <label>Scenario</label>
            <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="text-xs text-dim">
              {scenarios.find((s) => s.id === scenarioId)?.description ?? ''}
            </div>
            <div className="flex gap-1 wrap">
              {scenarios.find((s) => s.id === scenarioId)?.identityTags?.map((tag) => (
                <span key={tag} className="tag active">{tag}</span>
              ))}
            </div>
            <div className="text-xs text-muted">
              {scenarios.find((s) => s.id === scenarioId)?.playstyleHint ?? ''}
            </div>
          </div>
        </div>

        <div className="flex-col gap-2">
          <label>Players</label>
          {Array.from({ length: playerCount }, (_, i) => (
            <div key={i} className="flex gap-3 align-center">
              <span className="text-xs text-muted" style={{ minWidth: 22 }}>P{i+1}</span>
              <select
                value={playerProfiles[i]}
                onChange={(e) => {
                  const next = [...playerProfiles]; next[i] = e.target.value; setPlayerProfiles(next);
                }}
              >
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                value={playerStrategies[i]}
                onChange={(e) => {
                  const next = [...playerStrategies] as AIStrategy[]; next[i] = e.target.value as AIStrategy; setPlayerStrategies(next);
                }}
              >
                {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── Run controls ── */}
      <div className="card flex-col gap-3">
        <h3>Run</h3>
        <div className="flex gap-3 align-center wrap">
          <button className="primary" onClick={runSingle} disabled={running}>
            {running ? 'Running…' : '▶ Single Run'}
          </button>
          <div className="flex gap-1 align-center">
            <span className="text-xs text-muted">Batch:</span>
            {BATCH_COUNTS.map((n) => (
              <button
                key={n}
                className={batchCount === n && !customBatch ? 'primary' : ''}
                onClick={() => { setBatchCount(n); setCustomBatch(''); }}
              >{n}</button>
            ))}
            <input
              type="number"
              value={customBatch}
              placeholder="custom"
              style={{ width: 70 }}
              onChange={(e) => setCustomBatch(e.target.value)}
            />
            <button onClick={runBatch} disabled={running}>
              {running ? 'Running…' : '▶ Run Batch'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Single result ── */}
      {singleResult && (
        <div className="card flex-col gap-3">
          <div className="flex justify-between align-center">
            <h3>Single Run — Seed {singleResult.rngSeed}</h3>
            <button onClick={() => downloadJSON(singleResult, 'wilds-single.json')}>↓ JSON</button>
          </div>

          {/* Summary row */}
          <div className="flex gap-3 wrap">
            <StatChip label="Rounds" value={String(singleResult.rounds)} />
            <StatChip label="End" value={singleResult.endCondition} />
            <StatChip
              label="Rescue"
              value={`${singleResult.groupRescueFinal}/${singleResult.groupRescueThreshold}`}
              color={singleResult.rescueReached ? 'var(--success)' : 'var(--danger)'}
            />
            <StatChip label="Winner" value={singleResult.winner ?? '—'} />
          </div>

          {/* Player table */}
          <div>
            <div className="section-label">Players</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '3px 6px' }}>Player</th>
                  <th style={{ textAlign: 'left' }}>Profile</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  <th style={{ textAlign: 'center' }}>Rescue</th>
                  <th style={{ textAlign: 'center' }}>Vitality</th>
                  <th style={{ textAlign: 'center' }}>Builds</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {singleResult.players.map((p) => (
                  <tr key={p.playerId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '4px 6px' }}>{p.playerId}</td>
                    <td>{p.profile}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{p.finalScore}</div>
                      <div className="text-xs text-dim">
                        C{p.craftPoints} U{p.usePoints} R{p.rescuePoints} S{p.survivalPoints} E{p.enginePoints}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--rescue)' }}>{p.rescueScore}</td>
                    <td style={{ textAlign: 'center', color: 'var(--vitality)' }}>{p.finalVitality}</td>
                    <td style={{ textAlign: 'center' }}>{p.persistentBuilds}</td>
                    <td style={{ textAlign: 'center', color: p.collapsed ? 'var(--danger)' : 'var(--success)' }}>
                      {p.collapsed ? `†R${p.collapseRound}` : 'alive'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recipe usage */}
          <div>
            <div className="section-label">Recipe Usage</div>
            <div className="flex gap-2 wrap">
              {Object.entries(singleResult.recipeUsageFrequency)
                .sort(([, a], [, b]) => b - a)
                .map(([id, n]) => (
                  <span key={id} className="tag">
                    {id}: <span style={{ color: 'var(--rescue)' }}>{n}</span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Batch result ── */}
      {batchResult && (
        <div className="card flex-col gap-4">
          <div className="flex justify-between align-center">
            <h3>Batch — {batchResult.count} runs — {batchResult.scenario}</h3>
            <div className="flex gap-2">
              <button onClick={() => downloadJSON(batchResult, 'wilds-batch.json')}>↓ JSON</button>
              <button onClick={() => downloadBatchCSV(batchResult)}>↓ CSV</button>
            </div>
          </div>

          {/* Key metrics */}
          <div className="flex gap-3 wrap">
            <StatChip label="Avg Score" value={batchResult.avgScore.toFixed(1)} />
            <StatChip label="Avg Rescue" value={batchResult.avgRescue.toFixed(1)} color="var(--rescue)" />
            <StatChip label="Avg Vitality" value={batchResult.avgVitality.toFixed(1)} color="var(--vitality)" />
            <StatChip
              label="Survived"
              value={`${batchResult.survivalPercent}%`}
              color={batchResult.survivalPercent > 50 ? 'var(--success)' : 'var(--danger)'}
            />
            <StatChip label="Collapsed" value={`${batchResult.collapsePercent}%`} color="var(--danger)" />
            <StatChip
              label="Rescue %"
              value={`${batchResult.rescueReachedPercent}%`}
              color={batchResult.rescueReachedPercent > 20 ? 'var(--rescue)' : 'var(--text-muted)'}
            />
            <StatChip label="Avg Rounds" value={batchResult.avgRoundsPlayed.toFixed(1)} />
          </div>

          {/* By-profile table */}
          <div>
            <div className="section-label">By Profile</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '3px 6px' }}>Profile</th>
                  <th style={{ textAlign: 'center' }}>Avg Score</th>
                  <th style={{ textAlign: 'center' }}>Avg Rescue</th>
                  <th style={{ textAlign: 'center' }}>Avg Vitality</th>
                  <th style={{ textAlign: 'center' }}>Survival%</th>
                  <th style={{ textAlign: 'center' }}>Perk%</th>
                  <th style={{ textAlign: 'center' }}>1st T2</th>
                  <th style={{ textAlign: 'center' }}>1st T3</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(batchResult.byProfile).map(([profile, stats]) => (
                  <tr key={profile} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{profile}</td>
                    <td style={{ textAlign: 'center' }}>{stats.avgScore.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--rescue)' }}>{stats.avgRescue.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--vitality)' }}>{stats.avgVitality.toFixed(1)}</td>
                    <td style={{ textAlign: 'center' }}>{stats.survivalPercent}%</td>
                    <td style={{ textAlign: 'center' }}>{stats.perkUsagePercent}%</td>
                    <td style={{ textAlign: 'center' }}>{stats.firstTier3RecipeAvgRound.toFixed(1) || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{stats.firstTier2RecipeAvgRound.toFixed(1) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Collapse timing */}
          <div>
            <div className="section-label">Collapse Timing</div>
            <div className="flex gap-2 wrap">
              {Object.entries(batchResult.collapseTimingDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([round, count]) => (
                  <span key={round} className="tag">
                    R{round}: <span style={{ color: 'var(--danger)' }}>{count}</span>
                  </span>
                ))}
            </div>
          </div>

          {/* Failures + events */}
          <div className="flex gap-4 wrap align-start">
            <div className="sim-section" style={{ flex: '1 1 180px' }}>
              <div className="section-label">Check Failures</div>
              {Object.entries(batchResult.checkFailureFrequency).map(([check, count]) => (
                <div key={check} className="sim-metric">
                  <span className="sim-metric-label">{check}</span>
                  <span className="sim-metric-value" style={{ color: 'var(--danger)' }}>{count}</span>
                </div>
              ))}
            </div>

            <div className="sim-section" style={{ flex: '1 1 180px' }}>
              <div className="section-label">Strategy Lanes</div>
              {Object.entries(batchResult.recipeFamilyFrequency).map(([family, count]) => (
                <div key={family} className="sim-metric">
                  <span className="sim-metric-label">{family}</span>
                  <span className="sim-metric-value" style={{ color: 'var(--accent)' }}>{count}</span>
                </div>
              ))}
            </div>

            <div className="sim-section" style={{ flex: '1 1 180px' }}>
              <div className="section-label">Events by Family</div>
              {Object.entries(batchResult.eventFrequencyByFamily).map(([family, count]) => (
                <div key={family} className="sim-metric">
                  <span className="sim-metric-label">{family}</span>
                  <span className="sim-metric-value" style={{ color: 'var(--warn)' }}>{count}</span>
                </div>
              ))}
              <div className="sim-metric">
                <span className="sim-metric-label">Maintenance failures</span>
                <span className="sim-metric-value" style={{ color: 'var(--danger)' }}>{batchResult.maintenanceFailureCount}</span>
              </div>
              <div className="sim-metric">
                <span className="sim-metric-label">Maintenance downtime</span>
                <span className="sim-metric-value" style={{ color: 'var(--danger)' }}>{batchResult.maintenanceDowntimeCount}</span>
              </div>
            </div>

            <div className="sim-section" style={{ flex: '1 1 180px' }}>
              <div className="section-label">Special Cards</div>
              {Object.entries(batchResult.specialCardGrantFrequency).map(([card, count]) => (
                <div key={card} className="sim-metric">
                  <span className="sim-metric-label">{card}</span>
                  <span className="sim-metric-value" style={{ color: 'var(--accent)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recipe frequency */}
          <div>
            <div className="section-label">Recipe Craft Frequency (all)</div>
            <div className="flex gap-2 wrap">
              {Object.entries(batchResult.recipeUsageFrequency)
                .sort(([, a], [, b]) => b - a)
                .map(([id, n]) => (
                  <span key={id} className="tag">
                    {id}: <span style={{ color: 'var(--rescue)' }}>{n}</span>
                  </span>
                ))}
            </div>
          </div>

          <div>
            <div className="section-label">Recipe Craft Frequency (tier 3)</div>
            <div className="flex gap-2 wrap">
              {Object.entries(batchResult.tier3RecipeUsageFrequency)
                .sort(([, a], [, b]) => b - a)
                .map(([id, n]) => (
                  <span key={id} className="tag">
                    {id}: <span style={{ color: 'var(--rescue)' }}>{n}</span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-col" style={{ gap: 1 }}>
      <span className="text-xs text-dim" style={{ letterSpacing: '0.06em' }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 14, fontWeight: 'bold', color: color ?? 'var(--text)' }}>{value}</span>
    </div>
  );
}
