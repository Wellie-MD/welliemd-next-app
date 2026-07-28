/**
 * Labs feature — public barrel exports.
 *
 * Folder structure:
 *   api/
 *     index.ts      — re-exports types + endpoint functions
 *     types.ts      — TypeScript interfaces
 *     endpoints.ts  — real API calls
 *   utils/
 *     index.ts      — re-exports formatters, timeline, types
 *     types.ts      — UI-layer types (TimelineItem, GroupedLabPanel, etc.)
 *     formatters.ts — formatDate
 *     timeline.ts   — normalizeTimeline
 *   LabsPage.tsx    — page component
 */

// API contracts + endpoint functions
export {
    getLabResults,
    getLabSubmissions,
    getPatientLabResults,
    getStandaloneLabSubmissions,
    getStandaloneLabResults,
    downloadStandaloneLabResultPdf,
    downloadStandaloneLabRequisitionPdf,
} from './api/index';
export type {
    LabResult,
    LabSubmission,
    PatientMedication,
    PaginatedResponse,
    StandaloneLabResult,
    StandaloneLabResultRow,
    StandaloneLabSubmission,
} from './api/index';

// UI utilities
export { formatDate, normalizeTimeline } from './utils/index';
export type { TimelineItem, TimelineAction, GroupedLabPanel } from './utils/index';

// Page component
export { default as LabsPage } from './LabsPage';
