import { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosInstance';
import adminApi from '../api/adminApi';
import { patientService } from '../services/patientService';
import { format } from 'date-fns';
import { WEARABLE_ENDPOINTS } from '../constants/apiEndpoints';

export interface Patient {
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

export interface WearableConnection {
  patient_id: string;
  provider?: string;
  status?: string;
  last_sync_at?: string | null;
}

export interface PatientTelemetry {
  weightSeries?: number[];
  readiness?: number;
  recovery?: number;
  sleepScore?: number;
}

export interface WearableRow {
  idx: number;
  p: Patient;
  d: PatientTelemetry;
  onTx: boolean;
  connected: boolean;
  provider: string | null;
  lastSync: string | null;
  cur: number | null;
  chg: number | null;
  needs: boolean;
}

export interface InsightsData {
  poolLength: number;
  avgReadiness: number;
  avgRecovery: number;
  avgSleep: number;
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  attn: WearableRow[];
}

export const PROV_CP: Record<string, { name: string; kind: string; gives: string; ic: string }> = {
  withings: { name: 'Withings', kind: 'Smart scale', gives: 'Weight & body composition', ic: '⚖️' },
  oura: { name: 'Oura', kind: 'Smart ring', gives: 'Sleep, HRV & readiness', ic: '💍' },
  fitbit: { name: 'Fitbit', kind: 'Wearable', gives: 'Activity, heart rate & sleep', ic: '⌚' },
  garmin: { name: 'Garmin', kind: 'Wearable', gives: 'Activity, heart rate & workouts', ic: '⌚' },
};

export function pdScoreColor(value: number) {
  return value >= 75 ? 'var(--km-gr)' : value >= 55 ? 'var(--km-am)' : 'var(--km-re)';
}

export function pdScoreLabel(value: number) {
  return value >= 85 ? 'Optimal' : value >= 75 ? 'Good' : value >= 55 ? 'Fair' : 'Low';
}

export function givesReadiness(provider: string) {
  return Boolean(provider && PROV_CP[provider]?.kind !== 'Smart scale');
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface UseWearablesDataParams {
  page: number;
  pageSize: number;
  search: string;
  loadInsights?: boolean;
}

export function useWearablesData(params: UseWearablesDataParams) {
  const { page, pageSize, search, loadInsights = false } = params;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<Record<string, PatientTelemetry>>({});
  const [totalCount, setTotalCount] = useState(0);

  // Global data states for Stats and Insights calculations (unaffected by paging/search)
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allTelemetry, setAllTelemetry] = useState<Record<string, PatientTelemetry>>({});
  const [insightsLoading, setInsightsLoading] = useState(false);

  // 1. Fetch global roster and connections once on mount to calculate stats
  useEffect(() => {
    let active = true;
    async function loadGlobalStats() {
      try {
        const clientRes = await adminApi.get(WEARABLE_ENDPOINTS.currentClient);
        const currentClientId = clientRes.data?.id as string | undefined;
        if (active) setClientId(currentClientId || null);

        // Fetch all patients for stats (lightweight - no product/visit details)
        const patientData = await patientService.getPatients({ page: 1, page_size: 1000 });
        const results = patientData.results || [];

        const transformedAll: Patient[] = results.map((patient) => {
          const orderDate = patient.last_order_at ? format(new Date(patient.last_order_at), 'dd/MM/yyyy') : '-';
          const orderRef = patient.last_order_id ? `#${patient.last_order_id}` : (patient.last_order_display_id ? `#${patient.last_order_display_id}` : '');
          const last = orderRef && orderDate !== '-' ? `${orderRef} • ${orderDate}` : orderDate !== '-' ? orderDate : orderRef || '-';
          const engagement = (patient.engagement_status || '').trim().toLowerCase();
          const status = engagement === 'active' ? 'Active' : 'Inactive';
          return {
            name: patient.full_name || `${patient.first_name} ${patient.last_name}`.trim() || patient.email,
            start: format(new Date(patient.created_at), 'dd/MM/yyyy'),
            mrn: patient.id,
            product: '-',
            email: patient.email,
            phone: patient.phone || '-',
            orders: patient.orders_count ?? 0,
            location: patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.state || '-',
            status,
            visit: '-',
            last,
          };
        });

        let fetchedConnections: WearableConnection[] = [];
        try {
          const response = await api.get(WEARABLE_ENDPOINTS.connections, {
            params: currentClientId ? { client_id: currentClientId } : {},
          });
          fetchedConnections = (response.data?.connections || []) as WearableConnection[];
        } catch {
          // ignore error
        }

        if (active) {
          setAllPatients(transformedAll);
          setConnections(fetchedConnections);
        }
      } catch (caught) {
        console.error('Failed to load global wearables data:', caught);
      }
    }
    loadGlobalStats();
    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch global telemetry lazily when loadInsights is triggered
  useEffect(() => {
    if (!loadInsights || allPatients.length === 0 || connections.length === 0) return;

    let active = true;
    async function loadGlobalTelemetry() {
      try {
        setInsightsLoading(true);
        const connectedPatients = allPatients.filter((p) =>
          connections.some((c) => c.patient_id === p.mrn && c.status === 'connected')
        );
        const telemetryEntries = await Promise.all(
          connectedPatients.map(async (p) => {
            try {
              const response = await api.get<PatientTelemetry>(WEARABLE_ENDPOINTS.deviceData, {
                params: { patient_id: p.mrn, days: 7 },
              });
              return [p.mrn, response.data] as const;
            } catch {
              return [p.mrn, {}] as const;
            }
          })
        );
        if (active) setAllTelemetry(Object.fromEntries(telemetryEntries));
      } catch (caught) {
        console.error('Failed to load global telemetry:', caught);
      } finally {
        if (active) setInsightsLoading(false);
      }
    }
    loadGlobalTelemetry();
    return () => {
      active = false;
    };
  }, [loadInsights, allPatients, connections]);

  // 3. Fetch paginated patient page whenever page, pageSize, or search changes
  useEffect(() => {
    let active = true;
    async function loadPaginatedData() {
      try {
        setLoading(true);
        setError(null);

        const response = await patientService.getPatients({
          page,
          page_size: pageSize,
          search: search || undefined,
        });

        const results = response.results || [];
        if (active) setTotalCount(response.count);

        const patientIds = results.map((patient) => patient.id);
        let productMap: Record<string, string> = {};
        let visitMap: Record<string, string> = {};

        if (patientIds.length > 0) {
          const [products, visits] = await Promise.all([
            patientService.getProductNamesForPatients(patientIds),
            patientService.getLatestVisitsForPatients(patientIds),
          ]);
          productMap = products;
          visitMap = visits;
        }

        const transformedPatients: Patient[] = results.map((patient) => {
          const orderDate = patient.last_order_at ? format(new Date(patient.last_order_at), 'dd/MM/yyyy') : '-';
          const orderRef = patient.last_order_id ? `#${patient.last_order_id}` : (patient.last_order_display_id ? `#${patient.last_order_display_id}` : '');
          const last = orderRef && orderDate !== '-' ? `${orderRef} • ${orderDate}` : orderDate !== '-' ? orderDate : orderRef || '-';
          const engagement = (patient.engagement_status || '').trim().toLowerCase();
          const status = engagement === 'active' ? 'Active' : 'Inactive';
          return {
            name: patient.full_name || `${patient.first_name} ${patient.last_name}`.trim() || patient.email,
            start: format(new Date(patient.created_at), 'dd/MM/yyyy'),
            mrn: patient.id,
            product: productMap[patient.id] || '-',
            email: patient.email,
            phone: patient.phone || '-',
            orders: patient.orders_count ?? 0,
            location: patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.state || '-',
            status,
            visit: visitMap[patient.id] || '-',
            last,
          };
        });

        if (active) {
          setPatients(transformedPatients);

          // Fetch telemetry ONLY for the connected patients on this active page
          const activePageConnected = transformedPatients.filter((p) =>
            connections.some((c) => c.patient_id === p.mrn && c.status === 'connected')
          );
          const telemetryEntries = await Promise.all(
            activePageConnected.map(async (p) => {
              try {
                const res = await api.get<PatientTelemetry>(WEARABLE_ENDPOINTS.deviceData, {
                  params: { patient_id: p.mrn, days: 7 },
                });
                return [p.mrn, res.data] as const;
              } catch {
                return [p.mrn, {}] as const;
              }
            })
          );
          if (active) {
            setTelemetry((prev) => ({
              ...prev,
              ...Object.fromEntries(telemetryEntries),
            }));
          }
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Failed to load page data.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPaginatedData();
    return () => {
      active = false;
    };
  }, [page, pageSize, search, connections]);

  // Compute page rows
  const allComputed = useMemo<WearableRow[]>(() => patients.map((patient, idx) => {
    const patientConnections = connections.filter(
      (connection) => connection.patient_id === patient.mrn && (connection.status === 'connected' || connection.status === 'authorized'),
    );
    const connected = patientConnections.length > 0;
    const primary = patientConnections[0];
    const provider = primary?.provider || null;
    const data = telemetry[patient.mrn] || {};
    const series = data.weightSeries || [];
    const cur = series.length ? series[series.length - 1] : null;
    const start = series.length ? series[0] : null;
    const chg = cur != null && start != null ? Number((cur - start).toFixed(1)) : null;
    const onTx = patient.status === 'Active' || patient.orders > 0;
    return { idx, p: patient, d: data, onTx, connected, provider, lastSync: primary?.last_sync_at ? relativeTime(primary.last_sync_at) : null, cur, chg, needs: onTx && !connected };
  }), [patients, connections, telemetry]);

  // Compute global computed rows for stats and insights
  const globalComputed = useMemo<WearableRow[]>(() => allPatients.map((patient, idx) => {
    const patientConnections = connections.filter(
      (connection) => connection.patient_id === patient.mrn && (connection.status === 'connected' || connection.status === 'authorized'),
    );
    const connected = patientConnections.length > 0;
    const primary = patientConnections[0];
    const provider = primary?.provider || null;
    const data = allTelemetry[patient.mrn] || {};
    const series = data.weightSeries || [];
    const cur = series.length ? series[series.length - 1] : null;
    const start = series.length ? series[0] : null;
    const chg = cur != null && start != null ? Number((cur - start).toFixed(1)) : null;
    const onTx = patient.status === 'Active' || patient.orders > 0;
    return { idx, p: patient, d: data, onTx, connected, provider, lastSync: primary?.last_sync_at ? relativeTime(primary.last_sync_at) : null, cur, chg, needs: onTx && !connected };
  }), [allPatients, connections, allTelemetry]);

  const stats = useMemo(() => {
    const onTx = globalComputed.filter((row) => row.onTx).length;
    const connected = globalComputed.filter((row) => row.connected).length;
    const needs = globalComputed.filter((row) => row.needs).length;
    return { connected, onTx, needs, cov: onTx ? Math.round(100 * globalComputed.filter((row) => row.onTx && row.connected).length / onTx) : 0 };
  }, [globalComputed]);

  const insightsData = useMemo<InsightsData>(() => {
    const pool = globalComputed.filter((row) => row.connected && givesReadiness(row.provider || '') && typeof row.d.readiness === 'number');
    const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const readiness = pool.map((row) => row.d.readiness as number);
    const recovery = pool.map((row) => row.d.recovery).filter((value): value is number => typeof value === 'number');
    const sleep = pool.map((row) => row.d.sleepScore).filter((value): value is number => typeof value === 'number');
    return {
      poolLength: pool.length,
      avgReadiness: average(readiness),
      avgRecovery: average(recovery),
      avgSleep: average(sleep),
      b1: pool.filter((row) => (row.d.readiness as number) >= 85).length,
      b2: pool.filter((row) => (row.d.readiness as number) >= 75 && (row.d.readiness as number) < 85).length,
      b3: pool.filter((row) => (row.d.readiness as number) >= 55 && (row.d.readiness as number) < 75).length,
      b4: pool.filter((row) => (row.d.readiness as number) < 55).length,
      attn: pool.filter((row) => (row.d.readiness as number) < 55).sort((a, b) => (a.d.readiness as number) - (b.d.readiness as number)),
    };
  }, [globalComputed]);

  return { clientId, patients, connections, loading, error, allComputed, stats, insightsData, totalCount, insightsLoading };
}
