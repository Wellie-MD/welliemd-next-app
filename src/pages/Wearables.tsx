import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Smartphone, Send, Download, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axiosInstance';
import adminApi from '../api/adminApi';
import { patientService, type Patient as ApiPatient } from '../services/patientService';
import { format } from 'date-fns';

interface Patient {
  name: string;
  start: string;
  mrn: string;
  product: string;
  email: string;
  phone: string;
  orders: number;
  location: string;
  status: string;
  visit: string;
  last: string;
}

const PROV_CP: Record<string, { name: string; kind: string; gives: string; ic: string }> = {
  withings: { name: 'Withings', kind: 'Smart scale', gives: 'Weight & body composition', ic: '⚖️' },
  oura: { name: 'Oura', kind: 'Smart ring', gives: 'Sleep, HRV & readiness', ic: '💍' },
  fitbit: { name: 'Fitbit', kind: 'Wearable', gives: 'Activity, heart rate & sleep', ic: '⌚' },
  garmin: { name: 'Garmin', kind: 'Wearable', gives: 'Activity, heart rate & workouts', ic: '⌚' }
};

function _pdHash(s: string) {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pdBmi(w: number, hin: number) {
  return (703 * w) / (hin * hin);
}

function pdBmiCat(b: number) {
  return b < 18.5 ? 'Underweight' : b < 25 ? 'Healthy' : b < 30 ? 'Overweight' : 'Obesity';
}

function pdScoreColor(v: number) {
  return v >= 75 ? 'var(--km-gr)' : v >= 55 ? 'var(--km-am)' : 'var(--km-re)';
}

function pdScoreLabel(v: number) {
  return v >= 85 ? 'Optimal' : v >= 75 ? 'Good' : v >= 55 ? 'Fair' : 'Low';
}

function _givesReadiness(provider: string) {
  return !!provider && (PROV_CP[provider] || {}).kind !== 'Smart scale';
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function pdDemoData(p: Patient, connected: boolean, provider: string | null, lastSync: string | null) {
  const h = _pdHash(p.mrn || p.name);
  const start = 180 + (h % 80);
  const wk = 0.9 + ((h >> 3) % 9) / 10;
  const series: number[] = [];
  for (let i = 0; i < 8; i++) series.push(+(start - wk * i).toFixed(1));
  const activeProvider = provider || ['withings', 'fitbit', 'oura', 'garmin'][h % 4];
  return {
    connected,
    connections: connected ? [{ provider: activeProvider, lastSync: lastSync || (1 + (h % 9)) + 'h ago' }] : [],
    weightSeries: series,
    start,
    heightIn: 62 + (h % 10),
    steps: (5200 + (h % 4000)).toLocaleString(),
    sleep: (6 + ((h >> 2) % 2)) + 'h ' + (5 * ((h >> 1) % 12)) + 'm',
    restingHr: 58 + (h % 20),
    activeDays: 2 + (h % 5),
    readiness: 55 + (h % 40),
    recovery: 50 + ((h >> 3) % 45),
    sleepScore: 60 + ((h >> 2) % 35),
    adherence: 4 + (h % 4),
    readinessSeries: Array.from({ length: 7 }, (_, i) =>
      Math.max(40, Math.min(96, 55 + (h % 40) + (((h >> i) % 9) - 4)))
    ).reverse()
  };
}

export default function Wearables() {
  const navigate = useNavigate();
  const [view, setView] = useState<'roster' | 'insights'>('roster');
  const [filter, setFilter] = useState<'all' | 'connected' | 'not' | 'attention'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Fetch client, patients and connections
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch client info to get client_id
        const clientRes = await adminApi.get('/clients/me/');
        const client_id = clientRes.data?.id;
        if (active) setClientId(client_id || null);

        // 2. Fetch patients
        const patientData = await patientService.getPatients({ page: 1, page_size: 500 });
        const results = patientData.results || [];

        // 3. Fetch patient product names and latest visits in parallel
        const patientIds = results.map(p => p.id);
        let productMap: Record<string, string> = {};
        let visitMap: Record<string, string> = {};

        if (patientIds.length > 0) {
          const [products, visits] = await Promise.all([
            patientService.getProductNamesForPatients(patientIds),
            patientService.getLatestVisitsForPatients(patientIds)
          ]);
          productMap = products;
          visitMap = visits;
        }

        // 4. Fetch wearables connections
        let fetchedConnections: any[] = [];
        try {
          const connRes = await api.get('/wearables/connections/', {
            params: client_id ? { client_id } : {}
          });
          fetchedConnections = connRes.data?.connections || [];
        } catch (connErr) {
          console.warn('Failed to fetch wearables connections, defaulting to empty list', connErr);
        }

        // 5. Transform patients data to match the UI's Patient type
        const transformedPatients: Patient[] = results.map(p => {
          const lastOrderDate = p.last_order_at ? format(new Date(p.last_order_at), 'dd/MM/yyyy') : '-';
          const lastOrderRef = p.last_order_id ? `#${p.last_order_id}` : (p.last_order_display_id ? `#${p.last_order_display_id}` : '');
          const lastOrderLabel = lastOrderRef && lastOrderDate !== '-' ? `${lastOrderRef} • ${lastOrderDate}` : (lastOrderDate !== '-' ? lastOrderDate : lastOrderRef || '-');

          const getPatientStatusLabel = (engagementStatus?: string) => {
            const normalized = (engagementStatus || "").trim().toLowerCase();
            if (normalized === "active") return "Active";
            if (normalized === "inactive") return "Inactive";
            if (normalized === "dropoff" || normalized === "drop_off" || normalized === "abandon") {
              return "Drop-off";
            }
            return "Inactive";
          };

          return {
            name: p.full_name || `${p.first_name} ${p.last_name}`.trim() || p.email,
            start: format(new Date(p.created_at), 'dd/MM/yyyy'),
            mrn: p.id,
            product: productMap[p.id] || '-',
            email: p.email,
            phone: p.phone || '-',
            orders: p.orders_count ?? 0,
            location: p.city && p.state ? `${p.city}, ${p.state}` : p.state || '-',
            status: getPatientStatusLabel(p.engagement_status),
            visit: visitMap[p.id] || '-',
            last: lastOrderLabel
          };
        });

        if (active) {
          setPatients(transformedPatients);
          setConnections(fetchedConnections);
        }
      } catch (err: any) {
        console.error('Error fetching wearables dashboard data:', err);
        if (active) {
          setError(err.message || 'Failed to load wearables dashboard data. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { active = false; };
  }, []);

  // Compute all row info
  const allComputed = useMemo(() => {
    return patients.map((p, idx) => {
      const patientConns = connections.filter(
        c => c.patient_id === p.mrn && (c.status === 'connected' || c.status === 'authorized')
      );
      const isConnected = patientConns.length > 0;
      const primaryConn = patientConns[0] || null;
      const provider = primaryConn ? primaryConn.provider : null;
      const lastSync = primaryConn && primaryConn.last_sync_at ? relativeTime(primaryConn.last_sync_at) : null;

      const d = pdDemoData(p, isConnected, provider, lastSync);
      const onTx = (p.status === 'Active' || p.orders > 0);
      const cur = d.weightSeries[d.weightSeries.length - 1];
      const chg = +(cur - d.start).toFixed(1);
      return {
        idx,
        p,
        d,
        onTx,
        connected: isConnected,
        provider,
        lastSync,
        cur,
        chg,
        needs: (onTx && !isConnected)
      };
    });
  }, [patients, connections]);

  const stats = useMemo(() => {
    const onTx = allComputed.filter(r => r.onTx).length;
    const connected = allComputed.filter(r => r.connected).length;
    const needs = allComputed.filter(r => r.needs).length;
    const cov = onTx ? Math.round(100 * allComputed.filter(r => r.onTx && r.connected).length / onTx) : 0;
    return { connected, onTx, cov, needs };
  }, [allComputed]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allComputed.filter(r => {
      if (filter === 'connected' && !r.connected) return false;
      if (filter === 'not' && r.connected) return false;
      if (filter === 'attention' && !r.needs) return false;
      if (q) {
        const provName = r.provider ? (PROV_CP[r.provider]?.name || r.provider) : '';
        const match = (r.p.name + ' ' + (r.p.email || '') + ' ' + provName)
          .toLowerCase()
          .includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allComputed, filter, searchQuery]);

  // Insights Calculations
  const insightsData = useMemo(() => {
    const pool = allComputed.filter(r => r.connected && _givesReadiness(r.provider || ''));
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((x, y) => x + y, 0) / arr.length) : 0;

    const rd = pool.map(r => r.d.readiness);
    const rc = pool.map(r => r.d.recovery);
    const sl = pool.map(r => r.d.sleepScore);
    const ad = pool.map(r => r.d.adherence);

    const b1 = pool.filter(r => r.d.readiness >= 85).length;
    const b2 = pool.filter(r => r.d.readiness >= 75 && r.d.readiness < 85).length;
    const b3 = pool.filter(r => r.d.readiness >= 55 && r.d.readiness < 75).length;
    const b4 = pool.filter(r => r.d.readiness < 55).length;

    const a1 = pool.filter(r => r.d.adherence >= 6).length;
    const a2 = pool.filter(r => r.d.adherence >= 4 && r.d.adherence < 6).length;
    const a3 = pool.filter(r => r.d.adherence < 4).length;

    const attn = pool
      .filter(r => r.d.readiness < 55 || r.d.adherence < 4)
      .sort((x, y) => x.d.readiness - y.d.readiness);

    return {
      poolLength: pool.length,
      avgReadiness: avg(rd),
      avgRecovery: avg(rc),
      avgSleep: avg(sl),
      avgAdherence: avg(ad),
      b1, b2, b3, b4,
      a1, a2, a3,
      attn
    };
  }, [allComputed]);

  const triggerToast = (msg: string) => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToastMsg(msg);
    const id = setTimeout(() => {
      setToastMsg(null);
    }, 2600);
    setToastTimeoutId(id);
  };

  return (
    <div className="p-6 space-y-6" style={{ position: 'relative' }}>
      {/* Toast Notification */}
      <div
        className={`pd-toast ${toastMsg ? 'show' : ''}`}
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: `translateX(-50%) translateY(${toastMsg ? '0' : '12px'})`,
          background: 'var(--km-s3)',
          border: '1px solid var(--km-b)',
          color: 'var(--km-t)',
          fontSize: 13,
          padding: '11px 18px',
          borderRadius: 10,
          opacity: toastMsg ? 1 : 0,
          pointerEvents: 'none',
          transition: 'all 0.25s ease',
          zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          fontWeight: 500
        }}
      >
        {toastMsg}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <h1
            className="text-2xl font-bold"
            style={{
              margin: 0
            }}
          >
            Wearables
          </h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 11,
              fontSize: 10,
              fontWeight: 700,
              background: 'var(--km-acp)',
              color: 'var(--km-ac)',
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              border: '1px solid var(--km-b)'
            }}
          >
            via Junction
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 11,
              fontSize: 10,
              fontWeight: 700,
              background: 'var(--km-s2)',
              color: 'var(--km-tm)',
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              border: '1px solid var(--km-b)'
            }}
          >
            Sandbox
          </span>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--km-tm)', margin: 0, lineHeight: 1.5 }}>
          Device connections across your patient roster. Patients authorize secure credentials on their mobile devices, sync heart rate, sleep metrics, resting biomarkers, and smart scales.
        </p>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          background: 'var(--km-s1)',
          border: '1px solid var(--km-b)',
          borderRadius: '12px',
          gap: 12,
          padding: 24
        }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--km-ac)' }} />
          <p style={{ fontSize: 14, color: 'var(--km-tm)', fontWeight: 500 }}>
            Syncing wearables data & patient roster...
          </p>
        </div>
      ) : error ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          background: 'var(--km-s1)',
          border: '1px solid var(--km-b)',
          borderRadius: '12px',
          gap: 16,
          padding: 24,
          textAlign: 'center'
        }}>
          <AlertCircle size={40} style={{ color: 'var(--km-re)' }} />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--km-t)', marginBottom: 6 }}>
              Failed to load wearables data
            </h3>
            <p style={{ fontSize: 14, color: 'var(--km-tm)', maxWidth: 460, margin: '0 auto', lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn"
            style={{
              borderRadius: 8,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              background: 'var(--km-ac)',
              color: 'var(--km-bg)',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Main Controls & Segmented Roster / Insights switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--km-s2)',
                borderRadius: 8,
                padding: 3,
                border: '1px solid var(--km-b)'
              }}
            >
              <div
                onClick={() => setView('roster')}
                style={{
                  fontSize: 11.5,
                  padding: '5px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: view === 'roster' ? 700 : 500,
                  background: view === 'roster' ? 'var(--km-s1)' : 'transparent',
                  color: view === 'roster' ? 'var(--km-t)' : 'var(--km-tm)',
                  transition: 'all 0.15s'
                }}
              >
                Roster
              </div>
              <div
                onClick={() => setView('insights')}
                style={{
                  fontSize: 11.5,
                  padding: '5px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: view === 'insights' ? 700 : 500,
                  background: view === 'insights' ? 'var(--km-s1)' : 'transparent',
                  color: view === 'insights' ? 'var(--km-t)' : 'var(--km-tm)',
                  transition: 'all 0.15s'
                }}
              >
                Insights
              </div>
            </div>
          </div>

          {view === 'roster' ? (
            <div>
              {/* Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  marginBottom: 16
                }}
              >
                {[
                  { label: 'Connected', val: stats.connected, sub: `of ${patients.length} patients` },
                  { label: 'On Treatment', val: stats.onTx, sub: 'active roster' },
                  { label: 'Coverage', val: `${stats.cov}%`, sub: 'on-treatment connected' },
                  { label: 'Needs Attention', val: stats.needs, sub: 'on treatment, no device' }
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="km-stat"
                    style={{
                      background: 'var(--km-s1)',
                      border: '1px solid var(--km-b)',
                      borderRadius: 'var(--km-r)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--km-tm)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2, color: 'var(--km-t)' }}>
                      {s.val}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--km-tm)', marginTop: 2 }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'connected', label: 'Connected' },
                  { id: 'not', label: 'Not connected' },
                  { id: 'attention', label: 'Needs attention' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id as any)}
                    style={{
                      fontSize: 12,
                      fontWeight: filter === t.id ? 700 : 500,
                      padding: '6px 12px',
                      borderRadius: 7,
                      border: '1px solid var(--km-b)',
                      background: filter === t.id ? 'var(--km-acp)' : 'var(--km-s1)',
                      color: filter === t.id ? 'var(--km-ac)' : 'var(--km-tm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Table Card */}
              <div
                style={{
                  background: 'var(--km-s1)',
                  border: '1px solid var(--km-b)',
                  borderRadius: 'var(--km-r)',
                  padding: 14,
                  overflow: 'hidden'
                }}
              >
                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--km-tm)' }} />
                    <input
                      style={{
                        width: '100%',
                        background: 'var(--km-s2)',
                        border: '1px solid var(--km-b)',
                        borderRadius: 8,
                        padding: '8px 12px 8px 34px',
                        fontSize: 12.5,
                        color: 'var(--km-t)',
                        outline: 'none'
                      }}
                      placeholder="Search by patient, email, or device..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => triggerToast('Telemetry nudge & connection invite pushed to patient device.')}
                    className="btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      borderRadius: 8,
                      padding: '8px 14px',
                      border: '1px solid var(--km-b)',
                      background: 'var(--km-s2)',
                      color: 'var(--km-t)',
                      cursor: 'pointer'
                    }}
                  >
                    <Send size={13} />
                    Nudge unconnected
                  </button>
                  <button
                    className="btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      borderRadius: 8,
                      padding: '8px 14px',
                      border: '1px solid var(--km-b)',
                      background: 'var(--km-s2)',
                      color: 'var(--km-t)',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={13} />
                    Export
                  </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--km-b)' }}>
                        {['Name', 'Treatment', 'Connection', 'Device(s)', 'Last Sync', 'Latest Weight', 'Readiness', ''].map((h, i) => (
                          <th
                            key={i}
                            style={{
                              textAlign: i === 6 ? 'right' : 'left',
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '.04em',
                              textTransform: 'uppercase',
                              color: 'var(--km-tm)',
                              padding: '10px 12px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', color: 'var(--km-tm)', padding: 26 }}>
                            No patients match.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((r, i) => {
                          const pr = r.provider ? PROV_CP[r.provider] : null;
                          const connClass = r.connected ? 'pill-green' : (r.needs ? 'pill-amber' : 'pill-gray');
                          const connLabel = r.connected ? 'Connected' : (r.needs ? 'No device' : 'Not connected');
                          const hasReadiness = r.connected && _givesReadiness(r.provider || '');
                          return (
                            <tr
                              key={i}
                              onClick={() => {
                                navigate(`/dashboard/patients/${r.p.mrn}`);
                              }}
                              style={{
                                borderBottom: '1px solid var(--km-b)',
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--km-s2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: 'var(--km-t)' }}>
                                {r.p.name}
                              </td>
                              <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--km-tm)' }}>
                                {r.p.product !== '-' ? r.p.product : '—'}
                              </td>
                              <td style={{ padding: '12px 12px' }}>
                                <span className={`pill ${connClass}`} style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                                  {connLabel}
                                </span>
                              </td>
                              <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--km-t)' }}>
                                {pr ? `${pr.ic} ${pr.name}` : <span style={{ color: 'var(--km-tm)' }}>—</span>}
                              </td>
                              <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--km-tm)' }}>
                                {r.lastSync ? r.lastSync : <span style={{ color: 'var(--km-tm)' }}>—</span>}
                              </td>
                              <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--km-t)' }}>
                                {r.connected ? (
                                  <>
                                    {r.cur} lb{' '}
                                    <span
                                      style={{
                                        color: r.chg <= 0 ? 'var(--km-gr)' : 'var(--km-am)',
                                        fontWeight: 700,
                                        fontSize: 11
                                      }}
                                    >
                                      {r.chg <= 0 ? '▼' : '▲'} {Math.abs(r.chg)}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--km-tm)' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 12px', textAlign: 'right', fontSize: 12.5 }}>
                                {hasReadiness ? (
                                  <>
                                    <span style={{ color: pdScoreColor(r.d.readiness), fontWeight: 700 }}>
                                      {r.d.readiness}
                                    </span>{' '}
                                    <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>
                                      {pdScoreLabel(r.d.readiness)}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--km-tm)' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                                <span
                                  style={{ color: 'var(--km-ac)', fontWeight: 700, cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/patients/${r.p.mrn}`);
                                  }}
                                >
                                  View Data
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Insights View */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  marginBottom: 16
                }}
              >
                {[
                  { label: 'Avg readiness', val: insightsData.avgReadiness || '—', sub: `${insightsData.poolLength} connected ring/watch units`, color: insightsData.poolLength ? pdScoreColor(insightsData.avgReadiness) : undefined },
                  { label: 'Avg recovery', val: insightsData.avgRecovery ? `${insightsData.avgRecovery}%` : '—', sub: 'across cohort' },
                  { label: 'Avg sleep score', val: insightsData.avgSleep ? `${insightsData.avgSleep}/100` : '—', sub: 'across cohort' },
                  { label: 'Avg adherence', val: insightsData.poolLength ? `${insightsData.avgAdherence} days synced` : '—', sub: 'synced weekly' }
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="km-stat"
                    style={{
                      background: 'var(--km-s1)',
                      border: '1px solid var(--km-b)',
                      borderRadius: 'var(--km-r)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--km-tm)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2, color: s.color || 'var(--km-t)' }}>
                      {s.val}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--km-tm)', marginTop: 2 }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Distribution Charts */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                  marginBottom: 16
                }}
              >
                {/* Readiness distribution */}
                <div style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-r)', padding: '18px 20px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--km-t)' }}>
                    Readiness distribution <span style={{ fontWeight: 400, color: 'var(--km-tm)', fontSize: 12 }}>• via Junction Sense</span>
                  </div>
                  {insightsData.poolLength === 0 ? (
                    <div style={{ fontSize: 12.5, color: 'var(--km-tm)' }}>No patients with telemetry data yet.</div>
                  ) : (
                    <div>
                      {[
                        { label: 'Optimal', count: insightsData.b1, color: 'var(--km-gr)' },
                        { label: 'Good', count: insightsData.b2, color: 'var(--km-ac)' },
                        { label: 'Fair', count: insightsData.b3, color: 'var(--km-am)' },
                        { label: 'Low', count: insightsData.b4, color: 'var(--km-re)' }
                      ].map((item, idx) => {
                        const pct = insightsData.poolLength ? Math.round(100 * item.count / insightsData.poolLength) : 0;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 9 }}>
                            <div style={{ width: 78, fontSize: 12.5, color: 'var(--km-t)' }}>{item.label}</div>
                            <div style={{ flex: 1, height: 11, background: 'var(--km-s2)', borderRadius: 6, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 6 }} />
                            </div>
                            <div style={{ width: 62, textAlign: 'right', fontSize: 12, color: 'var(--km-tm)' }}>
                              {item.count} • {pct}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sync adherence */}
                <div style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-r)', padding: '18px 20px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--km-t)' }}>
                    Sync adherence <span style={{ fontWeight: 400, color: 'var(--km-tm)', fontSize: 12 }}>• last 7 days</span>
                  </div>
                  {insightsData.poolLength === 0 ? (
                    <div style={{ fontSize: 12.5, color: 'var(--km-tm)' }}>No sync adherence history.</div>
                  ) : (
                    <div>
                      {[
                        { label: '6–7 days', count: insightsData.a1, color: 'var(--km-gr)' },
                        { label: '4–5 days', count: insightsData.a2, color: 'var(--km-am)' },
                        { label: 'Under 4', count: insightsData.a3, color: 'var(--km-re)' }
                      ].map((item, idx) => {
                        const pct = insightsData.poolLength ? Math.round(100 * item.count / insightsData.poolLength) : 0;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 9 }}>
                            <div style={{ width: 78, fontSize: 12.5, color: 'var(--km-t)' }}>{item.label}</div>
                            <div style={{ flex: 1, height: 11, background: 'var(--km-s2)', borderRadius: 6, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 6 }} />
                            </div>
                            <div style={{ width: 62, textAlign: 'right', fontSize: 12, color: 'var(--km-tm)' }}>
                              {item.count} • {pct}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Needs attention card */}
              <div style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-r)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px 4px', fontWeight: 700, fontSize: 14, color: 'var(--km-t)' }}>
                  Needs clinical attention
                </div>
                <div style={{ padding: '0 18px 8px', fontSize: 12, color: 'var(--km-tm)' }}>
                  Connected patients with low readiness or low sync adherence.
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--km-b)' }}>
                        {['Name', 'Treatment', 'Device', 'Readiness', 'Adherence', ''].map((h, idx) => (
                          <th
                            key={idx}
                            style={{
                              textAlign: idx === 3 || idx === 4 ? 'right' : 'left',
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '.04em',
                              textTransform: 'uppercase',
                              color: 'var(--km-tm)',
                              padding: '10px 12px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {insightsData.attn.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--km-tm)', padding: 22 }}>
                            No patients currently require attention. Sync adherence looks healthy.
                          </td>
                        </tr>
                      ) : (
                        insightsData.attn.map((r, i) => {
                          const pr = r.provider ? PROV_CP[r.provider] : null;
                          return (
                            <tr
                              key={i}
                              onClick={() => {
                                navigate(`/dashboard/patients/${r.p.mrn}`);
                              }}
                              style={{
                                borderBottom: '1px solid var(--km-b)',
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--km-s2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: 'var(--km-t)' }}>
                                {r.p.name}
                              </td>
                              <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--km-tm)' }}>
                                {r.p.product !== '-' ? r.p.product : '—'}
                              </td>
                              <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--km-t)' }}>
                                {pr ? `${pr.ic} ${pr.name}` : <span style={{ color: 'var(--km-tm)' }}>—</span>}
                              </td>
                              <td style={{ padding: '12px 12px', textAlign: 'right', fontSize: 12.5, color: pdScoreColor(r.d.readiness), fontWeight: 700 }}>
                                {r.d.readiness}
                              </td>
                              <td
                                style={{
                                  padding: '12px 12px',
                                  textAlign: 'right',
                                  fontSize: 12.5,
                                  color: r.d.adherence < 4 ? 'var(--km-re)' : 'var(--km-t)',
                                  fontWeight: r.d.adherence < 4 ? 700 : 500
                                }}
                              >
                                {r.d.adherence}/7
                              </td>
                              <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                                <span
                                  style={{ color: 'var(--km-ac)', fontWeight: 700, cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/patients/${r.p.mrn}`);
                                  }}
                                >
                                  View
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


