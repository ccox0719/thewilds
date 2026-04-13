import { useState } from 'react';
import { recipes } from '../data/recipes';
import { roundEvents } from '../data/events';
import { specialCards } from '../data/specialCards';
import { profiles } from '../data/profiles';
import { scenarios } from '../data/scenarios';
import { config } from '../data/config';
import { getTagTooltip, getSurvivalTooltip } from '../data/tagInfo';
import { MaterialPill } from '../components/MaterialPill';
import type { MaterialType, Tag } from '../types';

type Tab = 'recipes' | 'cards' | 'events' | 'profiles' | 'scenarios' | 'config';

const TAB_LABELS: Record<Tab, string> = {
  recipes: 'Recipes',
  cards: 'Blueprints',
  events: 'Events',
  profiles: 'Profiles',
  scenarios: 'Scenarios',
  config: 'Config',
};

export function DebugView() {
  const [tab, setTab] = useState<Tab>('recipes');
  const [, setTick] = useState(0);

  const refresh = () => setTick((v) => v + 1);
  const togglePerk = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    profile.perk.enabled = !profile.perk.enabled;
    if (profileId === 'builder') config.perks.builderEnabled = profile.perk.enabled;
    if (profileId === 'provider') config.perks.providerEnabled = profile.perk.enabled;
    if (profileId === 'trapper') config.perks.trapperEnabled = profile.perk.enabled;
    if (profileId === 'scout') config.perks.scoutEnabled = profile.perk.enabled;
    refresh();
  };

  return (
    <div className="flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div className="flex gap-1 p-2" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'primary' : ''} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
        <span className="text-xs text-dim" style={{ marginLeft: 8, alignSelf: 'center' }}>
          Data viewer — read only
        </span>
      </div>

      <div className="p-3 flex-col gap-3" style={{ overflowY: 'auto', flex: 1 }}>
        {tab === 'recipes'   && <RecipesTab />}
        {tab === 'cards'     && <CardsTab />}
        {tab === 'events'    && <EventsTab />}
        {tab === 'profiles'  && <ProfilesTab onToggle={togglePerk} />}
        {tab === 'scenarios' && <ScenariosTab />}
        {tab === 'config'    && <ConfigTab />}
      </div>
    </div>
  );
}

/* ── Recipes tab ── */
function RecipesTab() {
  return (
    <>
      <div className="flex align-center gap-2">
        <h2>Recipes</h2>
        <span className="chip family">{recipes.length} total</span>
      </div>
      {[1, 2].map((tier) => {
        const tierRecipes = recipes.filter((r) => r.tier === tier);
        return (
          <div key={tier} className="flex-col gap-2">
            <div className="flex align-center gap-2 mt-2">
              <h3>Tier {tier}</h3>
              <span className={`chip ${tier === 1 ? 'tier1' : 'tier2'}`}>
                {tier === 1 ? 'BASIC' : 'ADVANCED'}
              </span>
              <span className="text-xs text-dim">{tierRecipes.length} recipes</span>
            </div>

            {tierRecipes.map((recipe) => (
              <div key={recipe.id} className="card flex-col gap-2">
                <div className="flex justify-between align-center wrap gap-2">
                  <div className="flex gap-2 align-center">
                    <span className="bold" style={{ fontSize: 13 }}>{recipe.name}</span>
                    <span className={`chip ${recipe.type === 'persistentEngine' ? 'type-engine' : recipe.type === 'persistent' ? 'type-persistent' : 'type-one-time'}`}>
                      {recipe.type === 'persistentEngine' ? 'ENGINE' : recipe.type === 'persistent' ? 'PERSIST' : 'ONE-TIME'}
                    </span>
                    <span className="chip family">{recipe.family}</span>
                  </div>
                  <span className="text-xs text-dim">id: {recipe.id} · baseValue: {recipe.baseValue}</span>
                </div>

                {/* Cost */}
                <div className="flex gap-1 align-center wrap">
                  <span className="text-xs text-dim">Cost:</span>
                  {Object.entries(recipe.cost).map(([mat, qty]) => (
                    <MaterialPill key={mat} material={mat as MaterialType} count={qty as number} />
                  ))}
                </div>

                {/* Tags */}
                {recipe.requiresTags.length > 0 && (
                  <div className="flex gap-1 align-center wrap">
                    <span className="text-xs text-dim">Needs:</span>
                    {recipe.requiresTags.map((t: Tag) => (
                      <span key={t} className="tag active" title={getTagTooltip(t)}>{t}</span>
                    ))}
                  </div>
                )}
                {recipe.tags.length > 0 && (
                  <div className="flex gap-1 align-center wrap">
                    <span className="text-xs text-dim">Grants:</span>
                    {recipe.tags.map((t: Tag) => (
                      <span key={t} className="tag active" title={getTagTooltip(t)}>{t}</span>
                    ))}
                  </div>
                )}
                {recipe.satisfiesCheck && (
                  <div className="flex gap-1 align-center">
                    <span className="text-xs text-dim">Satisfies:</span>
                    <span className="tag safe" title={getSurvivalTooltip(recipe.satisfiesCheck, 0)}>
                      {recipe.satisfiesCheck}
                    </span>
                  </div>
                )}

                {/* Effects */}
                {recipe.effects.length > 0 && (
                  <div className="flex gap-2 wrap">
                    <span className="text-xs text-dim">Effects:</span>
                    {recipe.effects.map((e, i) => (
                      <span
                        key={i}
                        className="tag"
                        style={{
                          color: e.type === 'rescue' ? 'var(--rescue)' : e.type === 'vitality' ? 'var(--vitality)' : 'var(--text-muted)',
                          borderColor: e.type === 'rescue' ? 'rgba(232,184,75,0.4)' : e.type === 'vitality' ? 'rgba(107,221,170,0.4)' : undefined,
                        }}
                      >
                        {e.type} +{e.amount}{e.duration ? ` (${e.duration})` : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Maintenance */}
                {recipe.maintenance && (
                  <div className="text-xs text-warn">
                    Upkeep: {Object.entries(recipe.maintenance.cost).map(([m, q]) => `${q} ${m}`).join(' + ')}
                    {recipe.maintenance.startRound ? ` · starts R${recipe.maintenance.startRound}` : ''}
                    {recipe.maintenance.interval ? ` · every ${recipe.maintenance.interval} rounds` : ''}
                  </div>
                )}

                {/* Design notes */}
                <div className="text-xs text-dim italic">{recipe.designNotes}</div>
                <div className="text-xs text-muted">Print: "{recipe.printEffectText}"</div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

/* ── Blueprints tab ── */
function CardsTab() {
  const familyOrder = ['shelter-climate', 'food-engine', 'processing', 'signal-rescue', 'survival', 'recovery'] as const;
  const grouped = specialCards.reduce<Record<string, (typeof specialCards)[number][]>>((acc, card) => {
    (acc[card.family] ??= []).push(card);
    return acc;
  }, {});

  return (
    <>
      <div className="flex align-center gap-2">
        <h2>Special Cards / Blueprints</h2>
        <span className="chip family">{specialCards.length} total</span>
      </div>
      <div className="flex-col gap-3">
        {familyOrder.filter((family) => grouped[family]?.length).map((family) => (
          <div key={family}>
            <div className="flex align-center gap-2 mb-1">
              <h3>{family.replace('-', ' ')}</h3>
              <span className="text-xs text-dim">{grouped[family].length}</span>
            </div>
            <div className="flex-col gap-2">
              {grouped[family].map((card) => (
                <div key={card.id} className="card flex-col gap-2">
                  <div className="flex justify-between align-center">
                    <span className="bold">{card.name}</span>
                    <span className="text-xs text-dim">{card.id} · {card.source}</span>
                  </div>
                  <div className="text-sm">{card.printEffectText}</div>
                  <div className="text-xs text-dim italic">{card.designNotes}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Events tab ── */
function EventsTab() {
  const escalation = roundEvents.filter(e => e.family === 'escalation');
  const opportunity = roundEvents.filter(e => e.family === 'opportunity');
  const neutral = roundEvents.filter(e => e.family === 'neutral');

  const EventCard = ({ event }: { event: typeof roundEvents[number] }) => (
    <div className={`card flex-col gap-2${event.family === 'escalation' ? ' danger-card' : ''}`}>
      <div className="flex justify-between align-center wrap gap-2">
        <div className="flex align-center gap-2">
          <span className="bold">{event.name}</span>
          <span
            className="chip"
            style={{
              background: event.family === 'escalation' ? 'var(--danger-dim)' : event.family === 'opportunity' ? 'var(--success-dim)' : 'var(--surface3)',
              borderColor: event.family === 'escalation' ? 'var(--danger-border)' : event.family === 'opportunity' ? 'var(--success-border)' : 'var(--border)',
              color: event.family === 'escalation' ? 'var(--danger)' : event.family === 'opportunity' ? 'var(--success)' : 'var(--text-muted)',
            }}
          >
            {event.family.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-dim">
          {event.scenarioIds.join(', ')} · R{event.startRound ?? 1}–{event.endRound ?? '∞'}
        </span>
      </div>
      <div className="text-sm text-muted">{event.description}</div>
      <div className="flex gap-3 wrap text-xs text-dim">
        {event.temperatureShift != null && event.temperatureShift !== 0 && (
          <span>Temp {event.temperatureShift > 0 ? '+' : ''}{event.temperatureShift}</span>
        )}
        {event.signalRescueBonus != null && event.signalRescueBonus !== 0 && (
          <span style={{ color: 'var(--rescue)' }}>Signal +{event.signalRescueBonus}</span>
        )}
        {Object.entries(event.pressureBonus ?? {}).map(([check, amt]) => (
          <span key={check} style={{ color: 'var(--warn)' }}>{check} {amt >= 0 ? '+' : ''}{amt}</span>
        ))}
        {Object.entries(event.recipeFamilyCostDelta ?? {}).map(([family, amt]) => (
          <span key={family}>{family} cost {amt >= 0 ? '+' : ''}{amt}</span>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex align-center gap-2">
        <h2>Round Events</h2>
        <span className="chip family">{roundEvents.length} total</span>
      </div>
      {escalation.length > 0 && (
        <div className="flex-col gap-2">
          <h3>Escalation ({escalation.length})</h3>
          {escalation.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
      {opportunity.length > 0 && (
        <div className="flex-col gap-2">
          <h3>Opportunity ({opportunity.length})</h3>
          {opportunity.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
      {neutral.length > 0 && (
        <div className="flex-col gap-2">
          <h3>Neutral ({neutral.length})</h3>
          {neutral.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </>
  );
}

/* ── Profiles tab ── */
function ProfilesTab({ onToggle }: { onToggle: (profileId: string) => void }) {
  return (
    <>
      <h2>Profiles</h2>
      <div className="flex-col gap-3">
        {profiles.map((profile) => (
          <div key={profile.id} className="card flex-col gap-2">
            <div className="flex justify-between align-center">
              <span className="bold" style={{ fontSize: 14 }}>{profile.name}</span>
              <button
                className={profile.perk.enabled ? 'primary' : ''}
                onClick={() => onToggle(profile.id)}
              >
                Perk {profile.perk.enabled ? 'enabled' : 'disabled'}
              </button>
            </div>
            <div className="text-sm">{profile.perk.description}</div>
            <div className="text-xs text-dim">Trigger: {profile.perk.triggerCondition}</div>
            <div className="text-xs text-muted italic">{profile.designNotes}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Scenarios tab ── */
function ScenariosTab() {
  return (
    <>
      <h2>Scenarios</h2>
      <div className="flex-col gap-3">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="card flex-col gap-2">
            <div className="flex justify-between align-center">
              <span className="bold" style={{ fontSize: 14 }}>{scenario.name}</span>
              <span className="text-xs text-dim">id: {scenario.id}</span>
            </div>
            <div className="text-sm text-muted">{scenario.description}</div>
            <div className="flex gap-1 wrap mt-1">
              {Object.entries(scenario.bagComposition).map(([mat, qty]) => (
                <MaterialPill key={mat} material={mat as MaterialType} count={qty as number} />
              ))}
            </div>
            <div className="flex gap-3 text-xs text-dim">
              <span>Bag total: {Object.values(scenario.bagComposition).reduce((a, b) => a + b, 0)} tokens</span>
              <span>Temp pressure: {scenario.temperaturePressure}</span>
              <span>Rescue adjust: +{scenario.rescueThresholdAdjust ?? 0}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Config tab ── */
function ConfigTab() {
  const scoring = config.scoring;
  const pressure = config.pressure ?? {};

  return (
    <>
      <h2>Balance Config</h2>
      <div className="flex gap-3 wrap align-start">
        <div className="card flex-col gap-2" style={{ flex: '1 1 200px' }}>
          <h3>Core</h3>
          <ConfRow label="Starting vitality" value={config.startingVitality} />
          <ConfRow label="Simulation ceiling" value={config.simulationCeiling} />
          <ConfRow label="Pressure schedule" value={config.pressureSchedule.join(', ')} />
        </div>

        <div className="card flex-col gap-2" style={{ flex: '1 1 200px' }}>
          <h3>Scoring</h3>
          {Object.entries(scoring).map(([k, v]) => (
            <ConfRow key={k} label={k} value={String(v)} />
          ))}
        </div>

        {Object.keys(pressure).length > 0 && (
          <div className="card flex-col gap-2" style={{ flex: '1 1 200px' }}>
            <h3>Pressure</h3>
            {Object.entries(pressure).map(([k, v]) => (
              <ConfRow key={k} label={k} value={String(v)} />
            ))}
          </div>
        )}
      </div>

      <div className="card flex-col gap-1 mt-2">
        <h3>Full config (JSON)</h3>
        <pre className="text-xs" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </>
  );
}

function ConfRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="sim-metric">
      <span className="sim-metric-label">{label}</span>
      <span className="sim-metric-value text-xs">{value}</span>
    </div>
  );
}
