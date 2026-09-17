import { useEffect, useState } from 'react';
import { X, GripVertical } from 'lucide-react';

interface VitalsPriorityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (priorityList: string[]) => void;
  initialPriority: string[] | null;
}

const SOURCE_LABELS: Record<string, string> = {
  questionnaire: 'Clinical Intake (Questionnaire)',
  patient_portal: 'Manual Dashboard Logs',
  wearable: 'Smart Devices (Wearables)',
};

export default function VitalsPriorityModal({ open, onClose, onSave, initialPriority }: VitalsPriorityModalProps) {
  const [priority, setPriority] = useState<string[]>(['questionnaire', 'patient_portal', 'wearable']);

  useEffect(() => {
    if (open) {
      setPriority(initialPriority || ['questionnaire', 'patient_portal', 'wearable']);
    }
  }, [open, initialPriority]);

  if (!open) return null;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPriority = [...priority];
    const temp = newPriority[index - 1]!;
    newPriority[index - 1] = newPriority[index]!;
    newPriority[index] = temp;
    setPriority(newPriority);
  };

  const moveDown = (index: number) => {
    if (index === priority.length - 1) return;
    const newPriority = [...priority];
    const temp = newPriority[index + 1]!;
    newPriority[index + 1] = newPriority[index]!;
    newPriority[index] = temp;
    setPriority(newPriority);
  };

  const handleSave = () => {
    onSave(priority);
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
          maxWidth: 380,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Data Sources Priority</span>
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
          If you have multiple weight readings on the same day, which one should we show on your graph? 
          Rank your preferred sources from highest priority to lowest.
        </div>
        
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {priority.map((source, index) => (
            <div 
              key={source}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--km-s2)',
                border: '1px solid var(--km-b)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ color: 'var(--km-tm)', marginRight: 10 }}>
                <GripVertical size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--km-t)' }}>
                  {index + 1}. {SOURCE_LABELS[source] || source}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button 
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  style={{ 
                    background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', 
                    fontSize: 16, color: index === 0 ? 'var(--km-s3)' : 'var(--km-ac)', lineHeight: 1, padding: '0 4px'
                  }}
                >
                  ▲
                </button>
                <button 
                  onClick={() => moveDown(index)}
                  disabled={index === priority.length - 1}
                  style={{ 
                    background: 'none', border: 'none', cursor: index === priority.length - 1 ? 'default' : 'pointer', 
                    fontSize: 16, color: index === priority.length - 1 ? 'var(--km-s3)' : 'var(--km-ac)', lineHeight: 1, padding: '0 4px'
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
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
              background: 'var(--km-ac)',
              color: '#fff',
              border: `1px solid var(--km-ac)`,
              cursor: 'pointer',
            }}
            onClick={handleSave}
          >
            Save Priority
          </button>
        </div>
      </div>
    </div>
  );
}
