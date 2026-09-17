import React from 'react';
import { Shield, Trash2 } from 'lucide-react';
import { SHARED_CATEGORIES } from '../constants';
import type { Consent } from '../types';

interface DataPrivacyCardProps {
  consent: Consent;
  onOpenConsent: () => void;
  onOpenDeleteData: () => void;
}

const CARD: React.CSSProperties = {
  background: 'var(--km-s1)',
  border: '1px solid var(--km-b)',
  borderRadius: 14,
  marginBottom: 10,
  overflow: 'hidden',
};

export default function DataPrivacyCard({
  consent,
  onOpenConsent,
  onOpenDeleteData,
}: DataPrivacyCardProps) {
  return (
    <div style={{ ...CARD, marginTop: 4 }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'var(--km-acp)',
              color: 'var(--km-ac)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={14} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>Data sharing & privacy</span>
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--km-t2)', lineHeight: 1.6, marginBottom: 10 }}>
          You're sharing your connected health data with{' '}
          <b>your care team at Kin</b> to support your treatment, via Junction.{' '}
          {consent.date && (
            <>
              Consent on file since <b>{consent.date}</b>.{' '}
            </>
          )}
          Your data is never sold or used for advertising.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {SHARED_CATEGORIES.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 11,
                background: 'var(--km-s2)',
                border: '1px solid var(--km-b)',
                borderRadius: 999,
                padding: '4px 10px',
                color: 'var(--km-t2)',
              }}
            >
              {c}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={{
              fontSize: 12.5,
              padding: '8px 14px',
              background: 'transparent',
              color: 'var(--km-t)',
              border: '1px solid var(--km-b)',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={onOpenConsent}
          >
            Review what you share
          </button>
          <button
            style={{
              fontSize: 12.5,
              padding: '8px 14px',
              color: 'var(--km-re)',
              border: '1px solid var(--km-re)',
              background: 'transparent',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
            onClick={onOpenDeleteData}
          >
            <Trash2 size={13} />
            Delete my health data
          </button>
        </div>
      </div>
    </div>
  );
}
