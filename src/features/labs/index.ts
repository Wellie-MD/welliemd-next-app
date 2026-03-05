/**
 * Labs feature exports.
 */
export { LabsPage } from './LabsPage';
export { 
    getLabResults, 
    getLabSubmissions, 
    getPatientLabResults 
} from './api';
export type { 
    LabResult, 
    LabSubmission, 
    PatientMedication,
    LabResultsResponse,
    LabSubmissionsResponse 
} from './api';
