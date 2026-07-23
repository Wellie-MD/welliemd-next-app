import React, { useState } from 'react';
import type { WeightData, TrendData, MetricItem, DeviceMetrics } from '../types';
import { HEALTH_SECTIONS, HEALTH, TRENDS } from '../constants';

/* ─── Simple SVG Sparkline Trend Chart ─── */

function TrendChart({
  series,
  dec = 0,
  color = 'var(--km-ac)',
  w = 500,
  h = 160,
  unit = '',
}: {
  series: { date: string; val: number }[];
  dec?: number;
  color?: string;
  w?: number;
  h?: number;
  unit?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!series || series.length < 2) return null;

  const padL = 14,
    padR = 40,
    padT = 36,
    padB = 30;
  
  const n = series.length - 1;
  const vals = series.map(s => s.val);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const lo = mn - rng * 0.15;
  const vr = mx + rng * 0.15 - lo || 1;

  // Map dates to timestamps for proportional X axis spacing
  const times = series.map(s => new Date(s.date).getTime());
  const mnTime = times[0]!;
  const mxTime = times[n]!;
  const timeRng = mxTime - mnTime || 1;

  const X = (i: number) => padL + ((times[i]! - mnTime) / timeRng) * (w - padL - padR);
  const Y = (v: number) => padT + (1 - (v - lo) / vr) * (h - padT - padB);

  let pathD = `M ${X(0)},${Y(vals[0]!)}`;
  for (let i = 0; i < n; i++) {
    const p0x = X(i), p0y = Y(vals[i]!);
    const p1x = X(i + 1), p1y = Y(vals[i + 1]!);
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
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', touchAction: 'none' }}
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const scaleX = w / rect.width;
          const x = (e.clientX - rect.left) * scaleX;
          if (x < padL - 10 || x > w - padR + 10) {
            setHoveredIndex(null);
            return;
          }
          // Find the closest point by X coordinate
          let closestIdx = 0;
          let minDist = Infinity;
          for (let i = 0; i <= n; i++) {
            const dist = Math.abs(X(i) - x);
            if (dist < minDist) {
              minDist = dist;
              closestIdx = i;
            }
          }
          setHoveredIndex(closestIdx);
        }}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id={`area-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path d={areaD} fill={`url(#area-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`} stroke="none" />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        
        {series.map((s, i) => {
          const isHovered = hoveredIndex === i;
          const isLast = i === n;
          const showDot = series.length < 30 || isHovered || isLast;
          if (!showDot) return null;
          return (
            <circle
              key={i} cx={X(i)} cy={Y(s.val)}
              r={isHovered ? 5 : (isLast ? 3.4 : 2.4)}
              fill={color}
              stroke={isLast || isHovered ? '#fff' : undefined}
              strokeWidth={isLast || isHovered ? 1.5 : undefined}
              style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
            />
          );
        })}

        {hoveredIndex !== null && (
          <line
            x1={X(hoveredIndex)} y1={Y(vals[hoveredIndex]!)}
            x2={X(hoveredIndex)} y2={h - padB}
            stroke={color} strokeWidth={1} strokeDasharray="3 3"
            opacity={0.5}
            pointerEvents="none"
          />
        )}

        {ti.map((i) => (
          <text
            key={`date-${i}`} x={X(i)} y={h - 4} fontSize={10} fill="var(--km-tm)"
            textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}
          >
            {fmtD(series[i]!.date)}
          </text>
        ))}
      </svg>
      
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${((X(hoveredIndex) / w) * 100)}%`,
            top: `${((Y(vals[hoveredIndex]!) / h) * 100)}%`,
            transform: 'translate(-50%, -115%)',
            background: 'var(--km-s)',
            color: 'var(--km-t)',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: '1px solid var(--km-b)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {dec ? vals[hoveredIndex]!.toFixed(dec) : Math.round(vals[hoveredIndex]!).toLocaleString()}
          {unit ? ` ${unit}` : ''}
          <div style={{ fontSize: 9, color: 'var(--km-tm)', fontWeight: 500, marginTop: 1 }}>
            {fmtD(series[hoveredIndex]!.date)}
          </div>
        </div>
      )}
    </div>
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
  overrideTrend?: TrendData | undefined;
  overrideMetrics?: MetricItem[] | undefined;
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
    const seriesArr = trend.series;
    const seriesLen = seriesArr.length;
    const last = seriesArr[seriesLen - 1]!.val;
    const first = seriesArr[0]!.val;
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
        dec={trend.dec}
        step={trend.step ?? 'day'}
        unit={trend.unit}
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
  timeRange?: number;
}

export default function HealthTabs({ weightData, deviceMetrics, timeRange = 30 }: HealthTabsProps) {
  const [activeTab, setActiveTab] = useState('sleep');

  const dynamicMetrics = {
    sleep: [] as MetricItem[],
    activity: [] as MetricItem[],
    heart: [] as MetricItem[],
    workouts: [] as MetricItem[],
    glucose: [] as MetricItem[],
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
      dynamicMetrics.activity.push({ l: 'Active days', v: deviceMetrics.activeDays, u: `of ${timeRange}` });
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
              overrideMetrics={dynamicMetrics[sec.id as keyof typeof dynamicMetrics] ?? []}
            />
          </div>
        );
      })}
    </div>
  );
}
