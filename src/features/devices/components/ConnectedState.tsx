import React from 'react';
import { Shield, Trash2 } from 'lucide-react';
import HealthTabs from './HealthTabs';
import { PROVIDERS, SHARED_CATEGORIES } from '../constants';
import type { Connection, WeightData, DeviceMetrics, Consent } from '../types';

interface ConnectedStateProps {
  connections: Connection[];
  weight: WeightData;
  deviceMetrics: DeviceMetrics;
  consent: Consent;
  onDisconnect: (provider: string) => void;
  onReconnect: (provider: string) => void;
  onConnectAnother: () => void;
  onOpenGoalModal: () => void;
  onOpenLogWeight: () => void;
  onOpenConsent: () => void;
  onOpenDeleteData: () => void;
}

const CARD: React.CSSProperties = {
  background: 'var(--km-s1)',
  border: '1px solid var(--km-b)',
  borderRadius: 14,
  marginBottom: 10,
  overflow: 'hidden',
};

export default function ConnectedState({
  connections,
  weight,
  deviceMetrics,
  consent,
  onDisconnect,
  onReconnect,
  onConnectAnother,
  onOpenGoalModal,
  onOpenLogWeight,
  onOpenConsent,
  onOpenDeleteData,
}: ConnectedStateProps) {
  const cur = weight.series[weight.series.length - 1] ?? weight.start;
  const chg = Math.abs(+(cur - weight.start).toFixed(1));
  const bmi = (703 * cur) / (weight.heightIn * weight.heightIn);
  const bmiCat =
    bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obesity';

  return (
    <>
      {/* ─── Each device = its own card ─── */}
      {connections.map((c) => {
        const p = PROVIDERS.find((x) => x.id === c.provider) || {
          name: c.name || 'Device',
          gives: 'Health data',
          ic: '⌚',
          cat: undefined,
        };
        const broken = c.status === 'error';

        return (
          <div key={c.provider} style={CARD}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: broken ? 'var(--km-amp)' : 'var(--km-s2)',
                  border: `1px solid ${broken ? 'var(--km-am)' : 'var(--km-b)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {p.ic}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</span>
                  {broken ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'var(--km-amp)',
                        color: 'var(--km-am)',
                        fontWeight: 700,
                      }}
                    >
                      Needs attention
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'var(--km-grp)',
                        color: 'var(--km-gr)',
                        fontWeight: 700,
                      }}
                    >
                      Connected
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: broken ? 'var(--km-am)' : 'var(--km-tm)',
                    marginTop: 1,
                  }}
                >
                  {broken
                    ? reconnectReason(c.errorType)
                    : `${p.gives} · last synced ${c.lastSync || 'recently'}`}
                </div>
              </div>

              {broken ? (
                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  <button
                    style={{
                      fontSize: 12,
                      padding: '7px 14px',
                      background: 'var(--km-am)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onReconnect(c.provider)}
                  >
                    Reconnect
                  </button>
                  <button
                    style={{
                      fontSize: 12,
                      padding: '7px 14px',
                      background: 'transparent',
                      color: 'var(--km-t)',
                      border: '1px solid var(--km-b)',
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onDisconnect(c.provider)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  style={{
                    fontSize: 12,
                    padding: '7px 14px',
                    flexShrink: 0,
                    background: 'transparent',
                    color: 'var(--km-t)',
                    border: '1px solid var(--km-b)',
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => onDisconnect(c.provider)}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* ─── Connect another device ─── */}
      <div style={{ padding: '4px 0 14px' }}>
        <span
          style={{ color: 'var(--km-ac)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          onClick={onConnectAnother}
        >
          + Connect another device
        </span>
      </div>

      {/* ─── Today's readiness card ─── */}
      {connections.some(
        (c) =>
          c.status !== 'error' &&
          (PROVIDERS.find((p) => p.id === c.provider) || {}).cat === 'wear'
      ) && (
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
      )}

      {/* ─── Weight trend card ─── */}
      <div style={CARD}>
        <div style={{ padding: '14px 18px 4px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>Weight trend</span>
            <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>
              Last {weight.series.length} weeks
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 30,
                color: 'var(--km-t)',
              }}
            >
              {cur}
            </span>
            <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>lb</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--km-gr)' }}>
              ▼ {chg} lb
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--km-tm)' }}>
              BMI <b style={{ color: 'var(--km-t)' }}>{bmi.toFixed(1)}</b> · {bmiCat}
            </span>
          </div>

          <div style={{ fontSize: 12, color: 'var(--km-t2)', marginBottom: 4 }}>
            {weight.goal && weight.goal > 0 ? (
              <>
                Goal <b style={{ color: 'var(--km-t)' }}>{weight.goal} lb</b> ·{' '}
                {cur > weight.goal
                  ? `${Math.abs(+(cur - weight.goal).toFixed(1))} lb to go`
                  : 'reached 🎉'}{' '}
                <span
                  style={{ color: 'var(--km-ac)', cursor: 'pointer', marginLeft: 4 }}
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
        </div>

        <div style={{ padding: '0 14px' }}>
          <WeightTrendChart series={weight.series} goal={weight.goal} />
        </div>
      </div>

      {/* ─── Health Tabs ─── */}
      <HealthTabs weightData={weight} />

      {/* ─── Data sharing & privacy card ─── */}
      <div style={{ ...CARD, marginTop: 4 }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'var(--km-acp)',
                color: 'var(--km-ac)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Shield size={14} />
            </span>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>Data sharing & privacy</span>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--km-t2)', lineHeight: 1.6, marginBottom: 10 }}>
            You're sharing your connected health data with{' '}
            <b>your care team at Kin</b> to support your treatment, via Junction.{' '}
            {consent.date && (
              <>
                Consent on file since <b>{consent.date}</b>.{' '}
              </>
            )}
            Your data is never sold or used for advertising.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {SHARED_CATEGORIES.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: 11,
                  background: 'var(--km-s2)',
                  border: '1px solid var(--km-b)',
                  borderRadius: 999,
                  padding: '4px 10px',
                  color: 'var(--km-t2)',
                }}
              >
                {c}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              style={{
                fontSize: 12.5,
                padding: '8px 14px',
                background: 'transparent',
                color: 'var(--km-t)',
                border: '1px solid var(--km-b)',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={onOpenConsent}
            >
              Review what you share
            </button>
            <button
              style={{
                fontSize: 12.5,
                padding: '8px 14px',
                color: 'var(--km-re)',
                border: '1px solid var(--km-re)',
                background: 'transparent',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              onClick={onOpenDeleteData}
            >
              <Trash2 size={13} />
              Delete my health data
            </button>
          </div>
        </div>
      </div>
    </>
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

function reconnectReason(t?: string): string {
  const reasons: Record<string, string> = {
    token_expired: 'Sign-in expired — reconnect to keep syncing.',
    provider_credential_error: 'Sign-in was rejected — reconnect to resume.',
    provider_password_expired: 'Account password changed — reconnect to resume.',
    provider_api_error: 'The device service had a problem — try reconnecting.',
  };
  return reasons[t ?? ''] || 'Syncing stopped — reconnect to resume.';
}
