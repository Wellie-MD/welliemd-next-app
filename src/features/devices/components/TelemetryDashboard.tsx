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
        <WeightTrendChart
          series={weight.series}
          {...(weight.points.length === weight.series.length
            ? { dates: weight.points.map((p) => p.date) }
            : {})}
        />
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
  series,
  dates,
}: {
  series: number[];
  dates?: string[];
}) {
  if (!series || series.length < 2) return null;

  const w = 500, h = 170;
  const padL = 14, padR = 44, padT = 36, padB = 24;
  const n = series.length - 1;
  const vals = series;
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
  const labelSet = new Set<number>([0, n]);
  let minI = 0, maxI = 0;
  series.forEach((v, i) => {
    if (v < series[minI]!) minI = i;
    if (v > series[maxI]!) maxI = i;
  });
  labelSet.add(minI);
  labelSet.add(maxI);

  const labeledPoints = Array.from(labelSet).map((i) => {
    const v = series[i]!;
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
        const d = dates?.[i] ? new Date(dates[i]) : new Date(today);
        if (!dates?.[i]) d.setDate(d.getDate() - (n - i) * 7);
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
