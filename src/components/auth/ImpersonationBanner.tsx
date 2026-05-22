import { LogOut, Eye } from 'lucide-react';
import { useAuth } from '@/features/auth';

export const ImpersonationBanner = () => {
  const { isImpersonated, user, endImpersonation } = useAuth();

  if (!isImpersonated) {
    return null;
  }

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'Patient';

  const handleEndImpersonation = async () => {
    await endImpersonation();
    window.close();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        zIndex: 10000,
        background: 'var(--km-ac, #4f8ef7)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontFamily: "'Outfit', sans-serif",
      }}
      data-impersonation-banner
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            background: 'rgba(0,0,0,0.25)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 10,
            letterSpacing: '0.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Eye size={11} />
          Viewing as Patient
        </span>
        <span style={{ opacity: 0.85, fontWeight: 400, fontSize: 12 }}>
          {displayName}
        </span>
        <span style={{ fontSize: 11, opacity: 0.65, fontWeight: 400, fontStyle: 'italic' }}>
          Read-only Session
        </span>
      </div>
      <button
        onClick={handleEndImpersonation}
        style={{
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '6px 14px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          transition: 'background 0.2s',
        }}
        aria-label="End impersonation"
      >
        <LogOut size={13} />
        Exit Session
      </button>
    </div>
  );
};
