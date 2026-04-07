import { useState } from "react";
import { Pill, RefreshCw, CheckCircle, Search } from "lucide-react";

interface Prescription {
  id: number;
  medication: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  quantity: number;
  refillsRemaining: number;
  prescribedBy: string;
  prescribedDate: string;
  expiryDate: string;
  instructions: string;
  status: 'active' | 'expired' | 'discontinued' | 'pending';
  category: 'chronic' | 'acute' | 'preventive';
  sideEffects?: string[];
  refillRequestDate?: string;
}

export default function Prescriptions() {
  const [prescriptions] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  const activePrescriptions = prescriptions.filter(p => 
    p.status === 'active' && 
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const expiredPrescriptions = prescriptions.filter(p => 
    (p.status === 'expired' || p.status === 'discontinued') &&
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':       return 'km-badge km-badge-green';
      case 'expired':      return 'km-badge km-badge-red';
      case 'discontinued': return 'km-badge km-badge-gray';
      case 'pending':      return 'km-badge km-badge-amber';
      default:             return 'km-badge km-badge-gray';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'chronic':    return 'km-badge km-badge-blue';
      case 'acute':      return 'km-badge km-badge-orange';
      case 'preventive': return 'km-badge km-badge-purple';
      default:           return 'km-badge km-badge-gray';
    }
  };

  const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => (
    <div className="km-sc km-fade" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--km-acp)', color: 'var(--km-ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--km-b)' }}>
          <Pill size={22} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--km-t)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {prescription.medication}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <span className={getStatusBadge(prescription.status)}>{prescription.status}</span>
              <span className={getCategoryBadge(prescription.category)}>{prescription.category}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 500 }}>
            {prescription.genericName || 'Prescription medication'}
          </div>
        </div>
      </div>

      <div className="km-info-grid" style={{ marginBottom: 14 }}>
        <div className="km-info-box">
          <div className="km-info-label">Dosage</div>
          <div className="km-info-value">{prescription.dosage}</div>
        </div>
        <div className="km-info-box">
          <div className="km-info-label">Frequency</div>
          <div className="km-info-value">{prescription.frequency}</div>
        </div>
        <div className="km-info-box">
          <div className="km-info-label">Prescribed By</div>
          <div className="km-info-value">{prescription.prescribedBy}</div>
        </div>
        <div className="km-info-box">
          <div className="km-info-label">Expires</div>
          <div className="km-info-value" style={{ fontFamily: 'monospace', fontSize: 11 }}>{prescription.expiryDate}</div>
        </div>
      </div>

      <div className="km-vbox km-vbox-blue" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--km-tm)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--km-t)' }}>Instructions:</strong> {prescription.instructions}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 600 }}>
          Refills remaining: <span style={{ color: prescription.refillsRemaining <= 1 ? 'var(--km-am)' : 'var(--km-t)' }}>{prescription.refillsRemaining}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {prescription.status === 'active' && prescription.refillsRemaining > 0 && (
            <button className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
              <RefreshCw size={12} /> Refill
            </button>
          )}
          <button className="km-btn km-btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }}>
            Details
          </button>
        </div>
      </div>

      {prescription.refillRequestDate && (
        <div className="km-vbox km-vbox-green" style={{ marginTop: 14 }}>
          <CheckCircle size={14} style={{ color: 'var(--km-gr)' }} />
          <div style={{ fontSize: 12, color: 'var(--km-gr)', fontWeight: 500 }}>
            Refill requested on {prescription.refillRequestDate}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="pg">
      <div className="km-fade" style={{ marginBottom: 20 }}>
        <h1 className="km-page-title">Prescriptions</h1>
        <p className="km-page-sub">Manage your active medications and history</p>
      </div>

      <div className="km-swrap km-fade" style={{ marginBottom: 14 }}>
        <Search size={16} />
        <input
          className="km-sinp"
          placeholder="Search prescriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="km-tabs km-fade" style={{ marginBottom: 16 }}>
        <button 
          className={`km-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activePrescriptions.length})
        </button>
        <button 
          className={`km-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({expiredPrescriptions.length})
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="km-fade">
          {activePrescriptions.length > 0 ? (
            activePrescriptions.map((p) => <PrescriptionCard key={p.id} prescription={p} />)
          ) : (
            <div className="km-sc">
              <div className="km-empty">
                <div className="km-eic"><Pill size={20} /></div>
                <div className="km-et">No active prescriptions</div>
                <div className="km-es">You don't have any active medications at this time.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="km-fade">
          {expiredPrescriptions.length > 0 ? (
            expiredPrescriptions.map((p) => <PrescriptionCard key={p.id} prescription={p} />)
          ) : (
            <div className="km-sc">
              <div className="km-empty">
                <div className="km-eic"><Pill size={20} /></div>
                <div className="km-et">No history found</div>
                <div className="km-es">Your past prescriptions will appear here.</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="km-fade" style={{ marginTop: 20 }}>
        <button className="km-btn km-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Request New Prescription
        </button>
      </div>
    </div>
  );
}
