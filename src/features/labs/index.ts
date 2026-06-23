/**
 * Labs feature exports.
 */
export { LabsPage } from './LabsPage';
export { 
    getLabResults, 
    getLabSubmissions, 
    getPatientLabResults,
    getStandaloneLabSubmissions,
    getStandaloneLabResults,
    downloadStandaloneLabResultPdf,
} from './api';
export type { 
    LabResult, 
    LabSubmission, 
    PatientMedication,
    StandaloneLabResult,
    StandaloneLabResultRow,
    StandaloneLabSubmission,
} from './api';
