export const QUESTIONNAIRE_PREVIEW_DEFAULTS = Object.freeze({
  appBaseUrl: "http://localhost:3001",
  apiBaseUrl: "http://localhost:8000/api/v1",
  modalWidthPx: 512,
  protocolVersion: 1,
});

export const QUESTIONNAIRE_PREVIEW_IDENTITY = Object.freeze({
  newPatient: "new_patient",
  existingPatient: "existing_patient",
});

export const QUESTIONNAIRE_PREVIEW_MESSAGE = Object.freeze({
  ready: "welliemd:preview:ready",
  resize: "welliemd:preview:resize",
  navigation: "welliemd:preview:navigation",
  close: "welliemd:preview:close",
  error: "welliemd:preview:error",
  refresh: "welliemd:preview:refresh",
});

export type QuestionnairePreviewIdentity =
  (typeof QUESTIONNAIRE_PREVIEW_IDENTITY)[keyof typeof QUESTIONNAIRE_PREVIEW_IDENTITY];
