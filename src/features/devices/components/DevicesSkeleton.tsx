export default function DevicesSkeleton() {
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

  return <div>{row}{row}</div>;
}
