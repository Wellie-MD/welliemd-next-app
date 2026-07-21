import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { WeightData, DeviceMetrics } from '../types';
import HealthTabs from './HealthTabs';

interface TelemetryDashboardProps {
  deviceMetrics: DeviceMetrics;
  weight: WeightData;
  onOpenGoalModal: () => void;
}

const CARD: React.CSSProperties = {
  background: 'var(--km-s1)',
  border: '1px solid var(--km-b)',
  borderRadius: 14,
  marginBottom: 10,
  overflow: 'hidden',
};

export default function TelemetryDashboard({
  deviceMetrics,
  weight,
  onOpenGoalModal,
}: TelemetryDashboardProps) {
  return (
    <>
      <WeightTrendCard weight={weight} onOpenGoalModal={onOpenGoalModal} />
      <ReadinessCard deviceMetrics={deviceMetrics} />

      {/* ─── Health Tabs ─── */}
      <HealthTabs weightData={weight} deviceMetrics={deviceMetrics} />
    </>
  );
}

/* ─── Today's readiness card ─── */
export function ReadinessCard({ deviceMetrics }: { deviceMetrics: DeviceMetrics }) {
  if (deviceMetrics.readiness === undefined || deviceMetrics.readiness <= 0) return null;

  return (
    <div style={CARD}>
      <div style={{ padding: '14px 18px 6px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 6,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>Today's readiness</span>
          <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>via Junction</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 36,
              lineHeight: 1,
              color:
                deviceMetrics.readiness >= 75
                  ? 'var(--km-gr)'
                  : deviceMetrics.readiness >= 55
                  ? 'var(--km-am)'
                  : 'var(--km-re)',
            }}
          >
            {deviceMetrics.readiness}
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color:
                deviceMetrics.readiness >= 75
                  ? 'var(--km-gr)'
                  : deviceMetrics.readiness >= 55
                  ? 'var(--km-am)'
                  : 'var(--km-re)',
            }}
          >
            {deviceMetrics.readiness >= 85
              ? 'Optimal'
              : deviceMetrics.readiness >= 75
              ? 'Good'
              : deviceMetrics.readiness >= 55
              ? 'Fair'
              : 'Low'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--km-tm)' }}>
            out of 100
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid var(--km-b)',
          textAlign: 'center',
        }}
      >
        {[
          { label: 'RECOVERY', val: deviceMetrics.recovery, suf: '/100' },
          { label: 'SLEEP', val: deviceMetrics.sleepScore, suf: '/100' },
          { label: 'RESTING HR', val: deviceMetrics.restingHr, suf: ' bpm' },
        ].map((m, i) => (
          <div
            key={m.label}
            style={{
              borderLeft: i > 0 ? '1px solid var(--km-b)' : 'none',
              padding: '12px 8px',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: 'var(--km-tm)',
                marginBottom: 3,
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {m.val}
              <span style={{ fontSize: 10, color: 'var(--km-tm)', fontWeight: 400, marginLeft: 1 }}>
                {m.suf}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Weight trend card ─── */
export function WeightTrendCard({
  weight,
  onOpenGoalModal,
  syncedFrom,
  bottomAction,
}: {
  weight: WeightData;
  onOpenGoalModal?: () => void;
  syncedFrom?: string;
  bottomAction?: { label: string; onClick: () => void };
}) {
  const cur = weight.series[weight.series.length - 1] ?? weight.start;
  const chg = cur != null && weight.start != null ? Math.abs(+(cur - weight.start).toFixed(1)) : null;
  const pct = cur != null && weight.start ? Math.abs(((cur - weight.start) / weight.start) * 100) : null;
  const bmi = weight.latestBmi;
  const bmiCat = weight.latestBmiCategory;

  return (
    <div style={CARD}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 18px',
          borderBottom: '1px solid var(--km-b)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'var(--km-acp)',
              color: 'var(--km-ac)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={17} strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14.5 }}>Weight progress</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>
          Last {weight.series.length} {weight.series.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div
        style={{
          padding: '4px 18px 2px',
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 30,
            color: 'var(--km-t)',
          }}
        >
          {cur != null ? cur : 'Unavailable'} <span style={{ fontSize: 14, color: 'var(--km-tm)' }}>{cur != null ? 'lb' : ''}</span>
        </span>
        {chg != null && pct != null && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--km-gr)' }}>
            Change {chg} lb · {pct.toFixed(1)}%
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--km-tm)' }}>
          BMI <b style={{ color: 'var(--km-t)' }}>{bmi != null ? bmi.toFixed(1) : 'Unavailable'}</b>{bmiCat ? ` · ${bmiCat}` : ''}
        </span>
      </div>

      {onOpenGoalModal && (
        <div style={{ padding: '2px 18px 2px', fontSize: 12, color: 'var(--km-t2)' }}>
          {weight.targetBmi && weight.targetBmi > 0 ? (
            <>
              Target BMI <b style={{ color: 'var(--km-t)' }}>{weight.targetBmi.toFixed(1)}</b>{' '}
              <span
                style={{ color: 'var(--km-ac)', cursor: 'pointer', marginLeft: 6 }}
                onClick={onOpenGoalModal}
              >
                Edit
              </span>
            </>
          ) : (
            <span
              style={{ color: 'var(--km-ac)', cursor: 'pointer' }}
              onClick={onOpenGoalModal}
            >
              + Set a target BMI
            </span>
          )}
        </div>
      )}

      {syncedFrom && (
        <div style={{ padding: '0 18px 2px', fontSize: 10.5, fontWeight: 400, color: 'var(--km-tm)' }}>
          Synced from {syncedFrom}
        </div>
      )}

      <div style={{ padding: '4px 14px 0' }}>
        <WeightTrendChart points={weight.points} />
      </div>
      <div style={{ padding: '0 14px 8px' }}>
        <BmiTrendChart points={weight.points} targetBmi={weight.targetBmi} />
      </div>

      {bottomAction && (
        <div style={{ padding: '2px 18px 14px', textAlign: 'center' }}>
          <button
            onClick={bottomAction.onClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--km-ac)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {bottomAction.label}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Weight Trend Chart ─── */
function WeightTrendChart({
  points,
}: {
  points: WeightData['points'];
}) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  if (!points || points.length < 2) return null;

  const series = points.map(p => p.weight);
  const w = 500, h = 170;
  const padL = 14, padR = 44, padT = 36, padB = 24;
  const n = series.length - 1;
  const mn = Math.min(...series);
  const mx = Math.max(...series);
  const rng = mx - mn || 1;
  const lo = mn - rng * 0.15;
  const vr = mx + rng * 0.15 - lo || 1;

  const X = (i: number) => padL + i * ((w - padL - padR) / n);
  const Y = (v: number) => padT + (1 - (v - lo) / vr) * (h - padT - padB);

  let pathD = `M ${X(0)},${Y(series[0]!)}`;
  for (let i = 0; i < n; i++) {
    const p0x = X(i), p0y = Y(series[i]!);
    const p1x = X(i + 1), p1y = Y(series[i + 1]!);
    const cx = (p0x + p1x) / 2;
    pathD += ` C ${cx},${p0y} ${cx},${p1y} ${p1x},${p1y}`;
  }

  const areaD = `${pathD} L ${w - padR},${h - padB} L ${padL},${h - padB} Z`;

  const fmtD = (dStr: string) => {
    const d = new Date(dStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const ti = [0, Math.round(n / 2), n].filter((v, ix, a) => a.indexOf(v) === ix);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--km-acp)" />
            <stop offset="100%" stopColor="var(--km-acp)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#area-gradient)" stroke="none" />
        <path d={pathD} fill="none" stroke="var(--km-ac)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        
        {series.map((v, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <circle
              key={i} cx={X(i)} cy={Y(v)}
              r={isHovered ? 5 : (i === n ? 3.4 : 2.4)}
              fill="var(--km-ac)"
              stroke={i === n || isHovered ? '#fff' : undefined}
              strokeWidth={i === n || isHovered ? 1.5 : undefined}
              style={{ transition: 'all 0.2s ease' }}
            />
          );
        })}

        {hoveredIndex !== null && (
          <line
            x1={X(hoveredIndex)} y1={Y(series[hoveredIndex]!)}
            x2={X(hoveredIndex)} y2={h - padB}
            stroke="var(--km-ac)" strokeWidth={1} strokeDasharray="3 3"
            opacity={0.5}
            pointerEvents="none"
          />
        )}

        {ti.map((i) => (
          <text
            key={`date-${i}`} x={X(i)} y={h - 4} fontSize={10} fill="var(--km-tm)"
            textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}
          >
            {fmtD(points[i]!.date)}
          </text>
        ))}

        {points.map((_, i) => {
          const prevX = i === 0 ? padL : X(i) - (X(i) - X(i - 1)) / 2;
          const nextX = i === n ? w - padR : X(i) + (X(i + 1) - X(i)) / 2;
          return (
            <rect
              key={`hitbox-${i}`}
              x={prevX}
              y={padT - 20}
              width={nextX - prevX}
              height={h - padT + 20}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'crosshair' }}
            />
          );
        })}
      </svg>
      
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${((X(hoveredIndex) / w) * 100)}%`,
            top: `${((Y(series[hoveredIndex]!) / h) * 100)}%`,
            transform: 'translate(-50%, -115%)',
            pointerEvents: 'none',
            background: 'var(--km-s1, rgba(255, 255, 255, 0.9))',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--km-b)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 11,
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>
            {new Date(points[hoveredIndex]!.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ color: 'var(--km-t2)' }}>Weight: <b style={{ color: 'var(--km-t)' }}>{points[hoveredIndex]!.weight} lb</b></div>
          {points[hoveredIndex]!.height != null && (
            <div style={{ color: 'var(--km-t2)' }}>Height: <b style={{ color: 'var(--km-t)' }}>{points[hoveredIndex]!.height} in</b></div>
          )}
          {points[hoveredIndex]!.bmi != null && (
            <div style={{ color: 'var(--km-t2)' }}>BMI: <b style={{ color: 'var(--km-t)' }}>{points[hoveredIndex]!.bmi}</b></div>
          )}
        </div>
      )}
    </div>
  );
}

function BmiTrendChart({
  points,
  targetBmi,
}: {
  points: WeightData['points'];
  targetBmi: number | null;
}) {
  const bmiPoints = points.filter((point) => point.bmi != null);
  if (!bmiPoints.length) {
    return <div style={{ padding: '8px 4px', fontSize: 12, color: 'var(--km-tm)' }}>BMI history unavailable until a server-computed BMI is recorded.</div>;
  }
  const values = bmiPoints.map((point) => Number(point.bmi));
  const min = Math.min(...values, ...(targetBmi ? [targetBmi] : []));
  const max = Math.max(...values, ...(targetBmi ? [targetBmi] : []));
  const range = max - min || 1;
  const low = min - range * 0.15;
  const high = max + range * 0.15;
  const width = 500;
  const height = 130;
  const left = 14;
  const right = 44;
  const top = 24;
  const bottom = 22;
  const n = Math.max(bmiPoints.length - 1, 1);
  const x = (i: number) => left + i * ((width - left - right) / n);
  const y = (value: number) => top + (1 - (value - low) / (high - low)) * (height - top - bottom);
  const polyline = bmiPoints.map((point, i) => `${x(i)},${y(Number(point.bmi))}`).join(' ');
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-t2)', margin: '4px 0' }}>BMI history</div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', display: 'block' }}>
        {targetBmi != null && <line x1={left} y1={y(targetBmi)} x2={width - right} y2={y(targetBmi)} stroke="var(--km-gr)" strokeDasharray="5 4" />}
        <polyline points={polyline} fill="none" stroke="var(--km-ac)" strokeWidth={2} />
        {bmiPoints.map((point, i) => <circle key={point.date + i} cx={x(i)} cy={y(Number(point.bmi))} r={3} fill="var(--km-ac)" />)}
      </svg>
    </div>
  );
}
