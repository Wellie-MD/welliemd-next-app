import { useState, useEffect } from 'react';
import { TestTube, Calendar, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function getStatusIndicatorColor(indicator: string | null): string {
    switch (indicator?.toUpperCase()) {
        case 'H':
            return 'bg-red-100 text-red-800';
        case 'L':
            return 'bg-yellow-100 text-yellow-800';
        case 'N':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusIndicatorLabel(indicator: string | null): string {
    switch (indicator?.toUpperCase()) {
        case 'H':
            return 'High';
        case 'L':
            return 'Low';
        case 'N':
            return 'Normal';
        default:
            return 'N/A';
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

function getSubmissionStatusColor(status: string | null): string {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'submitted':
            return 'bg-blue-100 text-blue-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

interface LabResultCardProps {
    result: LabResult;
    isExpanded: boolean;
    onToggle: () => void;
}

function LabResultCard({ result, isExpanded, onToggle }: LabResultCardProps) {
    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={onToggle}
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <TestTube className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{result.test_name}</h3>
                            <p className="text-sm text-gray-500">
                                {result.sample_source || 'Sample type N/A'} • {formatDate(result.screening_date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <p className="font-semibold text-gray-900">{result.test_result} {result.test_result_units}</p>
                            {result.reference_range && (
                                <p className="text-xs text-gray-500">Ref: {result.reference_range}</p>
                            )}
                        </div>
                        {result.status_indicator && (
                            <Badge className={getStatusIndicatorColor(result.status_indicator)}>
                                {getStatusIndicatorLabel(result.status_indicator)}
                            </Badge>
                        )}
                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                </div>
                
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Report Date</p>
                                <p className="font-medium">{formatDate(result.report_date)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Sample Source</p>
                                <p className="font-medium">{result.sample_source || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Test to Treat</p>
                                <p className="font-medium">{result.test_to_treat ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Submission Status</p>
                                <p className="font-medium">{result.submission_status || 'Not submitted'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface SubmissionCardProps {
    submission: LabSubmission;
    isExpanded: boolean;
    onToggle: () => void;
}

function SubmissionCard({ submission, isExpanded, onToggle }: SubmissionCardProps) {
    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={onToggle}
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Lab Submission {submission.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {submission.lab_results.length} result{submission.lab_results.length !== 1 ? 's' : ''} • {formatDate(submission.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            {getSubmissionStatusIcon(submission.submission_status)}
                            <Badge className={getSubmissionStatusColor(submission.submission_status)}>
                                {submission.submission_status || 'Unknown'}
                            </Badge>
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                </div>
                
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Test to Treat</p>
                                    <p className="font-medium">{submission.test_to_treat ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Master ID</p>
                                    <p className="font-medium font-mono text-xs">{submission.master_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Beluga Visit ID</p>
                                    <p className="font-medium font-mono text-xs">{submission.beluga_visit_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Submitted At</p>
                                    <p className="font-medium">{formatDate(submission.submitted_at)}</p>
                                </div>
                            </div>
                            
                            {submission.lab_results.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Lab Results</h4>
                                    <div className="space-y-2">
                                        {submission.lab_results.map((result) => (
                                            <div key={result.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm font-medium">{result.test_name}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm">{result.test_result} {result.test_result_units}</span>
                                                    {result.status_indicator && (
                                                        <Badge className={getStatusIndicatorColor(result.status_indicator)}>
                                                            {getStatusIndicatorLabel(result.status_indicator)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {submission.error_details && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">{submission.error_details}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function LabsPage() {
    const [labResults, setLabResults] = useState<LabResult[]>([]);
    const [labSubmissions, setLabSubmissions] = useState<LabSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
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
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Labs</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={loadData}>Try Again</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Labs</h1>
                    <p className="text-muted-foreground">View your lab results and submissions</p>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search lab results..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="results" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="results">
                        Lab Results ({filteredResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="submissions">
                        Submissions ({filteredSubmissions.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-4">
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
                        <Card>
                            <CardContent className="p-12 text-center">
                                <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No lab results available</h3>
                                <p className="text-gray-600">
                                    {searchTerm 
                                        ? 'No results match your search criteria.' 
                                        : "You don't have any lab results yet."}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="submissions" className="space-y-4">
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
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No lab submissions</h3>
                                <p className="text-gray-600">
                                    {searchTerm 
                                        ? 'No submissions match your search criteria.' 
                                        : "You don't have any lab submissions yet."}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export { LabsPage };
