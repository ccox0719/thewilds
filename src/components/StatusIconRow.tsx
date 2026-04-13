interface StatusIconRowProps {
  hungerSatisfied: boolean;
  hungerDamage: number;
  thirstSatisfied: boolean;
  thirstDamage: number;
  warmthSatisfied: boolean;
  warmthDamage: number;
  vitalityDelta?: number;
}

interface StatusIconProps {
  label: string;
  symbol: string;
  satisfied: boolean;
  damage: number;
  tooltip?: string;
}

function StatusIcon({ label, symbol, satisfied, damage, tooltip }: StatusIconProps) {
  const cls = satisfied ? 'safe' : damage >= 2 ? 'danger' : 'warn';
  const suffix = !satisfied && damage > 0 ? ` −${damage}` : '';
  return (
    <div className={`status-icon ${cls}`} title={tooltip}>
      <span className="icon">{symbol}</span>
      <span>{label}{suffix}</span>
    </div>
  );
}

export function StatusIconRow({
  hungerSatisfied,
  hungerDamage,
  thirstSatisfied,
  thirstDamage,
  warmthSatisfied,
  warmthDamage,
  vitalityDelta,
}: StatusIconRowProps) {
  return (
    <div className="status-icon-row">
      <StatusIcon
        label={hungerSatisfied ? 'FED' : 'HUNGRY'}
        symbol="✦"
        satisfied={hungerSatisfied}
        damage={hungerDamage}
        tooltip={`Hunger: ${hungerSatisfied ? 'satisfied' : `takes ${hungerDamage} vitality damage`}`}
      />
      <StatusIcon
        label={thirstSatisfied ? 'WATER' : 'THIRST'}
        symbol="◈"
        satisfied={thirstSatisfied}
        damage={thirstDamage}
        tooltip={`Thirst: ${thirstSatisfied ? 'satisfied' : `takes ${thirstDamage} vitality damage`}`}
      />
      <StatusIcon
        label={warmthSatisfied ? 'WARM' : 'COLD'}
        symbol="△"
        satisfied={warmthSatisfied}
        damage={warmthDamage}
        tooltip={`Warmth: ${warmthSatisfied ? 'satisfied' : `takes ${warmthDamage} vitality damage`}`}
      />
      {vitalityDelta !== undefined && (
        <div
          className={`status-forecast ${vitalityDelta > 0 ? 'positive' : vitalityDelta < 0 ? 'negative' : 'neutral'}`}
          title="Projected vitality change at end of round"
        >
          {vitalityDelta > 0 ? '+' : ''}{vitalityDelta} VP
        </div>
      )}
    </div>
  );
}
