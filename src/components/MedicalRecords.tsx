import { useState } from "react";
import { FileText, Download, Eye, Upload, Search, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MedicalRecord {
  id: number;
  title: string;
  type: string;
  date: string;
  doctor: string;
  size: string;
  description?: string;
  category: 'imaging' | 'reports' | 'prescriptions' | 'other';
}

export default function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records] = useState<MedicalRecord[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRecordsByCategory = (category: string) => {
    if (category === 'all') return filteredRecords;
    return filteredRecords.filter(record => record.category === category);
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':   return 'km-badge km-badge-red';
      case 'dicom': return 'km-badge km-badge-blue';
      case 'jpg':
      case 'png':   return 'km-badge km-badge-green';
      default:      return 'km-badge km-badge-gray';
    }
  };

  const RecordCard = ({ record }: { record: MedicalRecord }) => (
    <div className="km-sc km-fade" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--km-s3)', color: 'var(--km-tm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--km-b)' }}>
          <FileText size={22} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--km-t)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.title}
            </div>
            <span className={getTypeBadge(record.type)}>{record.type}</span>
          </div>
          <p className="km-fade" style={{ fontSize: 12, color: 'var(--km-tm)', marginBottom: 10, lineHeight: 1.4 }}>
            {record.description || 'Medical documentation provided by your care team.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--km-tm)', fontWeight: 600, fontFamily: 'monospace' }}>
            <span>{record.date}</span>
            <span style={{ color: 'var(--km-td)' }}>·</span>
            <span>{record.doctor}</span>
            <span style={{ color: 'var(--km-td)' }}>·</span>
            <span>{record.size}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="km-btn km-btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
          <Eye size={13} /> View
        </button>
        <button className="km-btn km-btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
          <Download size={13} /> Download
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'imaging', label: 'Imaging' },
    { id: 'reports', label: 'Reports' },
    { id: 'prescriptions', label: 'Prescriptions' },
  ];

  return (
    <div className="pg">
      <div className="km-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="km-page-title">Medical Records</h1>
          <p className="km-page-sub">Your protected health information and documents</p>
        </div>
        <button className="km-btn km-btn-ghost" style={{ padding: '6px' }}>
          <Upload size={16} />
        </button>
      </div>

      <div className="km-swrap km-fade" style={{ marginBottom: 14 }}>
        <Search size={16} />
        <input
          className="km-sinp"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="km-tabs km-fade" style={{ marginBottom: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`km-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} ({getRecordsByCategory(tab.id).length})
          </button>
        ))}
      </div>

      <div className="km-fade">
        {getRecordsByCategory(activeTab).length > 0 ? (
          getRecordsByCategory(activeTab).map((record) => (
            <RecordCard key={record.id} record={record} />
          ))
        ) : (
          <div className="km-sc">
            <div className="km-empty" style={{ padding: '36px 18px' }}>
              <div className="km-eic">
                <FileText size={20} />
              </div>
              <div className="km-et">No records found</div>
              <div className="km-es">
                {searchTerm ? 'Try a different search term.' : `You don't have any ${activeTab !== 'all' ? activeTab : ''} records yet.`}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="km-fade" style={{ marginTop: 20 }}>
        <button 
          className="km-btn km-btn-primary" 
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => navigate('/dashboard/labs')}
        >
          <TestTube size={14} /> View Lab Results
        </button>
      </div>
    </div>
  );
}
