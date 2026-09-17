import React from 'react';
import {
  PROV_CP,
  type InsightsData,
  pdScoreColor,
  type WearableRow,
} from './useWearablesData';

interface WearablesInsightsProps {
  data: InsightsData;
  connectedCount: number;
  onPatientClick: (patientId: string) => void;
}

function Distribution({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = total ? Math.round(100 * count / total) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 9 }}>
      <div style={{ width: 110, fontSize: 12.5, color: 'var(--km-t)' }}>{label}</div>
      <div style={{ flex: 1, height: 11, background: 'var(--km-s2)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: 6 }} />
      </div>
      <div style={{ width: 62, textAlign: 'right', fontSize: 12, color: 'var(--km-tm)' }}>{count} • {percent}%</div>
    </div>
  );
}

function AttentionRow({ row, onPatientClick }: { row: WearableRow; onPatientClick: (id: string) => void }) {
  const provider = row.provider ? PROV_CP[row.provider] : null;
  return (
    <tr style={{ borderBottom: '1px solid var(--km-b)', cursor: 'pointer' }} onClick={() => onPatientClick(row.p.mrn)}>
      <td style={{ padding: '12px', fontSize: 13, fontWeight: 700 }}>{row.p.name}</td>
      <td style={{ padding: '12px', fontSize: 12.5, color: 'var(--km-tm)' }}>{row.p.product !== '-' ? row.p.product : '—'}</td>
      <td style={{ padding: '12px', fontSize: 12.5 }}>{provider ? `${provider.ic} ${provider.name}` : '—'}</td>
      <td style={{ padding: '12px', textAlign: 'right', color: pdScoreColor(row.d.readiness as number), fontWeight: 700 }}>{row.d.readiness}</td>
      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--km-re)', fontWeight: 700 }}>Low readiness</td>
      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--km-ac)', fontWeight: 700 }}>View</td>
    </tr>
  );
}

export default function WearablesInsights({ data, connectedCount, onPatientClick }: WearablesInsightsProps) {
  const cards = [
    { label: 'Avg readiness', value: data.avgReadiness || '—', sub: `${data.poolLength} connected ring/watch units`, color: data.poolLength ? pdScoreColor(data.avgReadiness) : undefined },
    { label: 'Avg recovery', value: data.avgRecovery ? `${data.avgRecovery}%` : '—', sub: 'across cohort' },
    { label: 'Avg sleep score', value: data.avgSleep ? `${data.avgSleep}/100` : '—', sub: 'across cohort' },
    { label: 'With recent data', value: data.poolLength || '—', sub: 'server-reported telemetry' },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        {cards.map((card) => (
          <div key={card.label} className="km-stat" style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-r)', padding: '14px 16px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--km-tm)' }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color || 'var(--km-t)' }}>{card.value}</div>
            <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>{card.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-r)', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Readiness distribution <span style={{ fontWeight: 400, color: 'var(--km-tm)', fontSize: 12 }}>• via Junction Sense</span></div>
          {data.poolLength ? <>
            <Distribution label="Optimal" count={data.b1} total={data.poolLength} color="var(--km-gr)" />
            <Distribution label="Good" count={data.b2} total={data.poolLength} color="var(--km-ac)" />
            <Distribution label="Fair" count={data.b3} total={data.poolLength} color="var(--km-am)" />
            <Distribution label="Low" count={data.b4} total={data.poolLength} color="var(--km-re)" />
          </> : <div style={{ color: 'var(--km-tm)', fontSize: 12.5 }}>No patients with telemetry data yet.</div>}
        </div>
        <div style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-r)', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Data availability <span style={{ fontWeight: 400, color: 'var(--km-tm)', fontSize: 12 }}>• server-reported</span></div>
          {data.poolLength ? <>
            <Distribution label="Patients with data" count={data.poolLength} total={data.poolLength} color="var(--km-ac)" />
            <Distribution label="No telemetry" count={Math.max(0, connectedCount - data.poolLength)} total={connectedCount || 1} color="var(--km-tm)" />
          </> : <div style={{ color: 'var(--km-tm)', fontSize: 12.5 }}>No telemetry data reported yet.</div>}
        </div>
      </div>
      <div style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-r)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px 4px', fontWeight: 700, fontSize: 14 }}>Needs clinical attention</div>
        <div style={{ padding: '0 18px 8px', fontSize: 12, color: 'var(--km-tm)' }}>Connected patients with server-reported low readiness.</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--km-b)' }}>{['Name', 'Treatment', 'Device', 'Readiness', 'Status', ''].map((heading) => <th key={heading} style={{ textAlign: 'left', fontSize: 10, padding: '10px 12px', color: 'var(--km-tm)' }}>{heading}</th>)}</tr></thead>
            <tbody>{data.attn.length ? data.attn.map((row) => <AttentionRow key={row.p.mrn} row={row} onPatientClick={onPatientClick} />) : <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--km-tm)', padding: 22 }}>No patients currently require attention from the available telemetry.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
