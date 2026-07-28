export const visitLabEndpoints = {
  results: '/medical/lab-results/',
  submissions: '/medical/lab-submissions/',
  resultsByPatient: (patientId: string) => `/medical/lab-results/?patient_id=${patientId}`,
};

export const patientStandaloneLabEndpoints = {
  submissions: '/patient/labs/submissions/',
  results: '/patient/labs/results/',
  resultPdf: (orderId: string) => `/patient/labs/results/${orderId}/pdf/`,
  requisitionPdf: (orderId: string) => `/patient/labs/results/${orderId}/requisition/`,
  collectionInstructionsPdf: (orderId: string) => `/patient/labs/results/${orderId}/collection-instructions/`,
};
