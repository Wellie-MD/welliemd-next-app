import type { VitalsEntry, WeightData } from '../types';

export function buildWeightData(entries: VitalsEntry[], prev: WeightData, priorityList: string[]): WeightData {
  const byDate = new Map<string, VitalsEntry>();

  for (const entry of entries) {
    if (entry.weight_lbs == null) continue;

    const dateKey = entry.measured_at.split('T')[0]!;
    const existing = byDate.get(dateKey);
    if (!existing) {
      byDate.set(dateKey, entry);
      continue;
    }

    const existingRank = priorityList.indexOf(existing.source);
    const newRank = priorityList.indexOf(entry.source);
    const eRank = existingRank === -1 ? 999 : existingRank;
    const nRank = newRank === -1 ? 999 : newRank;

    if (
      nRank < eRank
      || (nRank === eRank && new Date(entry.measured_at).getTime() > new Date(existing.measured_at).getTime())
    ) {
      byDate.set(dateKey, entry);
    }
  }

  const sorted = Array.from(byDate.values())
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  if (sorted.length === 0) return prev;

  const points = sorted.map((entry) => ({
    date: entry.measured_at,
    weight: Number(entry.weight_lbs),
    bmi: entry.bmi != null ? Number(entry.bmi) : null,
    height: entry.height_inches != null ? Number(entry.height_inches) : null,
  }));
  const series = points.map((point) => point.weight);
  const checkins = points.map((point) => ({
    label: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    w: point.weight,
  }));
  const latestHeight = [...sorted].reverse().find((entry) => entry.height_inches != null)?.height_inches;
  const latest = sorted[sorted.length - 1]!;

  return {
    ...prev,
    series,
    checkins,
    points,
    start: prev.start || series[0]!,
    heightIn: latestHeight ?? prev.heightIn,
    latestBmi: latest.bmi != null ? Number(latest.bmi) : null,
    latestBmiCategory: latest.bmi_category ?? null,
  };
}
