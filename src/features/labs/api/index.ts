/**
 * Labs API package — public re-exports.
 *
 * Internal structure:
 *   types.ts     — TypeScript interfaces matching Django serializer output
 *   endpoints.ts — Real API calls (apiClient-backed)
 */
export type {
    LabResult,
    LabSubmission,
    PatientMedication,
    PaginatedResponse,
    StandaloneLabResult,
    StandaloneLabResultRow,
    StandaloneLabSubmission,
} from './types';

export {
    getLabResults,
    getLabSubmissions,
    getPatientLabResults,
    getStandaloneLabSubmissions,
    getStandaloneLabResults,
    downloadStandaloneLabResultPdf,
    downloadStandaloneLabRequisitionPdf,
} from './endpoints';
