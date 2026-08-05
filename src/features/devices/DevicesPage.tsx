import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
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
import { profileService } from '../profile/services/profile.service';

function buildWeightData(entries: import('./types').VitalsEntry[], prev: WeightData, priorityList: string[]): WeightData {
  const byDate = new Map<string, import('./types').VitalsEntry>();
  
  for (const entry of entries) {
    if (entry.weight_lbs == null) continue;
    
    // Group by YYYY-MM-DD
    const dateKey = entry.measured_at.split('T')[0]!;
    const existing = byDate.get(dateKey);
    
    if (!existing) {
      byDate.set(dateKey, entry);
    } else {
      const existingRank = priorityList.indexOf(existing.source);
      const newRank = priorityList.indexOf(entry.source);
      
      const eRank = existingRank === -1 ? 999 : existingRank;
      const nRank = newRank === -1 ? 999 : newRank;
      
      if (nRank < eRank) {
        byDate.set(dateKey, entry);
      } else if (nRank === eRank && new Date(entry.measured_at).getTime() > new Date(existing.measured_at).getTime()) {
        byDate.set(dateKey, entry);
      }
    }
  }

  const sorted = Array.from(byDate.values())
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

  if (sorted.length === 0) {
    return prev;
  }

  const points = sorted.map((e) => ({
    date: e.measured_at,
    weight: Number(e.weight_lbs),
    bmi: e.bmi != null ? Number(e.bmi) : null,
    height: e.height_inches != null ? Number(e.height_inches) : null,
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
  const { patientProfile, updatePatientProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  /* State */
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [weight, setWeight] = useState<WeightData>({ ...WEIGHT_DEFAULT });
  const [masterDeviceMetrics, setMasterDeviceMetrics] = useState<DeviceMetrics>({ ...DEVICE_METRICS_DEFAULT });
  const [consent, setConsent] = useState<Consent>({ given: false, date: null });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allowedProviders, setAllowedProviders] = useState<Provider[]>([]);
  const [connectionSyncError, setConnectionSyncError] = useState('');
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState(30);
  const [isSyncing, setIsSyncing] = useState(false);
  const connectionsSyncTime = useRef<number>(0);


  const fetchMasterDeviceData = useCallback(async () => {
    try {
      const data = await getDeviceData(365, true);
      if (data) {
        setMasterDeviceMetrics(prev => ({
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
          ...(data.readinessSeries && { readinessSeries: data.readinessSeries }),
          ...(data.sleepDetail && { sleepDetail: data.sleepDetail }),
          ...(data.workoutsCount !== undefined && { workoutsCount: data.workoutsCount }),
          ...(data.recentWorkouts && { recentWorkouts: data.recentWorkouts }),
          ...(data.workoutsSeries && { workoutsSeries: data.workoutsSeries }),
          ...(data.glucoseSeries && { glucoseSeries: data.glucoseSeries }),
          ...(data.avgGlucose != null && { avgGlucose: data.avgGlucose }),
          ...(data.latestGlucose != null && { latestGlucose: data.latestGlucose }),
          ...(data.customQueries && { customQueries: data.customQueries }),
        }));
      }
    } catch (e) {
      console.error('Failed to fetch master device data', e);
    }
  }, []);

  const deviceMetrics = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    const cutoffStr = cutoffDate.toISOString().split('T')[0] ?? '';

    const filterSeries = <T extends { date: string }>(series?: T[]) => {
      if (!series) return [];
      return series.filter(item => item.date >= cutoffStr);
    };

    const stepsSeries = filterSeries(masterDeviceMetrics.stepsSeries);
    const sleepSeries = filterSeries(masterDeviceMetrics.sleepSeries);
    const readinessSeries = filterSeries(masterDeviceMetrics.readinessSeries);
    const workoutsSeries = filterSeries(masterDeviceMetrics.workoutsSeries);
    const recentWorkouts = filterSeries(masterDeviceMetrics.recentWorkouts);
    const glucoseSeries = filterSeries(masterDeviceMetrics.glucoseSeries);

    const customQueries = masterDeviceMetrics.customQueries?.map(q => ({
      ...q,
      series: filterSeries(q.series)
    })) || [];

    const activeDays = stepsSeries.length;
    const workoutsCount = recentWorkouts.length;
    const avgGlucose = glucoseSeries.length 
      ? Math.round((glucoseSeries.reduce((sum, g) => sum + g.val, 0) / glucoseSeries.length) * 10) / 10 
      : null;
    const latestGlucose = glucoseSeries.length ? (glucoseSeries[glucoseSeries.length - 1]?.val ?? null) : null;

    const lastStep = stepsSeries.length ? stepsSeries[stepsSeries.length - 1]?.val : undefined;
    const steps = lastStep !== undefined ? String(lastStep) : masterDeviceMetrics.steps;
    
    let sleep: string | null = masterDeviceMetrics.sleep;
    if (sleepSeries.length) {
      const val = sleepSeries[sleepSeries.length - 1]?.val ?? 0;
      const hrs = Math.floor(val);
      const mins = Math.round((val - hrs) * 60);
      sleep = `${hrs}h ${mins}m`;
    } else if (masterDeviceMetrics.sleepSeries?.length === 0) {
      sleep = null;
    }

    const lastReadiness = readinessSeries.length ? readinessSeries[readinessSeries.length - 1]?.val : undefined;
    const readiness = lastReadiness !== undefined ? String(lastReadiness) : masterDeviceMetrics.readiness;
    
    return {
      ...masterDeviceMetrics,
      stepsSeries,
      sleepSeries,
      readinessSeries,
      workoutsSeries,
      recentWorkouts,
      glucoseSeries,
      customQueries,
      activeDays: String(activeDays),
      workoutsCount,
      avgGlucose,
      latestGlucose,
      steps,
      sleep,
      readiness,
    };
  }, [masterDeviceMetrics, timeRange]);

  const mergeSeries = useCallback(<T extends { date: string }>(prevSeries?: T[], newSeries?: T[]) => {
    if (!newSeries?.length) return prevSeries;
    if (!prevSeries?.length) return newSeries;
    const map = new Map<string, T>();
    for (const item of prevSeries) {
      map.set(item.date, item);
    }
    for (const item of newSeries) {
      map.set(item.date, item);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  // Initial cached load + background live sync on mount
  useEffect(() => {
    toast.info('Fetching your extended historical data. This may take a moment...', {
      duration: 4000,
    });
    
    const initializeData = async () => {
      try {
        await fetchMasterDeviceData();
        getDeviceData(30, false)
          .then((liveData) => {
            if (liveData) {
              setMasterDeviceMetrics(prev => ({
                ...prev,
                ...(liveData.steps && { steps: liveData.steps }),
                ...(liveData.sleep && { sleep: liveData.sleep }),
                ...(liveData.restingHr && { restingHr: liveData.restingHr }),
                ...(liveData.activeDays && { activeDays: liveData.activeDays }),
                ...(liveData.readiness != null && { readiness: liveData.readiness }),
                ...(liveData.recovery != null && { recovery: liveData.recovery }),
                ...(liveData.sleepScore != null && { sleepScore: liveData.sleepScore }),
                stepsSeries: mergeSeries(prev.stepsSeries, liveData.stepsSeries),
                sleepSeries: mergeSeries(prev.sleepSeries, liveData.sleepSeries),
                readinessSeries: mergeSeries(prev.readinessSeries, liveData.readinessSeries),
                workoutsSeries: mergeSeries(prev.workoutsSeries, liveData.workoutsSeries),
                glucoseSeries: mergeSeries(prev.glucoseSeries, liveData.glucoseSeries),
                ...(liveData.sleepDetail && { sleepDetail: liveData.sleepDetail }),
                ...(liveData.workoutsCount !== undefined && { workoutsCount: liveData.workoutsCount }),
                ...(liveData.recentWorkouts && { recentWorkouts: liveData.recentWorkouts }),
                ...(liveData.avgGlucose != null && { avgGlucose: liveData.avgGlucose }),
                ...(liveData.latestGlucose != null && { latestGlucose: liveData.latestGlucose }),
                ...(liveData.customQueries && { customQueries: liveData.customQueries }),
              }));
            }
          })
          .catch(console.error);
      } catch (err) {
        console.error(err);
      }
    };
    
    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConnectionsList = useCallback(async () => {
    setLoading(true);
    const reqTime = Date.now();
    try {
      const [connectionsResult, vitalsResult, goalResult, profileResult] = await Promise.allSettled([
        getConnections(),
        getVitalsHistory(365),
        getHealthGoal(),
        profileService.getPatientProfile(),
      ]);

      if (connectionsResult.status === 'fulfilled' && connectionsResult.value !== null) {
        if (reqTime >= connectionsSyncTime.current) {
          connectionsSyncTime.current = reqTime;
          const formatted = connectionsResult.value.map(formatConnection);
          setConnections(formatted);
          setDeviceConnected(formatted.length > 0);
        }
      }

      setWeight(prev => {
        let priorityList = ['questionnaire', 'patient_portal', 'wearable'];
        if (profileResult.status === 'fulfilled' && profileResult.value) {
          priorityList = profileResult.value.vitals_source_priority || priorityList;
        }
        const next = vitalsResult.status === 'fulfilled'
          ? buildWeightData(vitalsResult.value, prev, priorityList)
          : prev;
        return {
          ...next,
          targetWeightLbs: goalResult.status === 'fulfilled' && goalResult.value.goal?.target_weight_lbs != null
            ? Number(goalResult.value.goal.target_weight_lbs)
            : next.targetWeightLbs,
          targetBmi: goalResult.status === 'fulfilled' && goalResult.value.goal?.target_bmi != null
            ? Number(goalResult.value.goal.target_bmi)
            : next.targetBmi,
        };
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOnlyConnections = useCallback(async () => {
    const reqTime = Date.now();
    try {
      const connectionsList = await getConnections();
      if (connectionsList !== null && reqTime >= connectionsSyncTime.current) {
        connectionsSyncTime.current = reqTime;
        const formatted = connectionsList.map(formatConnection);
        setConnections(formatted);
        setDeviceConnected(formatted.length > 0);
      }
    } catch (e) {
      console.error('Failed to fetch connections', e);
    }
  }, []);

  useEffect(() => {
    fetchConnectionsList().finally(() => setInitialLoading(false));
  }, [fetchConnectionsList]);

  const handleRefreshStatus = useCallback(async () => {
    setConnectionSyncError('');
    const reqTime = Date.now();
    try {
      const conns = await syncConnections();
      const formatted = conns.map((c) => formatConnection(c));
      if (reqTime >= connectionsSyncTime.current) {
        connectionsSyncTime.current = reqTime;
        setConnections(formatted);
        setDeviceConnected(formatted.length > 0);
      }
      return formatted;
    } catch {
      setConnectionSyncError('Unable to check the connection right now. Please try again.');
      return null;
    }
  }, [fetchMasterDeviceData]);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    toast.info(`Syncing your last ${timeRange} days of data. This may take a moment...`, { duration: 3000 });
    try {
      await getDeviceData(timeRange, false);
      await fetchMasterDeviceData();
      toast.success("Sync complete!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to sync device data.");
    } finally {
      setIsSyncing(false);
    }
  }, [timeRange, fetchMasterDeviceData]);

  const pendingProvidersStr = connections.filter(c => c.status === 'pending').map(c => c.provider).sort().join(',');

  useEffect(() => {
    const pendingProviders = pendingProvidersStr ? pendingProvidersStr.split(',') : [];
    
    const urlProvider = searchParams.get('provider');
    if (searchParams.get('wearable_connect') === 'pending' && urlProvider && !pendingProviders.includes(urlProvider)) {
      pendingProviders.push(urlProvider);
    }

    if (pendingProviders.length === 0) return;
    
    let isCancelled = false;
    let pollTimeout: NodeJS.Timeout;
    let attempt = 0;
    const maxAttempts = 30;
    const flatDelayMs = 1500;

    const clearParams = () => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('wearable_connect');
        next.delete('provider');
        return next;
      }, { replace: true });
    };

    const runPoll = async () => {
      if (isCancelled) return;
      if (attempt >= maxAttempts) {
        clearParams();
        setConnectionSyncError(''); 
        return;
      }

      const formatted = await handleRefreshStatus();
      if (isCancelled) return;

      const providerExists = formatted !== null && formatted.some(c => pendingProviders.includes(c.provider));
      const stillPending = !providerExists || formatted!.some(c => pendingProviders.includes(c.provider) && c.status === 'pending');

      if (!stillPending) {
        if (formatted !== null && formatted.some(c => pendingProviders.includes(c.provider) && c.status === 'connected')) {
          toast.success('Device successfully connected. Your health data is being synced. It might take ~2-3 min', {
            duration: 5000,
          });
          
          try {
            await fetchConnectionsList();
            await fetchMasterDeviceData();
          } catch (e) {
            console.error(e);
            await fetchConnectionsList();
          }
        }
        clearParams();
        setConnectionSyncError('');
        return;
      }

      setConnectionSyncError(`Checking connection status... (Attempt ${attempt + 1}/${maxAttempts})`);

      attempt++;
      pollTimeout = setTimeout(runPoll, flatDelayMs);
    };

    runPoll();

    return () => {
      isCancelled = true;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pendingProvidersStr]);

  // Background polling for progressive real-time graph via isBackfilling
  const isFetching = connections.some(c => c.isBackfilling);

  useEffect(() => {
    if (!isFetching) return;

    const interval = setInterval(() => {
      fetchMasterDeviceData().catch(console.error);
      fetchOnlyConnections().catch(console.error);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isFetching, fetchMasterDeviceData, fetchOnlyConnections]);

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
            const logoUrl: string | undefined = s.logo_url || undefined;

            const existing = PROVIDERS.find(p => p.id === s.slug);
            if (existing) {
              return {
                ...existing,
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
    (providerId: string, skipConsentCheck: boolean = false) => {
      const p = allowedProviders.find((x) => x.id === providerId);
      if (!p) return;

      if (!consent.given && !skipConsentCheck) {
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
        .catch((error: any) => {
          if (error?.error) {
            const errorMsg = typeof error.error === 'string' 
              ? error.error 
              : error.error.message || "Failed to disconnect device.";
            toast.error(errorMsg);
          } else {
            toast.error(error?.message || "Failed to disconnect device.");
          }
        })
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
    let initialInput = '';
    if (weight.targetWeightLbs != null && weight.targetWeightLbs >= 40 && weight.targetWeightLbs <= 800) {
      initialInput = String(weight.targetWeightLbs);
    } else if (weight.targetBmi != null && weight.heightIn != null) {
      const computedWeight = Math.round((weight.targetBmi * weight.heightIn * weight.heightIn) / 703);
      if (computedWeight >= 40 && computedWeight <= 800) {
        initialInput = String(computedWeight);
      }
    }
    setGoalInput(initialInput);
    setGoalModalOpen(true);
  }, [weight.targetWeightLbs, weight.targetBmi, weight.heightIn]);

  const handleSaveGoal = useCallback(() => {
    const v = Number(goalInput);
    if (v >= 40 && v <= 800) {
      saveHealthGoal(v)
        .then((response) => {
          setWeight((prev) => ({
            ...prev,
            targetWeightLbs: response.goal?.target_weight_lbs ? Number(response.goal.target_weight_lbs) : v,
            targetBmi: response.goal?.target_bmi ? Number(response.goal.target_bmi) : prev.targetBmi,
          }));
          setGoalModalOpen(false);
        })
        .catch((error: any) => {
          if (error?.error) {
            const errorMsg = typeof error.error === 'string' 
              ? error.error 
              : error.error.message || "Failed to save health goal.";
            toast.error(errorMsg);
          } else {
            toast.error(error?.message || "Failed to save health goal.");
          }
        });
    } else {
      toast.error("Please enter a valid target weight between 40 and 800 lbs.");
    }
  }, [goalInput]);

  const handleSaveLogWeight = useCallback(async (v: number) => {
    try {
      await logWeight(v);
      const [history, profile] = await Promise.all([
        getVitalsHistory(),
        profileService.getPatientProfile()
      ]);
      const priorityList = profile?.vitals_source_priority || ['questionnaire', 'patient_portal', 'wearable'];
      setWeight((prev) => buildWeightData(history, prev, priorityList));
    } catch (error: any) {
      if (error?.error) {
        const errorMsg = typeof error.error === 'string' 
          ? error.error 
          : error.error.message || "Failed to log weight.";
        toast.error(errorMsg);
      } else {
        toast.error(error?.message || "Failed to log weight.");
      }
    }
  }, []);

  const handleSavePriority = useCallback(async (priorityList: string[]) => {
    if (!patientProfile?.id) return;
    try {
      await updatePatientProfile({
        phone: patientProfile.phone || '',
        date_of_birth: patientProfile.date_of_birth || '',
        address: patientProfile.address || '',
        address_line_2: patientProfile.address_line_2 || '',
        city: patientProfile.city || '',
        state: patientProfile.state || '',
        zip_code: patientProfile.zip_code || '',
        sex: (patientProfile.sex as any) || 'Male',
        allergies: patientProfile.allergies || '',
        medical_conditions: patientProfile.medical_conditions || '',
        self_reported_meds: patientProfile.self_reported_meds || '',
        vitals_source_priority: priorityList,
      });
      const history = await getVitalsHistory();
      setWeight((prev) => buildWeightData(history, prev, priorityList));
    } catch (error: any) {
      console.error("Failed to save priority", error);
      if (error?.error) {
        const errorMsg = typeof error.error === 'string' 
          ? error.error 
          : error.error.message || "Failed to save data source priority.";
        toast.error(errorMsg);
      } else {
        toast.error(error?.message || "Failed to save data source priority.");
      }
    }
  }, [patientProfile, updatePatientProfile]);

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
          handleConnect(pendingId, true);
        }
      })
      .catch((error: any) => {
        const message = error?.response?.data?.detail || error?.message || error?.error || "You are not allowed to connect wearables at this time.";
        toast.error(message);
      })
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
        setMasterDeviceMetrics({ ...DEVICE_METRICS_DEFAULT });
        setWeight({ ...WEIGHT_DEFAULT });
        setDeleteDataOpen(false);
      })
      .catch((error: any) => {
        if (error?.error) {
          const errorMsg = typeof error.error === 'string' 
            ? error.error 
            : error.error.message || "Failed to delete health data.";
          toast.error(errorMsg);
        } else {
          toast.error(error?.message || "Failed to delete health data.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [patientProfile?.id]);

  return (
    <div className="pg" id="pg-devices" aria-busy={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p className="km-page-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 31, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 4 }}>Devices</p>
          <p className="km-page-sub" style={{ fontSize: 13.5, color: 'var(--km-tm)', marginBottom: 0 }}>
            Connect a wearable to share your health data with your care team
            <span className="badge bn" style={{ fontSize: 10, verticalAlign: 'middle', marginLeft: 4, padding: '3px 9px', borderRadius: 20, background: 'var(--km-s3)', color: 'var(--km-t2)', fontWeight: 700 }}>Live data</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {deviceConnected && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                padding: '8px 14px',
                background: 'var(--km-s1)',
                color: 'var(--km-t)',
                border: '1px solid var(--km-b)',
                borderRadius: 10,
                fontWeight: 600,
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                marginTop: 4,
                opacity: isSyncing ? 0.7 : 1,
              }}
            >
              {isSyncing ? <Loader2 size={16} className="km-spin" /> : <RefreshCw size={16} />}
              Sync {timeRange} Days
            </button>
          )}
          <button
            onClick={() => setPriorityModalOpen(true)}
            style={{
            fontSize: 12.5,
            padding: '8px 14px',
            background: 'var(--km-s1)',
            color: 'var(--km-t)',
            border: '1px solid var(--km-b)',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          Data Sources Priority
        </button>
        </div>
      </div>
      {initialLoading ? <DevicesSkeleton /> : <>
        {deviceConnected ? (
          <ConnectedState
            connections={connections}
            allowedProviders={allowedProviders}
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
            onConnectAnother={() => { setPickerCat('all'); setPickerQuery(''); setPickerOpen(true); }}
            onRefreshStatus={handleRefreshStatus}
            syncError={connectionSyncError}
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
        <TelemetryDashboard 
          deviceMetrics={deviceMetrics} 
          weight={weight} 
          onOpenGoalModal={handleOpenGoal}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange} 
        />
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
        priorityModalOpen={priorityModalOpen}
        setPriorityModalOpen={setPriorityModalOpen}
        onSavePriority={handleSavePriority}
        initialPriority={patientProfile?.vitals_source_priority ?? null}
      />
    </div>
  );
}
