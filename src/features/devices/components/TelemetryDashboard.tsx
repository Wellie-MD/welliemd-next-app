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
  const chg = Math.abs(+(cur - weight.start).toFixed(1));
  const pct = weight.start ? Math.abs(((cur - weight.start) / weight.start) * 100) : 0;
  const bmi = (703 * cur) / (weight.heightIn * weight.heightIn);
  const bmiCat =
    bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obesity';

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
          Last {weight.series.length} weeks
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
          {cur} <span style={{ fontSize: 14, color: 'var(--km-tm)' }}>lb</span>
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--km-gr)' }}>
          ▼ {chg} lb · {pct.toFixed(1)}%
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--km-tm)' }}>
          BMI <b style={{ color: 'var(--km-t)' }}>{bmi.toFixed(1)}</b> · {bmiCat}
        </span>
      </div>

      {onOpenGoalModal && (
        <div style={{ padding: '2px 18px 2px', fontSize: 12, color: 'var(--km-t2)' }}>
          {weight.goal && weight.goal > 0 ? (
            <>
              Goal <b style={{ color: 'var(--km-t)' }}>{weight.goal} lb</b> ·{' '}
              {cur > weight.goal
                ? `${Math.abs(+(cur - weight.goal).toFixed(1))} lb to go`
                : 'reached 🎉'}{' '}
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
              + Set a goal weight
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
        <WeightTrendChart series={weight.series} goal={weight.goal} />
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
function WeightTrendChart({ series, goal }: { series: number[]; goal: number | null }) {
  if (!series || series.length < 2) return null;

  const w = 500, h = 170;
  const padL = 14, padR = 44, padT = 36, padB = 24;
  const n = series.length - 1;
  const hasGoal = typeof goal === 'number' && goal > 0;
  const vals = hasGoal ? series.concat([goal as number]) : series;
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const lo = mn - rng * 0.15;
  const vr = mx + rng * 0.15 - lo || 1;

  const X = (i: number) => padL + i * ((w - padL - padR) / n);
  const Y = (v: number) => padT + (1 - (v - lo) / vr) * (h - padT - padB);

  const pts = series.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `${padL},${h - padB} ${pts} ${w - padR},${h - padB}`;

  const today = new Date();
  const fmtD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const ti = [0, Math.round(n / 2), n].filter((v, ix, a) => a.indexOf(v) === ix);

  // Smart label positioning — always above the point
  const LABEL_OFFSET = 20;

  const labelSet = new Set<number>([0, n]);
  let minI = 0, maxI = 0;
  series.forEach((v, i) => {
    if (v < series[minI]) minI = i;
    if (v > series[maxI]) maxI = i;
  });
  labelSet.add(minI);
  labelSet.add(maxI);

  const labeledPoints = Array.from(labelSet).map((i) => {
    const v = series[i];
    const cy = Y(v);
    const ty = Math.max(12, cy - 20);
    const anchor = i === 0 ? 'start' : i === n ? 'end' : 'middle';
    return { i, v, ty, anchor };
  });
  const sorted = [...labeledPoints].sort((a, b) => X(a.i) - X(b.i));
  const visible: typeof sorted = [];
  sorted.forEach((pt) => {
    const last = visible[visible.length - 1];
    if (!last || Math.abs(X(pt.i) - X(last.i)) > 32) visible.push(pt);
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      preserveAspectRatio="none"
    >
      <polyline points={area} fill="var(--km-acp)" stroke="none" />
      {hasGoal && (
        <>
          <line
            x1={padL} y1={Y(goal!)} x2={w - padR} y2={Y(goal!)}
            stroke="var(--km-gr)" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.7}
          />
          <text x={w - padR + 4} y={Y(goal!) + 4} fontSize={10} fill="var(--km-gr)" fontWeight={600} textAnchor="start">
            Goal
          </text>
        </>
      )}
      <polyline
        points={pts} fill="none" stroke="var(--km-ac)"
        strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
      />
      {series.map((v, i) => (
        <circle
          key={i} cx={X(i)} cy={Y(v)}
          r={i === n ? 3.4 : 2.4}
          fill="var(--km-ac)"
          stroke={i === n ? '#fff' : undefined}
          strokeWidth={i === n ? 1.3 : undefined}
        />
      ))}
      {visible.map(({ i, v, ty, anchor }) => (
        <text
          key={`lbl-${i}`} x={X(i)} y={ty}
          fontSize={9.5} fill="var(--km-t2)" fontWeight={700}
          textAnchor={anchor as any}
        >
          {v.toFixed(1)}
        </text>
      ))}      {ti.map((i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (n - i) * 7);
        return (
          <text
            key={`date-${i}`} x={X(i)} y={h - 4} fontSize={10} fill="var(--km-tm)"
            textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}
          >
            {fmtD(d)}
          </text>
        );
      })}
    </svg>
  );
}
