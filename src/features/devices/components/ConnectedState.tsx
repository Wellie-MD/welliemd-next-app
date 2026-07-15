import React from 'react';
import { PROVIDERS } from '../constants';
import type { Connection, Provider } from '../types';
import ProviderIcon from './ProviderIcon';

interface ConnectedStateProps {
  connections: Connection[];
  allowedProviders: Provider[];
  onDisconnect: (provider: string) => void;
  onReconnect: (provider: string) => void;
  onConnectAnother: () => void;
}

const CARD: React.CSSProperties = {
  background: 'var(--km-s1)',
  border: '1px solid var(--km-b)',
  borderRadius: 14,
  marginBottom: 10,
  overflow: 'hidden',
};

export default function ConnectedState({
  connections,
  allowedProviders,
  onDisconnect,
  onReconnect,
  onConnectAnother,
}: ConnectedStateProps) {

  return (
    <>
      {/* ─── Each device = its own card ─── */}
      {connections.map((c) => {
        const p = allowedProviders.find((x) => x.id === c.provider) ||
          PROVIDERS.find((x) => x.id === c.provider) || {
          name: c.name || 'Device',
          gives: 'Health data',
          ic: '⌚',
          cat: undefined,
        };
        const broken = c.status === 'error';

        return (
          <div key={c.provider} style={CARD}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
              }}
            >
              <ProviderIcon
                logoUrl={p.logoUrl}
                fallback={p.ic}
                size={36}
                radius={10}
                fontSize={18}
                background={broken ? 'var(--km-amp)' : 'var(--km-s2)'}
                border={`1px solid ${broken ? 'var(--km-am)' : 'var(--km-b)'}`}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</span>
                  {broken ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'var(--km-amp)',
                        color: 'var(--km-am)',
                        fontWeight: 700,
                      }}
                    >
                      Needs attention
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'var(--km-grp)',
                        color: 'var(--km-gr)',
                        fontWeight: 700,
                      }}
                    >
                      Connected
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: broken ? 'var(--km-am)' : 'var(--km-tm)',
                    marginTop: 1,
                  }}
                >
                  {broken
                    ? reconnectReason(c.errorType)
                    : `${p.gives} · last synced ${c.lastSync || 'recently'}`}
                </div>
              </div>

              {broken ? (
                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  <button
                    style={{
                      fontSize: 12,
                      padding: '7px 14px',
                      background: 'var(--km-am)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onReconnect(c.provider)}
                  >
                    Reconnect
                  </button>
                  <button
                    style={{
                      fontSize: 12,
                      padding: '7px 14px',
                      background: 'transparent',
                      color: 'var(--km-t)',
                      border: '1px solid var(--km-b)',
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onDisconnect(c.provider)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  style={{
                    fontSize: 12,
                    padding: '7px 14px',
                    flexShrink: 0,
                    background: 'transparent',
                    color: 'var(--km-t)',
                    border: '1px solid var(--km-b)',
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => onDisconnect(c.provider)}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* ─── Connect another device ─── */}
      <div style={{ padding: '4px 0 14px' }}>
        <span
          style={{ color: 'var(--km-ac)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          onClick={onConnectAnother}
        >
          + Connect another device
        </span>
      </div>

    </>
  );
}


function reconnectReason(t?: string): string {
  const reasons: Record<string, string> = {
    token_expired: 'Sign-in expired — reconnect to keep syncing.',
    provider_credential_error: 'Sign-in was rejected — reconnect to resume.',
    provider_password_expired: 'Account password changed — reconnect to resume.',
    provider_api_error: 'The device service had a problem — try reconnecting.',
  };
  return reasons[t ?? ''] || 'Syncing stopped — reconnect to resume.';
}
