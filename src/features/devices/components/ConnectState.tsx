import React from 'react';
import { Search, Smartphone } from 'lucide-react';
import { PROVIDERS, CATS } from '../constants';
import type { Provider } from '../types';
import ProviderIcon from './ProviderIcon';

interface ConnectStateProps {
  allowedProviders: Provider[];
  devCat: string;
  devQuery: string;
  onSetCategory: (cat: string) => void;
  onSearchChange: (q: string) => void;
  onConnect: (provider: string) => void;
}

export default function ConnectState({
  allowedProviders,
  devCat,
  devQuery,
  onSetCategory,
  onSearchChange,
  onConnect,
}: ConnectStateProps) {
  const filteredList = allowedProviders.filter(
    (p) =>
      (devCat === 'all' || p.cat === devCat) &&
      (!devQuery.trim() ||
        (p.name + ' ' + p.kind + ' ' + p.gives)
          .toLowerCase()
          .includes(devQuery.trim().toLowerCase()))
  );

  return (
    <>
      {/* Connect a device card */}
      <div
        className="km-card"
        style={{ padding: '26px 22px', textAlign: 'center', marginBottom: 16 }}
      >
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
            margin: '0 auto 13px',
          }}
        >
          <Smartphone size={23} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>
          Connect a device
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--km-tm)',
            maxWidth: 420,
            margin: '0 auto',
            lineHeight: 1.55,
          }}
        >
          Link a wearable, smart scale, or health app to track your weight and
          activity between visits. You choose what to share, and you can
          disconnect anytime.
        </div>
      </div>

      {/* Search */}
      <div className="km-swrap" style={{ marginBottom: 12 }}>
        <Search size={16} />
        <input
          className="km-sinp"
          placeholder="Search 300+ devices & apps"
          value={devQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>  

      {/* Category chips */}
      <div
        style={{
          display: 'flex',
          gap: 7,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        {CATS.map((c) => (
          <span
            key={c.id}
            onClick={() => onSetCategory(c.id)}
            style={{
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 13px',
              borderRadius: 20,
              border: '1px solid var(--km-b)',
              background:
                devCat === c.id ? 'var(--km-navy)' : 'var(--km-s1)',
              color:
                devCat === c.id ? 'var(--km-navyfg)' : 'var(--km-t2)',
              borderColor:
                devCat === c.id ? 'var(--km-navy)' : 'var(--km-b)',
            }}
          >
            {c.label}
          </span>
        ))}
      </div>

      {/* Device list */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        {filteredList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--km-tm)',
              fontSize: 13,
              padding: 24,
            }}
          >
            No devices match your search.
          </div>
        ) : (
          filteredList.map((p: Provider) => (
            <div
              key={p.id}
              className="km-card"
              style={{
                marginBottom: 0,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 13,
              }}
            >
              <ProviderIcon logoUrl={p.logoUrl} fallback={p.ic} size={42} radius={12} fontSize={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--km-tm)',
                    marginTop: 1,
                  }}
                >
                  {p.kind} · {p.gives}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {p.mobile && (
                  <span className="badge bn" style={{ fontSize: 10 }}>
                    Mobile app
                  </span>
                )}
                <button
                  className="km-btn km-btn-outline"
                  style={{ fontSize: 12.5, padding: '7px 16px', flexShrink: 0, background: 'var(--km-s2)', color: 'var(--km-t)', border: '1px solid var(--km-b)', borderRadius: 11, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => onConnect(p.id)}
                >
                  Connect
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}