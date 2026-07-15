import React, { useState } from 'react';
import type { WeightData, TrendData, MetricItem, DeviceMetrics } from '../types';
import { HEALTH_SECTIONS, HEALTH, TRENDS } from '../constants';

/* ─── Simple SVG Sparkline Trend Chart ─── */

function TrendChart({
  series,
  label,
  unit,
  dec = 0,
  step = 'day',
  color = 'var(--km-ac)',
  w = 500,
  h = 160,
}: {
  series: number[];
  label: string;
  unit: string;
  dec?: number;
  step?: string;
  color?: string;
  w?: number;
  h?: number;
}) {
  if (!series || series.length < 2) return null;

  const padL = 14,
    padR = 40,
    padT = 36,
    padB = 30;
  const n = series.length - 1;
  const mn = Math.min(...series);
  const mx = Math.max(...series);
  const rng = mx - mn || 1;
  const lo = mn - rng * 0.15;
  const vr = mx + rng * 0.15 - lo || 1;

  const X = (i: number) => padL + i * ((w - padL - padR) / n);
  const Y = (v: number) => padT + (1 - (v - lo) / vr) * (h - padT - padB);

  const pts = series.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `${padL},${h - padB} ${pts} ${w - padR},${h - padB}`;

  const fmtD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const today = new Date();
  const stepDays = step === 'week' ? 7 : 1;
  const ti = [0, Math.round(n / 2), n].filter((v, ix, a) => a.indexOf(v) === ix);

  const LABEL_OFFSET = 20; // px from point center to text baseline

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
      <polyline points={area} fill={color} opacity={0.1} stroke="none" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {series.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r={i === n ? 3.4 : 2} fill={color}
          stroke={i === n ? '#fff' : undefined} strokeWidth={i === n ? 1.3 : undefined}
        />
      ))}
      {visible.map(({ i, v, ty, anchor }) => (
        <text
          key={`lbl-${i}`}
          x={X(i)}
          y={ty}
          fontSize={9.5}
          fontWeight={700}
          fill="var(--km-t2)"
          textAnchor={anchor as any}
        >
          {dec ? v.toFixed(dec) : Math.round(v).toLocaleString()}
        </text>
      ))}
      {ti.map((i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (n - i) * stepDays);
        return (
          <text
            key={`date-${i}`}
            x={X(i)}
            y={h - 4}
            fontSize={10}
            fill="var(--km-tm)"
            textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}
          >
            {fmtD(d)}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Data Section Card ─── */

function DataSection({
  title,
  subtitle,
  sectionId,
  overrideTrend,
  overrideMetrics,
}: {
  title: string;
  subtitle: string;
  sectionId: string;
  overrideTrend?: TrendData;
  overrideMetrics?: MetricItem[];
}) {
  const metrics = overrideMetrics ?? HEALTH[sectionId] ?? [];
  const trend = overrideTrend ?? TRENDS[sectionId];

  // Pair metrics into rows of 2
  const rows: typeof metrics[] = [];
  for (let i = 0; i < metrics.length; i += 2) {
    rows.push(metrics.slice(i, i + 2));
  }

  const metricRows = rows.map((row, ri) => (
    <div
      key={ri}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--km-b)',
      }}
    >
      {row.map((m, ci) => (
        <div
          key={ci}
          style={{
            padding: '10px 16px',
            borderRight: ci === 0 && row.length > 1 ? '1px solid var(--km-b)' : 'none',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: 'var(--km-tm)',
              marginBottom: 3,
            }}
          >
            {m.l}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {m.v}
            {m.u ? (
              <span style={{ fontSize: 10.5, color: 'var(--km-tm)', fontWeight: 400, marginLeft: 2 }}>
                {m.u}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  ));

  let trendSection: React.ReactNode = null;
  if (trend && trend.series && trend.series.length > 0) {
    const seriesArr: number[] = trend.series;
    const seriesLen = seriesArr.length;
    const last = seriesArr[seriesLen - 1] as number;
    const first = seriesArr[0] as number;
    const delta = Number((last - first).toFixed(trend.dec || 0));
    const better = trend.lowerBetter ? delta < 0 : delta > 0;
    const col = delta === 0 ? 'var(--km-tm)' : better ? 'var(--km-gr)' : 'var(--km-am)';
    const arrow = delta === 0 ? '' : delta < 0 ? '▼' : '▲';
    const dAbs = trend.dec ? Math.abs(delta).toFixed(trend.dec) : Math.abs(delta).toLocaleString();

    trendSection = (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11.5, color: 'var(--km-tm)' }}>{trend.label}</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {trend.dec ? last.toFixed(trend.dec) : Math.round(last).toLocaleString()}
            {trend.unit ? (
              <span style={{ fontSize: 10.5, color: 'var(--km-tm)', fontWeight: 400 }}>
                {' '}
                {trend.unit}
              </span>
            ) : null}
          </span>
          {delta !== 0 ? (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: col }}>
              {arrow} {dAbs}
            </span>
          ) : null}
          <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--km-tm)' }}>
            last {seriesLen} {trend.step === 'week' ? 'weeks' : 'days'}
          </span>
      </div>
      <TrendChart
        series={seriesArr}
        label={trend.label}
        unit={trend.unit}
        dec={trend.dec}
        step={trend.step ?? 'day'}
        color="var(--km-ac)"
      />
    </div>
  );
}

if (metrics.length === 0 && !trendSection) {
  return (
    <div
      style={{
        background: 'var(--km-s1)',
        border: '1px solid var(--km-b)',
        borderRadius: 14,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px 0',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
        {subtitle ? (
          <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>{subtitle}</span>
        ) : null}
      </div>
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--km-tm)', fontSize: 13 }}>
        No recent data available.
      </div>
    </div>
  );
}

return (
    <div
      style={{
        background: 'var(--km-s1)',
        border: '1px solid var(--km-b)',
        borderRadius: 14,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header: title left, subtitle right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px 0',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
        {subtitle ? (
          <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>{subtitle}</span>
        ) : null}
      </div>

      {/* Trend chart area */}
      {trendSection && (
        <div style={{ padding: '10px 16px 4px' }}>{trendSection}</div>
      )}

      {/* Metric rows */}
      <div style={{ borderTop: '1px solid var(--km-b)', marginTop: trendSection ? 0 : 10 }}>
        {metricRows}
      </div>
    </div>
  );
}

/* ─── Health Tabs Component ─── */

interface HealthTabsProps {
  weightData: WeightData;
  deviceMetrics?: DeviceMetrics;
}

export default function HealthTabs({ weightData, deviceMetrics }: HealthTabsProps) {
  const [activeTab, setActiveTab] = useState('sleep');

  const dynamicMetrics: Record<string, MetricItem[]> = {
    sleep: [],
    activity: [],
    heart: [],
    workouts: [],
    glucose: [],
  };

  if (deviceMetrics) {
    if (deviceMetrics.sleep && deviceMetrics.sleep !== '0') {
      dynamicMetrics.sleep.push({ l: 'Time asleep', v: deviceMetrics.sleep });
    }
    if (deviceMetrics.sleepScore > 0) {
      dynamicMetrics.sleep.push({ l: 'Sleep score', v: deviceMetrics.sleepScore, u: '/100' });
    }
    if (deviceMetrics.sleepDetail) {
      const { deep, rem, light, awake, efficiency, avgHr } = deviceMetrics.sleepDetail;
      if (deep) dynamicMetrics.sleep.push({ l: 'Deep sleep', v: deep, u: 'min' });
      if (rem) dynamicMetrics.sleep.push({ l: 'REM sleep', v: rem, u: 'min' });
      if (light) dynamicMetrics.sleep.push({ l: 'Light sleep', v: light, u: 'min' });
      if (awake) dynamicMetrics.sleep.push({ l: 'Awake', v: awake, u: 'min' });
      if (efficiency) dynamicMetrics.sleep.push({ l: 'Efficiency', v: efficiency, u: '%' });
      if (avgHr) dynamicMetrics.sleep.push({ l: 'Avg heart rate', v: avgHr, u: 'bpm' });
    }

    if (deviceMetrics.steps && deviceMetrics.steps !== '0') {
      dynamicMetrics.activity.push({ l: 'Steps', v: deviceMetrics.steps, u: '/day' });
    }
    if (deviceMetrics.activeDays && deviceMetrics.activeDays !== '0') {
      dynamicMetrics.activity.push({ l: 'Active days', v: deviceMetrics.activeDays, u: 'of 7' });
    }

    if (deviceMetrics.restingHr && deviceMetrics.restingHr !== '0') {
      dynamicMetrics.activity.push({ l: 'Resting HR', v: deviceMetrics.restingHr, u: 'bpm' });
      dynamicMetrics.heart.push({ l: 'Resting HR', v: deviceMetrics.restingHr, u: 'bpm' });
    }

    const workouts = deviceMetrics.recentWorkouts || [];
    if (workouts.length > 0) {
      dynamicMetrics.workouts.push({ l: 'Workouts', v: deviceMetrics.workoutsCount ?? workouts.length, u: 'this week' });
      const totalMin = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
      if (totalMin > 0) dynamicMetrics.workouts.push({ l: 'Total time', v: totalMin, u: 'min' });
      const totalCal = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
      if (totalCal > 0) dynamicMetrics.workouts.push({ l: 'Calories burned', v: Math.round(totalCal) });
      const hrReadings = workouts.map((w) => w.avgHr).filter((v): v is number => v != null);
      if (hrReadings.length > 0) {
        dynamicMetrics.workouts.push({ l: 'Avg heart rate', v: Math.round(hrReadings.reduce((a, b) => a + b, 0) / hrReadings.length), u: 'bpm' });
      }
      const sportCounts = workouts.reduce<Record<string, number>>((acc, w) => {
        acc[w.sport] = (acc[w.sport] || 0) + 1;
        return acc;
      }, {});
      const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0];
      if (topSport) dynamicMetrics.workouts.push({ l: 'Most frequent', v: `${topSport[0]} (${topSport[1]})` });
    }

    if (deviceMetrics.avgGlucose != null) {
      dynamicMetrics.glucose.push({ l: 'Average glucose', v: deviceMetrics.avgGlucose, u: 'mg/dL' });
    }
    if (deviceMetrics.latestGlucose != null) {
      dynamicMetrics.glucose.push({ l: 'Latest reading', v: deviceMetrics.latestGlucose, u: 'mg/dL' });
    }
  }

  // Override body trend with actual weight data
  const bodyTrend = TRENDS.body
    ? {
        ...TRENDS.body,
        series: weightData.series,
        step: 'week' as const,
      }
    : undefined;

  const sleepTrend: TrendData | undefined =
    deviceMetrics?.sleepSeries && deviceMetrics.sleepSeries.length > 1
      ? {
          label: 'Sleep duration',
          unit: 'hrs',
          dec: 1,
          lowerBetter: false,
          series: deviceMetrics.sleepSeries,
          step: 'day',
        }
      : undefined;

  const activityTrend: TrendData | undefined =
    deviceMetrics?.stepsSeries && deviceMetrics.stepsSeries.length > 1
      ? {
          label: 'Steps',
          unit: '',
          dec: 0,
          lowerBetter: false,
          series: deviceMetrics.stepsSeries,
          step: 'day',
        }
      : undefined;

  const glucoseTrend: TrendData | undefined =
    deviceMetrics?.glucoseSeries && deviceMetrics.glucoseSeries.length > 1
      ? {
          label: 'Glucose',
          unit: 'mg/dL',
          dec: 0,
          lowerBetter: false,
          series: deviceMetrics.glucoseSeries,
          step: 'day',
        }
      : undefined;

  return (
    <div>
      <div
        className="km-health-tabs"
        style={{
          display: 'flex',
          gap: 7,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 12,
        }}
      >
        {HEALTH_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveTab(sec.id)}
            style={{
              flex: '0 0 auto',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 999,
              border:
                activeTab === sec.id
                  ? '1px solid var(--km-am)'
                  : '1px solid var(--km-b)',
              background: activeTab === sec.id ? 'var(--km-am)' : 'var(--km-s1)',
              color: activeTab === sec.id ? '#fff' : 'var(--km-tm)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {sec.title}
          </button>
        ))}
      </div>

      {HEALTH_SECTIONS.map((sec) => {
        const isVisible = activeTab === sec.id;
        const overrideTrend =
          sec.id === 'body' ? bodyTrend :
          sec.id === 'sleep' ? sleepTrend :
          sec.id === 'activity' ? activityTrend :
          sec.id === 'glucose' ? glucoseTrend :
          undefined;

        return (
          <div key={sec.id} style={{ display: isVisible ? 'block' : 'none' }}>
            <DataSection
              title={sec.heading ?? sec.title}
              subtitle={sec.subtitle}
              sectionId={sec.id}
              overrideTrend={overrideTrend}
              overrideMetrics={dynamicMetrics[sec.id]}
            />
          </div>
        );
      })}
    </div>
  );
}