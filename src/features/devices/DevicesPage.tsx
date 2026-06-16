import React, { useState, useCallback } from 'react';
import { Search, Smartphone, X, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import ConnectState from './components/ConnectState';
import ConnectedState from './components/ConnectedState';
import {
  PROVIDERS,
  SDK_PROVIDERS,
  CATS,
  WEIGHT_DEFAULT,
  DEVICE_METRICS_DEFAULT,
} from './constants';
import type { Connection, WeightData, DeviceMetrics, Consent } from './types';
import { getConnections, getDeviceData, getLinkToken } from './api';

/* ─── DEMO MODE ONLY ─── */
const JUNCTION = { backend: null as string | null, userId: 'demo-user', env: 'sandbox' as const };

export default function DevicesPage() {
  /* State */
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([
    { provider: 'withings', name: 'Withings', lastSync: '2h ago' },
    { provider: 'fitbit', name: 'Fitbit', lastSync: '1h ago' },
    { provider: 'oura', name: 'Oura', lastSync: '3h ago', status: 'error', errorType: 'token_expired' },
  ]);
  const [weight, setWeight] = useState<WeightData>({ ...WEIGHT_DEFAULT });
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics>({ ...DEVICE_METRICS_DEFAULT });
  const [consent, setConsent] = useState<Consent>({ given: true, date: 'May 12, 2026' });
  const [loading, setLoading] = useState(false);

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
  const [logWeightInput, setLogWeightInput] = useState('');
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentReviewOnly, setConsentReviewOnly] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkProvider, setLinkProvider] = useState('');
  const [linkErrorOpen, setLinkErrorOpen] = useState(false);
  const [linkErrorMsg, setLinkErrorMsg] = useState('');

  /* ─── Demo Connect ─── */
  const demoConnect = useCallback(
    (providerId: string) => {
      setLinkOpen(true);
      const p = PROVIDERS.find((x) => x.id === providerId);
      if (p) setLinkProvider(p.name);
      setTimeout(() => {
        setLinkOpen(false);
        setPickerOpen(false);
        setConnections((prev) => {
          const existing = prev.find((c) => c.provider === providerId);
          if (existing) {
            return prev.map((c) =>
              c.provider === providerId
                ? { ...c, status: undefined as any, errorType: undefined, lastSync: 'just now' }
                : c
            );
          }
          return [
            ...prev,
            { provider: providerId, name: p?.name || providerId, lastSync: 'just now' },
          ];
        });
        setDeviceConnected(true);
      }, 1450);
    },
    []
  );

  /* ─── Connect Device ─── */
  const handleConnect = useCallback(
    (providerId: string) => {
      const p = PROVIDERS.find((x) => x.id === providerId);
      if (!p) return;

      if (!consent.given) {
        setConsentOpen(true);
        // Store pending provider
        (window as any).__pendingProvider = providerId;
        return;
      }

      if (SDK_PROVIDERS.includes(providerId)) {
        setLinkErrorMsg(
          `${p.name} connects from the mobile app — there's nothing to link on the web.`
        );
        setLinkErrorOpen(true);
        return;
      }

      // Demo mode always runs locally
      demoConnect(providerId);
    },
    [consent.given, demoConnect]
  );

  /* ─── Disconnect Device (demo) ─── */
  const handleDisconnect = useCallback(
    (providerId: string) => {
      setConnections((prev) => {
        const next = prev.filter((c) => c.provider !== providerId);
        setDeviceConnected(next.length > 0);
        return next;
      });
    },
    []
  );

  /* ─── Reconnect ─── */
  const handleReconnect = useCallback((providerId: string) => {
    handleConnect(providerId);
  }, [handleConnect]);

  /* ─── Goal Modal ─── */
  const handleOpenGoal = useCallback(() => {
    setGoalInput(weight.goal ? String(weight.goal) : '');
    setGoalModalOpen(true);
  }, [weight.goal]);

  const handleSaveGoal = useCallback(() => {
    const v = parseFloat(goalInput);
    if (v && v > 0) {
      setWeight((prev) => ({ ...prev, goal: v }));
    }
    setGoalModalOpen(false);
  }, [goalInput]);

  /* ─── Log Weight ─── */
  const handleOpenLogWeight = useCallback(() => {
    setLogWeightInput('');
    setLogWeightOpen(true);
  }, []);

  const handleSaveLogWeight = useCallback(() => {
    const v = parseFloat(logWeightInput);
    if (v && v > 0) {
      setWeight((prev) => {
        const label = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const newCheckins = [...prev.checkins, { label, w: v }];
        const newSeries = deviceConnected ? [...prev.series, v] : prev.series;
        return { ...prev, checkins: newCheckins, series: newSeries };
      });
    }
    setLogWeightOpen(false);
  }, [logWeightInput, deviceConnected]);

  /* ─── Consent (from non-review / "Before you connect") ─── */
  const handleAgreeConsent = useCallback(() => {
    setConsent({
      given: true,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });
    setConsentOpen(false);
    // Connect the pending provider
    const pendingId = (window as any).__pendingProvider;
    if (pendingId) {
      (window as any).__pendingProvider = null;
      demoConnect(pendingId);
    }
  }, [demoConnect]);

  /* ─── Delete Data ─── */
  const handleConfirmDeleteData = useCallback(() => {
    setConnections([]);
    setDeviceConnected(false);
    setConsent({ given: false, date: null });
    setDeleteDataOpen(false);
  }, []);

  /* ─── Overlay component ─── */
  const Overlay = ({
    show,
    onClose,
    children,
    maxW = 400,
  }: {
    show: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxW?: number;
  }) => {
    if (!show) return null;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '40px 16px',
          overflowY: 'auto',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            background: 'var(--km-s1)',
            border: '1px solid var(--km-b)',
            borderRadius: 18,
            width: '100%',
            maxWidth: maxW,
            padding: 22,
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  /* ─── Render ─── */
  return (
    <div className="pg" id="pg-devices">
      <p
        className="km-page-title"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 31,
          fontWeight: 600,
          letterSpacing: '-0.5px',
          marginBottom: 4,
        }}
      >
        Devices
      </p>
      <p
        className="km-page-sub"
        style={{ fontSize: 13.5, color: 'var(--km-tm)', marginBottom: 24 }}
      >
        Connect a wearable to share your health data with your care team
        <span
          className="badge bn"
          style={{
            fontSize: 10,
            verticalAlign: 'middle',
            marginLeft: 4,
            padding: '3px 9px',
            borderRadius: 20,
            background: 'var(--km-s3)',
            color: 'var(--km-t2)',
            fontWeight: 700,
          }}
        >
          Sandbox
        </span>
      </p>


      {/* ─── Main Content ─── */}
      {deviceConnected && connections.length > 0 ? (
        <ConnectedState
          connections={connections}
          weight={weight}
          deviceMetrics={deviceMetrics}
          consent={consent}
          onDisconnect={handleDisconnect}
          onReconnect={handleReconnect}
          onConnectAnother={() => {
            setPickerCat('all');
            setPickerQuery('');
            setPickerOpen(true);
          }}
          onOpenGoalModal={handleOpenGoal}
          onOpenLogWeight={handleOpenLogWeight}
          onOpenConsent={() => {
            setConsentReviewOnly(true);
            setConsentOpen(true);
          }}
          onOpenDeleteData={() => setDeleteDataOpen(true)}
        />
      ) : (
        <ConnectState
          devCat={devCat}
          devQuery={devQuery}
          onSetCategory={setDevCat}
          onSearchChange={setDevQuery}
          onConnect={handleConnect}
        />
      )}

      {/* ─── DEVICE PICKER MODAL ─── */}
      <Overlay show={pickerOpen} onClose={() => setPickerOpen(false)} maxW={440}>
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>Connect a device</span>
            <div
              style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--km-tm)' }}
              onClick={() => setPickerOpen(false)}
            >
              <X size={17} />
            </div>
          </div>
          <div className="km-swrap" style={{ marginBottom: 12 }}>
            <Search size={16} />
            <input
              className="km-sinp"
              placeholder="Search 300+ devices & apps"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {CATS.map((c) => (
              <span
                key={c.id}
                onClick={() => setPickerCat(c.id)}
                style={{
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 13px',
                  borderRadius: 20,
                  border: '1px solid var(--km-b)',
                  background: pickerCat === c.id ? 'var(--km-navy)' : 'var(--km-s1)',
                  color: pickerCat === c.id ? 'var(--km-navyfg)' : 'var(--km-t2)',
                  borderColor: pickerCat === c.id ? 'var(--km-navy)' : 'var(--km-b)',
                }}
              >
                {c.label}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
            {PROVIDERS.filter(
              (p) =>
                (pickerCat === 'all' || p.cat === pickerCat) &&
                (!pickerQuery.trim() ||
                  (p.name + ' ' + p.kind + ' ' + p.gives)
                    .toLowerCase()
                    .includes(pickerQuery.trim().toLowerCase()))
            ).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 13px',
                  background: 'var(--km-s1)',
                  border: '1px solid var(--km-b)',
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: 'var(--km-s2)',
                    border: '1px solid var(--km-b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {p.ic}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--km-tm)', marginTop: 1 }}>
                    {p.kind} · {p.gives}
                  </div>
                </div>
                {p.mobile ? (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '3px 9px',
                      borderRadius: 20,
                      background: 'var(--km-s2)',
                      border: '1px solid var(--km-b)',
                      color: 'var(--km-tm)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Mobile app
                  </span>
                ) : (
                  <button
                    style={{
                      fontSize: 12.5,
                      padding: '7px 16px',
                      flexShrink: 0,
                      background: 'var(--km-s2)',
                      color: 'var(--km-t)',
                      border: '1px solid var(--km-b)',
                      borderRadius: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setPickerOpen(false);
                      handleConnect(p.id);
                    }}
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Overlay>

      {/* ─── GOAL MODAL ─── */}
      <Overlay show={goalModalOpen} onClose={() => setGoalModalOpen(false)} maxW={380}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>Set your goal weight</span>
          <div
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--km-tm)' }}
            onClick={() => setGoalModalOpen(false)}
          >
            <X size={17} />
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--km-tm)', lineHeight: 1.5, marginBottom: 16 }}>
          Your goal shows as a target line on your weight chart. You can change it anytime.
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--km-t2)', marginBottom: 6, display: 'block' }}
          >
            Goal weight (lb)
          </label>
          <input
            className="km-inp"
            type="number"
            min={80}
            step={0.5}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder="e.g. 185"
            style={{
              width: '100%',
              background: 'var(--km-s2)',
              border: '1px solid var(--km-b)',
              borderRadius: 11,
              padding: '12px 14px',
              fontFamily: 'inherit',
              fontSize: 14,
              color: 'var(--km-t)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 11,
              background: 'var(--km-s2)',
              color: 'var(--km-t)',
              border: '1px solid var(--km-b)',
              cursor: 'pointer',
            }}
            onClick={() => setGoalModalOpen(false)}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 11,
              background: 'var(--km-am)',
              color: '#fff',
              border: '1px solid var(--km-am)',
              cursor: 'pointer',
            }}
            onClick={handleSaveGoal}
          >
            Save goal
          </button>
        </div>
      </Overlay>

      {/* ─── LOG WEIGHT MODAL ─── */}
      <Overlay show={logWeightOpen} onClose={() => setLogWeightOpen(false)} maxW={360}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>Log your weight</span>
          <div
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--km-tm)' }}
            onClick={() => setLogWeightOpen(false)}
          >
            <X size={17} />
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--km-tm)', lineHeight: 1.5, marginBottom: 16 }}>
          Add today's weight. This updates your progress and is shared with your care team.
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--km-t2)', marginBottom: 6, display: 'block' }}
          >
            Weight (lb)
          </label>
          <input
            className="km-inp"
            type="number"
            min={50}
            step={0.1}
            value={logWeightInput}
            onChange={(e) => setLogWeightInput(e.target.value)}
            placeholder="e.g. 201"
            style={{
              width: '100%',
              background: 'var(--km-s2)',
              border: '1px solid var(--km-b)',
              borderRadius: 11,
              padding: '12px 14px',
              fontFamily: 'inherit',
              fontSize: 14,
              color: 'var(--km-t)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 11,
              background: 'var(--km-s2)',
              color: 'var(--km-t)',
              border: '1px solid var(--km-b)',
              cursor: 'pointer',
            }}
            onClick={() => setLogWeightOpen(false)}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 11,
              background: 'var(--km-am)',
              color: '#fff',
              border: '1px solid var(--km-am)',
              cursor: 'pointer',
            }}
            onClick={handleSaveLogWeight}
          >
            Save
          </button>
        </div>
      </Overlay>

      {/* ─── CONSENT MODAL ─── */}
      <Overlay show={consentOpen} onClose={() => setConsentOpen(false)} maxW={430}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>{consentReviewOnly ? 'What you share' : 'Before you connect'}</span>
          <div
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--km-tm)' }}
            onClick={() => setConsentOpen(false)}
          >
            <X size={17} />
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--km-t2)', lineHeight: 1.6, marginBottom: 14 }}>
          Connecting a device shares your health data with{' '}
          <b style={{ color: 'var(--km-t)' }}>your care team at Kin</b>, who use it to monitor your
          progress and adjust your treatment. Your data is never sold or used for advertising.
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            color: 'var(--km-tm)',
            marginBottom: 8,
          }}
        >
          Data you'll share
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {[
            'Sleep',
            'Activity',
            'Heart rate',
            'Body & weight',
            'Glucose',
            'Nutrition',
            'Workouts',
          ].map((c) => (
            <span
              key={c}
              style={{
                fontSize: 11.5,
                background: 'var(--km-s2)',
                border: '1px solid var(--km-b)',
                borderRadius: 999,
                padding: '5px 11px',
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--km-tm)',
            lineHeight: 1.55,
            background: 'var(--km-s2)',
            border: '1px solid var(--km-b)',
            borderRadius: 11,
            padding: '12px 14px',
            marginBottom: 18,
          }}
        >
          You stay in control: disconnect any device, or delete all of your shared health data, at
          any time from this screen.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 11,
              background: 'var(--km-s2)',
              color: 'var(--km-t)',
              border: '1px solid var(--km-b)',
              cursor: 'pointer',
            }}
            onClick={() => setConsentOpen(false)}
          >
            Cancel
          </button>
          {consentReviewOnly ? (
            <button
              style={{
                flex: 1.4,
                fontSize: 13.5,
                fontWeight: 600,
                padding: '11px 18px',
                borderRadius: 11,
                background: 'var(--km-am)',
                color: '#fff',
                border: '1px solid var(--km-am)',
                cursor: 'pointer',
              }}
              onClick={() => setConsentOpen(false)}
            >
              Done
            </button>
          ) : (
            <button
              style={{
                flex: 1.4,
                fontSize: 13.5,
                fontWeight: 600,
                padding: '11px 18px',
                borderRadius: 11,
                background: 'var(--km-am)',
                color: '#fff',
                border: '1px solid var(--km-am)',
                cursor: 'pointer',
              }}
              onClick={handleAgreeConsent}
            >
              Agree & connect
            </button>
          )}
        </div>
      </Overlay>

      {/* ─── DELETE DATA MODAL ─── */}
      <Overlay show={deleteDataOpen} onClose={() => setDeleteDataOpen(false)} maxW={400}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>Delete your health data?</span>
          <div
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--km-tm)' }}
            onClick={() => setDeleteDataOpen(false)}
          >
            <X size={17} />
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--km-t2)', lineHeight: 1.6, marginBottom: 18 }}>
          This disconnects all of your devices and permanently removes the health data synced to Kin
          via Junction. Your care team will no longer see your wearable data. This can't be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 11,
              background: 'var(--km-s2)',
              color: 'var(--km-t)',
              border: '1px solid var(--km-b)',
              cursor: 'pointer',
            }}
            onClick={() => setDeleteDataOpen(false)}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 18px',
              borderRadius: 11,
              background: 'var(--km-re)',
              color: '#fff',
              border: '1px solid var(--km-re)',
              cursor: 'pointer',
            }}
            onClick={handleConfirmDeleteData}
          >
            Delete my data
          </button>
        </div>
      </Overlay>

      {/* ─── LINK OVERLAY (progress) ─── */}
      {linkOpen && (
        <Overlay show={linkOpen} onClose={() => {}} maxW={360}>
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: 'var(--km-s2)',
                border: '1px solid var(--km-b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                margin: '0 auto 16px',
              }}
            >
              <Smartphone size={26} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              Connecting to {linkProvider}…
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--km-tm)', lineHeight: 1.5 }}>
              Junction is opening {linkProvider}'s secure sign-in so you can authorize sharing your
              health data.
            </div>
            <div
              style={{
                marginTop: 18,
                height: 4,
                background: 'var(--km-s2)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  background: 'var(--km-ac)',
                  transition: 'width 1.1s ease',
                }}
              />
            </div>
          </div>
        </Overlay>
      )}

      {/* ─── LINK ERROR OVERLAY ─── */}
      {linkErrorOpen && (
        <Overlay show={linkErrorOpen} onClose={() => setLinkErrorOpen(false)} maxW={360}>
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: 'var(--km-amp)',
                color: 'var(--km-am)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <AlertCircle size={24} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              Could not connect
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--km-tm)',
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              {linkErrorMsg}
            </div>
            <button
              style={{
                width: '100%',
                fontSize: 13.5,
                fontWeight: 600,
                padding: '11px 18px',
                borderRadius: 11,
                background: 'var(--km-am)',
                color: '#fff',
                border: '1px solid var(--km-am)',
                cursor: 'pointer',
              }}
              onClick={() => setLinkErrorOpen(false)}
            >
              OK
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}