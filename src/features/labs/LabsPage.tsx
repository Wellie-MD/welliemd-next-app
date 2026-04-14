import { useState, useEffect } from 'react';
import { TestTube, Calendar, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getLabResults, getLabSubmissions, type LabResult, type LabSubmission } from './api';

function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}

function getSubmissionStatusIcon(status: string | null) {
    switch (status?.toLowerCase()) {
        case 'completed':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'submitted':
            return <Clock className="h-4 w-4 text-blue-500" />;
        case 'pending':
            return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        case 'failed':
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return <Clock className="h-4 w-4 text-gray-500" />;
    }
}

interface LabResultCardProps {
    result: LabResult;
    isExpanded: boolean;
    onToggle: () => void;
}

function LabResultCard({ result, isExpanded, onToggle }: LabResultCardProps) {
    return (
        <div className="km-card km-fade" style={{ marginBottom: 16 }}>
            <div style={{ padding: 14 }}>
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={onToggle}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 8, background: 'var(--km-s2)', borderRadius: 8, flexShrink: 0, border: '1px solid var(--km-b)' }}>
                            <TestTube size={18} style={{ color: 'var(--km-t)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)' }}>{result.test_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                                {result.sample_source || 'Sample type N/A'} • {formatDate(result.screening_date)}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-ac)' }}>{result.test_result} {result.test_result_units}</div>
                            {result.reference_range && (
                                <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>Ref: {result.reference_range}</div>
                            )}
                        </div>
                        {isExpanded ? (
                            <ChevronUp size={18} style={{ color: 'var(--km-tm)' }} />
                        ) : (
                            <ChevronDown size={18} style={{ color: 'var(--km-tm)' }} />
                        )}
                    </div>
                </div>
                
                {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--km-b)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Date</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(result.report_date)}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sample Source</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.sample_source || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Test to Treat</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.test_to_treat ? 'Yes' : 'No'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submission Status</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.submission_status || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface SubmissionCardProps {
    submission: LabSubmission;
    isExpanded: boolean;
    onToggle: () => void;
}

function SubmissionCard({ submission, isExpanded, onToggle }: SubmissionCardProps) {
    return (
        <div className="km-card km-fade" style={{ marginBottom: 16 }}>
            <div style={{ padding: 14 }}>
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={onToggle}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 8, background: 'var(--km-pup)', borderRadius: 8, flexShrink: 0, border: '1px solid rgba(167,139,250,0.2)' }}>
                            <Calendar size={18} style={{ color: 'var(--km-pu)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)' }}>
                                Lab Submission {submission.id.slice(0, 8)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                                {submission.lab_results.length} result{submission.lab_results.length !== 1 ? 's' : ''} • {formatDate(submission.created_at)}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {getSubmissionStatusIcon(submission.submission_status)}
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{submission.submission_status || 'Unknown'}</span>
                        </div>
                        {isExpanded ? (
                            <ChevronUp size={18} style={{ color: 'var(--km-tm)' }} />
                        ) : (
                            <ChevronDown size={18} style={{ color: 'var(--km-tm)' }} />
                        )}
                    </div>
                </div>
                
                {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--km-b)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Test to Treat</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{submission.test_to_treat ? 'Yes' : 'No'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Master ID</div>
                                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{submission.master_id || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beluga Visit ID</div>
                                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{submission.beluga_visit_id || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted At</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(submission.submitted_at)}</div>
                            </div>
                        </div>
                        
                        {submission.lab_results.length > 0 && (
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Lab Results</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {submission.lab_results.map((result) => (
                                        <div key={result.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--km-s2)', borderRadius: 8, border: '1px solid var(--km-b)' }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{result.test_name}</span>
                                            <span style={{ fontSize: 13 }}>{result.test_result} {result.test_result_units}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {submission.error_details && (
                            <div className="km-vbox km-vbox-red" style={{ marginTop: 12 }}>
                                <AlertCircle size={14} style={{ color: 'var(--km-re)', flexShrink: 0, marginTop: 1 }} />
                                <div style={{ fontSize: 12, color: 'var(--km-re)' }}>{submission.error_details}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LabsPage() {
    const [labResults, setLabResults] = useState<LabResult[]>([]);
    const [labSubmissions, setLabSubmissions] = useState<LabSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'results' | 'submissions'>('results');
    const [expandedResult, setExpandedResult] = useState<string | null>(null);
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError(null);
            
            const [results, submissions] = await Promise.all([
                getLabResults(),
                getLabSubmissions(),
            ]);
            
            setLabResults(results);
            setLabSubmissions(submissions);
        } catch (err) {
            console.error('Error loading lab data:', err);
            setError('Failed to load lab data. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const filteredResults = labResults.filter(result =>
        result.test_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSubmissions = labSubmissions.filter(submission =>
        submission.lab_results.some(r => 
            r.test_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const toggleResult = (id: string) => {
        setExpandedResult(expandedResult === id ? null : id);
    };

    const toggleSubmission = (id: string) => {
        setExpandedSubmission(expandedSubmission === id ? null : id);
    };

    if (loading) {
        return (
            <div className="pg" id="pg-labs">
                <p className="km-page-title km-fade">Labs</p>
                <p className="km-page-sub km-fade">View your lab results and submissions</p>
                <div className="km-card km-fade" style={{ padding: 14 }}>
                    <div className="km-skel" style={{ width: '30%', height: 20, marginBottom: 12 }}></div>
                    <div className="km-skel" style={{ width: '100%', height: 40, marginBottom: 12 }}></div>
                    <div className="km-skel" style={{ width: '100%', height: 40 }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pg" id="pg-labs">
                <p className="km-page-title km-fade">Labs</p>
                <p className="km-page-sub km-fade">View your lab results and submissions</p>
                <div className="km-vbox km-vbox-red km-fade">
                    <AlertCircle size={14} style={{ color: 'var(--km-re)', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--km-t)', fontWeight: 600, marginBottom: 2 }}>Error Loading Labs</div>
                        <div style={{ color: 'var(--km-tm)' }}>{error}</div>
                        <button className="km-btn km-btn-outline" style={{ marginTop: 8, fontSize: 11, padding: '5px 12px' }} onClick={loadData}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pg" id="pg-labs">
            <p className="km-page-title km-fade">Labs</p>
            <p className="km-page-sub km-fade">View your lab results and submissions</p>
            
            <div className="km-swrap km-fade" style={{ marginBottom: 14 }}>
                <Search size={16} />
                <input
                    className="km-sinp"
                    placeholder="Search lab results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="km-tabs km-fade" style={{ marginBottom: 16 }}>
                <button 
                    className={`km-tab ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                >
                    Lab Results ({filteredResults.length})
                </button>
                <button 
                    className={`km-tab ${activeTab === 'submissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('submissions')}
                >
                    Submissions ({filteredSubmissions.length})
                </button>
            </div>

            {activeTab === 'results' && (
                <div className="km-fade">
                    {filteredResults.length > 0 ? (
                        filteredResults.map((result) => (
                            <LabResultCard
                                key={result.id}
                                result={result}
                                isExpanded={expandedResult === result.id}
                                onToggle={() => toggleResult(result.id)}
                            />
                        ))
                    ) : (
                        <div className="km-sc">
                            <div className="km-empty">
                                <div className="km-eic">
                                    <TestTube size={20} />
                                </div>
                                <div className="km-et">No lab results</div>
                                <div className="km-es">
                                    {searchTerm 
                                        ? 'No results match your search criteria.' 
                                        : "You don't have any lab results yet."}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'submissions' && (
                <div className="km-fade">
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => (
                            <SubmissionCard
                                key={submission.id}
                                submission={submission}
                                isExpanded={expandedSubmission === submission.id}
                                onToggle={() => toggleSubmission(submission.id)}
                            />
                        ))
                    ) : (
                        <div className="km-sc">
                            <div className="km-empty">
                                <div className="km-eic">
                                    <Calendar size={20} />
                                </div>
                                <div className="km-et">No lab submissions</div>
                                <div className="km-es">
                                    {searchTerm 
                                        ? 'No submissions match your search criteria.' 
                                        : "You don't have any lab submissions yet."}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export { LabsPage };
