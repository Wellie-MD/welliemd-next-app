import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConnectState from './components/ConnectState';
import ConnectedState from './components/ConnectedState';
import TelemetryDashboard from './components/TelemetryDashboard';
import DataPrivacyCard from './components/DataPrivacyCard';
import {
  PROVIDERS,
  WEIGHT_DEFAULT,
  DEVICE_METRICS_DEFAULT,
} from './constants';
import type { Connection, WeightData, DeviceMetrics, Consent, Provider } from './types';
import DeviceModals from './components/DeviceModals';
import {
  getConnections,
  getDeviceData,
  createLinkSession,
  listWearableProviders,
  deregisterProvider,
  reconnectProvider,
  syncConnections,
  formatConnection,
  getConsent,
  updateConsent,
  deleteHealthData,
  getVitalsHistory,
  logWeight,
  getHealthGoal,
  saveHealthGoal
} from './api';
import { useProfile } from '../profile/hooks/use-profile';

function buildWeightData(entries: import('./types').VitalsEntry[], prev: WeightData): WeightData {
  const sorted = [...entries]
    .filter((e) => e.weight_lbs != null)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

  if (sorted.length === 0) {
    return prev;
  }

  const points = sorted.map((e) => ({
    date: e.measured_at,
    weight: Number(e.weight_lbs),
    bmi: e.bmi != null ? Number(e.bmi) : null,
  }));
  const series = points.map((p) => p.weight);
  const checkins = points.map((p) => ({
    label: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    w: p.weight,
  }));

  const latestHeight = [...sorted].reverse().find((e) => e.height_inches != null)?.height_inches;
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

function DevicesSkeleton() {
  const row = (
    <div
      style={{
        background: 'var(--km-s1)',
        border: '1px solid var(--km-b)',
        borderRadius: 14,
        marginBottom: 10,
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div className="km-skel" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="km-skel" style={{ width: 130, height: 13, marginBottom: 8 }} />
        <div className="km-skel" style={{ width: 190, height: 11 }} />
      </div>
      <div className="km-skel" style={{ width: 82, height: 30, borderRadius: 10, flexShrink: 0 }} />
    </div>
  );
  return (
    <div>
      {row}
      {row}
    </div>
  );
}

export default function DevicesPage() {
  const { patientProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  /* State */
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [weight, setWeight] = useState<WeightData>({ ...WEIGHT_DEFAULT });
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics>({ ...DEVICE_METRICS_DEFAULT });
  const [consent, setConsent] = useState<Consent>({ given: false, date: null });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allowedProviders, setAllowedProviders] = useState<Provider[]>([]);

  const fetchConnectionsList = useCallback(async () => {
    setLoading(true);
    try {
      const [conns, vitalsHistory, goalResponse, data] = await Promise.all([
        getConnections(),
        getVitalsHistory(),
        getHealthGoal(),
        getDeviceData(),
      ]);
      const formatted = conns.map((c) => formatConnection(c));
      setConnections(formatted);
      const isConnected = formatted.length > 0;

      if (data) {
        setDeviceMetrics(prev => ({
          ...prev,
          ...(data.steps && { steps: data.steps }),
          ...(data.sleep && { sleep: data.sleep }),
          ...(data.restingHr && { restingHr: data.restingHr }),
          ...(data.activeDays && { activeDays: data.activeDays }),
          ...(data.readiness != null && { readiness: data.readiness }),
          ...(data.recovery != null && { recovery: data.recovery }),
          ...(data.sleepScore != null && { sleepScore: data.sleepScore }),
          ...(data.stepsSeries && { stepsSeries: data.stepsSeries }),
          ...(data.sleepSeries && { sleepSeries: data.sleepSeries }),
          ...(data.sleepDetail && { sleepDetail: data.sleepDetail }),
          ...(data.workoutsCount !== undefined && { workoutsCount: data.workoutsCount }),
          ...(data.recentWorkouts && { recentWorkouts: data.recentWorkouts }),
          ...(data.glucoseSeries && { glucoseSeries: data.glucoseSeries }),
          ...(data.avgGlucose != null && { avgGlucose: data.avgGlucose }),
          ...(data.latestGlucose != null && { latestGlucose: data.latestGlucose }),
        }));
      }

      setWeight(prev => ({
        ...buildWeightData(vitalsHistory, prev),
        targetBmi: goalResponse.goal ? Number(goalResponse.goal.target_bmi) : null,
      }));
      setDeviceConnected(isConnected);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  // Connections/vitals/device-data are all resolved server-side from the
  // authenticated user (JWT) — no patientProfile.id needed to load them, so
  // this must not be gated on the separate patientProfile fetch (which can
  // legitimately fail/404 without blocking the rest of this page).
  useEffect(() => {
    fetchConnectionsList().finally(() => setInitialLoading(false));
  }, [fetchConnectionsList]);

  // The webhook that normally flips a connection from "pending" to
  // "connected" can't reach a local dev backend, and even in production
  // there's no fallback if it's ever dropped — so this asks Junction
  // directly instead of waiting. Reused by both the bounded auto-poll below
  // and the manual "Check status" button on a pending connection card.
  const handleRefreshStatus = useCallback(async () => {
    try {
      const conns = await syncConnections();
      const formatted = conns.map((c) => formatConnection(c));
      setConnections(formatted);
      setDeviceConnected(formatted.length > 0);
      return formatted;
    } catch {
      return null;
    }
  }, []);

  // Right after the OAuth redirect we land back with `wearable_connect=pending`
  // — that's the one moment we know it's worth actively polling, since OAuth
  // completion latency is usually just a few seconds. Bounded so this never
  // runs forever if the connection genuinely stays pending.
  const pollingRef = useRef(false);
  useEffect(() => {
    const wearableConnect = searchParams.get('wearable_connect');
    const provider = searchParams.get('provider');
    if (wearableConnect !== 'pending' || pollingRef.current) return;
    pollingRef.current = true;

    let cancelled = false;
    const maxAttempts = 10;
    const intervalMs = 4000;

    const clearParams = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('wearable_connect');
      next.delete('provider');
      setSearchParams(next, { replace: true });
    };

    (async function poll() {
      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        const formatted = await handleRefreshStatus();
        const stillPending = formatted?.some(
          (c) => c.provider === provider && c.status === 'pending'
        );
        if (!stillPending) break;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
      if (!cancelled) {
        clearParams();
        pollingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, handleRefreshStatus]);

  useEffect(() => {
    async function loadConsent() {
      try {
        const response = await getConsent();
        if (response.success && response.consent) {
          setConsent({
            given: response.consent.consent_granted,
            date: response.consent.updated_at
              ? new Date(response.consent.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null,
          });
        }
      } catch {
        setConsent({ given: false, date: null });
      }
    }
    loadConsent();
  }, []);

  useEffect(() => {
    async function loadAllowedProviders() {
      try {
        const response = await listWearableProviders();
        if (response.success && response.sources) {
          const mappedProviders: Provider[] = response.sources.map((s: any) => {
            // Backend tells us which slugs support a direct web OAuth redirect;
            // everything else (Apple Health, Beurer, etc.) is still a real,
            // connectable provider — it just requires the mobile app.
            const notWebConnectable = s.oauth_supported === false;
            const logoUrl: string | undefined = s.logo_url || undefined;

            const existing = PROVIDERS.find(p => p.id === s.slug);
            if (existing) {
              return {
                ...existing,
                mobile: existing.mobile || notWebConnectable,
                ...(logoUrl ? { logoUrl } : {}),
              };
            }

            let cat: Provider['cat'] = 'wear';
            let kind = 'Wearable';
            let ic = '⌚';
            let gives = 'Health Data';

            const c = (s.name || s.slug || '').toLowerCase();
            if (c.includes('libre') || c.includes('dexcom') || c.includes('accu')) { cat = 'cgm'; kind = 'CGM'; ic = '🩸'; gives = 'Continuous glucose'; }
            else if (c.includes('scale') || c.includes('renpho') || c.includes('withings')) { cat = 'scale'; kind = 'Smart scale'; ic = '⚖️'; gives = 'Weight & body composition'; }
            else if (c.includes('omron') || c.includes('beurer')) { cat = 'bp'; kind = 'Monitor'; ic = '🩺'; gives = 'Blood pressure'; }
            else if (c.includes('apple') || c.includes('healthconnect') || c.includes('samsung')) { cat = 'ondevice'; kind = 'On-device'; ic = '📱'; gives = 'All health & fitness data'; }
            else if (c.includes('strava') || c.includes('wahoo') || c.includes('peloton') || c.includes('zwift') || c.includes('fit')) { cat = 'app'; kind = 'App'; ic = '🏃'; gives = 'Activity & workouts'; }

            return {
              id: s.slug,
              name: s.name || s.slug,
              cat,
              kind,
              gives,
              ic,
              mobile: notWebConnectable,
              ...(logoUrl ? { logoUrl } : {}),
            };
          });
          setAllowedProviders(mappedProviders);
        }
      } catch {
        setAllowedProviders([]);
      }
    }
    loadAllowedProviders();
  }, []);

  // Device picker (connect state) filters
  const [devCat, setDevCat] = useState('all');
  const [devQuery, setDevQuery] = useState('');
  // Device picker modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCat, setPickerCat] = useState('all');
  const [pickerQuery, setPickerQuery] = useState('');

  // Modal states
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [logWeightOpen, setLogWeightOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentReviewOnly, setConsentReviewOnly] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkProvider, setLinkProvider] = useState('');
  const [linkErrorOpen, setLinkErrorOpen] = useState(false);
  const [linkErrorMsg, setLinkErrorMsg] = useState('');

  /* ─── Connect Device ─── */
  const handleConnect = useCallback(
    (providerId: string) => {
      const p = allowedProviders.find((x) => x.id === providerId);
      if (!p) return;

      if (!consent.given) {
        setConsentOpen(true);
        // Store pending provider
        (window as any).__pendingProvider = providerId;
        return;
      }

      if (p.mobile) {
        setLinkErrorMsg(
          `${p.name} is only available on the phone — connect it from the mobile app, there's nothing to link here on the web.`
        );
        setLinkErrorOpen(true);
        return;
      }

      if (!patientProfile?.id) {
        setLinkErrorMsg("Patient profile not loaded yet. Please try again.");
        setLinkErrorOpen(true);
        return;
      }

      setLinkOpen(true);
      setLinkProvider(p.name);

      createLinkSession(providerId, patientProfile.id)
        .then((res) => {
          setLinkOpen(false);
          if (res.demo) {
            fetchConnectionsList();
            return;
          }
          if (res.authorization_url) {
            window.location.assign(res.authorization_url);
          } else {
            throw new Error("No authorization URL returned from backend.");
          }
        })
        .catch((err) => {
          setLinkOpen(false);
          setLinkErrorMsg(err?.error?.message || err?.error || err?.message || "Failed to initiate device connection.");
          setLinkErrorOpen(true);
        });
    },
    [consent.given, patientProfile, allowedProviders, fetchConnectionsList]
  );

  /* ─── Disconnect Device ─── */
  const handleDisconnect = useCallback(
    (providerId: string) => {
      const conn = connections.find((c) => c.provider === providerId);
      if (!conn || !conn.id) {
        setConnections((prev) => {
          const next = prev.filter((c) => c.provider !== providerId);
          setDeviceConnected(next.length > 0);
          return next;
        });
        return;
      }

      setLoading(true);
      deregisterProvider(conn.id)
        .then(() => {
          setConnections((prev) => {
            const next = prev.filter((c) => c.provider !== providerId);
            setDeviceConnected(next.length > 0);
            return next;
          });
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    },
    [connections]
  );

  /* ─── Reconnect ─── */
  const handleReconnect = useCallback((providerId: string) => {
    const conn = connections.find((c) => c.provider === providerId);
    if (!conn || !conn.id) {
      handleConnect(providerId);
      return;
    }

    setLinkOpen(true);
    const p = allowedProviders.find((x) => x.id === providerId);
    if (p) setLinkProvider(p.name);

    reconnectProvider(conn.id)
      .then((res) => {
        setLinkOpen(false);
        if (res.demo) {
          fetchConnectionsList();
          return;
        }
        if (res.success && res.session?.oauth_url) {
          window.location.assign(res.session.oauth_url);
        } else {
          throw new Error("No authorization URL returned from backend.");
        }
      })
      .catch((err) => {
        setLinkOpen(false);
        setLinkErrorMsg(err?.error?.message || err?.error || err?.message || "Failed to initiate reconnection.");
        setLinkErrorOpen(true);
      });
  }, [connections, handleConnect, allowedProviders, fetchConnectionsList]);

  /* ─── Goal Modal ─── */
  const handleOpenGoal = useCallback(() => {
    setGoalInput(weight.targetBmi ? String(weight.targetBmi) : '');
    setGoalModalOpen(true);
  }, [weight.targetBmi]);

  const handleSaveGoal = useCallback(() => {
    const v = Number(goalInput);
    if (v >= 10 && v <= 80) {
      saveHealthGoal(v).then((response) => {
        setWeight((prev) => ({ ...prev, targetBmi: response.goal ? Number(response.goal.target_bmi) : null }));
        setGoalModalOpen(false);
      });
    }
  }, [goalInput]);

  const handleSaveLogWeight = useCallback(async (v: number) => {
    try {
      await logWeight(v);
      const history = await getVitalsHistory();
      setWeight((prev) => buildWeightData(history, prev));
    } catch {}
  }, []);

  /* ─── Consent (from non-review / "Before you connect") ─── */
  const handleAgreeConsent = useCallback(() => {
    setLoading(true);
    updateConsent(true, patientProfile?.id)
      .then((response) => {
        if (response.success && response.consent) {
          setConsent({
            given: response.consent.consent_granted,
            date: response.consent.updated_at
              ? new Date(response.consent.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null,
          });
        }
        setConsentOpen(false);
        // Connect the pending provider
        const pendingId = (window as any).__pendingProvider;
        if (pendingId) {
          (window as any).__pendingProvider = null;
          handleConnect(pendingId);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [patientProfile?.id, handleConnect]);

  /* ─── Delete Data ─── */
  const handleConfirmDeleteData = useCallback(() => {
    setLoading(true);
    deleteHealthData(true, patientProfile?.id, "User requested delete from patient portal")
      .then(() => {
        setConnections([]);
        setDeviceConnected(false);
        setConsent({ given: false, date: null });
        setDeviceMetrics({ ...DEVICE_METRICS_DEFAULT });
        setWeight({ ...WEIGHT_DEFAULT });
        setDeleteDataOpen(false);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [patientProfile?.id]);

  return (
    <div className="pg" id="pg-devices" aria-busy={loading}>
      <p className="km-page-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 31, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 4 }}>Devices</p>
      <p className="km-page-sub" style={{ fontSize: 13.5, color: 'var(--km-tm)', marginBottom: 24 }}>
        Connect a wearable to share your health data with your care team
        <span className="badge bn" style={{ fontSize: 10, verticalAlign: 'middle', marginLeft: 4, padding: '3px 9px', borderRadius: 20, background: 'var(--km-s3)', color: 'var(--km-t2)', fontWeight: 700 }}>Live data</span>
      </p>
      {initialLoading ? <DevicesSkeleton /> : <>
        {deviceConnected ? (
          <ConnectedState
            connections={connections}
            allowedProviders={allowedProviders}
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
            onConnectAnother={() => { setPickerCat('all'); setPickerQuery(''); setPickerOpen(true); }}
            onRefreshStatus={handleRefreshStatus}
          />
        ) : (
          <ConnectState
            allowedProviders={allowedProviders}
            devCat={devCat}
            devQuery={devQuery}
            onSetCategory={setDevCat}
            onSearchChange={setDevQuery}
            onConnect={handleConnect}
          />
        )}
        <TelemetryDashboard deviceMetrics={deviceMetrics} weight={weight} onOpenGoalModal={handleOpenGoal} />
        {deviceConnected && <DataPrivacyCard consent={consent} onOpenConsent={() => { setConsentReviewOnly(true); setConsentOpen(true); }} onOpenDeleteData={() => setDeleteDataOpen(true)} />}
      </>}
      <DeviceModals
        pickerOpen={pickerOpen}
        setPickerOpen={setPickerOpen}
        pickerCat={pickerCat}
        setPickerCat={setPickerCat}
        pickerQuery={pickerQuery}
        setPickerQuery={setPickerQuery}
        allowedProviders={allowedProviders}
        onConnect={handleConnect}
        goalModalOpen={goalModalOpen}
        setGoalModalOpen={setGoalModalOpen}
        goalInput={goalInput}
        setGoalInput={setGoalInput}
        weight={weight}
        onSaveGoal={handleSaveGoal}
        logWeightOpen={logWeightOpen}
        setLogWeightOpen={setLogWeightOpen}
        onSaveLogWeight={handleSaveLogWeight}
        consentOpen={consentOpen}
        setConsentOpen={setConsentOpen}
        consentReviewOnly={consentReviewOnly}
        onAgreeConsent={handleAgreeConsent}
        deleteDataOpen={deleteDataOpen}
        setDeleteDataOpen={setDeleteDataOpen}
        onConfirmDeleteData={handleConfirmDeleteData}
        linkOpen={linkOpen}
        linkProvider={linkProvider}
        linkErrorOpen={linkErrorOpen}
        setLinkErrorOpen={setLinkErrorOpen}
        linkErrorMsg={linkErrorMsg}
      />
    </div>
  );
}
