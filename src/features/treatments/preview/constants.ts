export const QUESTIONNAIRE_PREVIEW_DEFAULTS = Object.freeze({
  appBaseUrl: "http://localhost:3001",
  apiBaseUrl: "http://localhost:8000/api/v1",
  modalMaxHeightPx: 780,
  modalWidthPx: 640,
  protocolVersion: 1,
  identitySwitchTimeoutMs: 15000,
});

export const QUESTIONNAIRE_PREVIEW_API = Object.freeze({
  issueCapability: "treatments/preview-capabilities/",
});

export const QUESTIONNAIRE_PREVIEW_FRAGMENT = Object.freeze({
  capability: "preview_capability",
  snapshotChecksum: "preview_snapshot_checksum",
  snapshotId: "preview_snapshot_id",
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
  identity: "welliemd:preview:identity",
  identityReady: "welliemd:preview:identity-ready",
  identityState: "welliemd:preview:identity-state",
  refresh: "welliemd:preview:refresh",
});

export type QuestionnairePreviewIdentity =
  (typeof QUESTIONNAIRE_PREVIEW_IDENTITY)[keyof typeof QUESTIONNAIRE_PREVIEW_IDENTITY];
