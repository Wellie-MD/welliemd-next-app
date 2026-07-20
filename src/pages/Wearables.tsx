import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, Download, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import WearablesInsights from './WearablesInsights';
import { PROV_CP, givesReadiness, pdScoreColor, pdScoreLabel, useWearablesData } from './useWearablesData';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FILTER_TABS: Array<{ id: 'all' | 'connected' | 'not' | 'attention'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'connected', label: 'Connected' },
  { id: 'not', label: 'Not connected' },
  { id: 'attention', label: 'Needs attention' },
];

export default function Wearables() {
  const navigate = useNavigate();
  const [view, setView] = useState<'roster' | 'insights'>('roster');
  const [filter, setFilter] = useState<'all' | 'connected' | 'not' | 'attention'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Debouncing search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { patients, loading, refreshing, error, allComputed, stats, insightsData, totalCount, insightsLoading } = useWearablesData({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    loadInsights: view === 'insights',
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const filteredRows = allComputed.filter((row) => {
    if (filter === 'connected' && !row.connected) return false;
    if (filter === 'not' && row.connected) return false;
    if (filter === 'attention' && !row.needs) return false;
    return true;
  });

  const triggerToast = (msg: string) => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToastMsg(msg);
    const id = setTimeout(() => setToastMsg(null), 2600);
    setToastTimeoutId(id);
  };

  return (
    <div className="p-6 pb-24 space-y-6" style={{ position: 'relative' }}>
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
            Live data
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
                  { label: 'Connected', val: stats.connected, sub: `of ${allComputed.length + (totalCount - allComputed.length)} patients` },
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
                {FILTER_TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setFilter(t.id);
                      setCurrentPage(1);
                    }}
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
                        padding: '8px 34px 8px 34px',
                        fontSize: 12.5,
                        color: 'var(--km-t)',
                        outline: 'none'
                      }}
                      placeholder="Search by patient, email, or device..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {refreshing && (
                      <Loader2
                        className="animate-spin"
                        size={14}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--km-tm)' }}
                      />
                    )}
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
                <div style={{ overflowX: 'auto', opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.15s' }}>
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
                          const hasReadiness = r.connected && givesReadiness(r.provider || '') && typeof r.d.readiness === 'number';
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
                                {r.cur != null ? (
                                  <>
                                    {r.cur} lb{' '}
                                    <span
                                      style={{
                                        color: r.chg != null && r.chg <= 0 ? 'var(--km-gr)' : 'var(--km-am)',
                                        fontWeight: 700,
                                        fontSize: 11
                                      }}
                                    >
                                      {r.chg != null ? `${r.chg <= 0 ? '▼' : '▲'} ${Math.abs(r.chg)}` : 'No prior reading'}
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

                {/* Pagination footer */}
                <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid var(--km-b)', marginTop: 14, paddingTop: 14 }}>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span>Rows per page</span>
                    <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 w-[72px] rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-755 dark:text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20, 50].map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-300 dark:disabled:text-slate-700"
                        disabled={currentPage <= 1 || loading || refreshing}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-955 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-300 dark:disabled:text-slate-700"
                        disabled={currentPage >= totalPages || loading || refreshing}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            insightsLoading ? (
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
                  Analyzing telemetry & computing insights...
                </p>
              </div>
            ) : (
              <WearablesInsights data={insightsData} connectedCount={stats.connected} onPatientClick={(patientId) => navigate(`/dashboard/patients/${patientId}`)} />
            )
          )}
        </>
      )}
    </div>
  );
}
