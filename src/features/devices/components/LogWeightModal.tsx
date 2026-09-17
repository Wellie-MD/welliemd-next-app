import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface LogWeightModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (value: number) => void;
}

export default function LogWeightModal({ open, onClose, onSave }: LogWeightModalProps) {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (open) setInput('');
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const v = parseFloat(input);
    if (v && v > 0) onSave(v);
    onClose();
  };

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
          maxWidth: 360,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Log your weight</span>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--km-tm)',
            }}
            onClick={onClose}
          >
            <X size={17} />
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--km-tm)', lineHeight: 1.5, marginBottom: 16 }}>
          Add today's weight. This updates your progress and is shared with your care team.
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--km-t2)', marginBottom: 6, display: 'block' }}>
            Weight (lb)
          </label>
          <input
            className="km-inp"
            type="number"
            min={50}
            step={0.1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            onClick={onClose}
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
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
