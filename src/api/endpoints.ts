export const JUNCTION_ENDPOINTS = {
  base: (clientId: string) => `clients/${clientId}/integrations/junction`,
  wearablesProviders: 'wearables/providers/',
  wearablesProvidersSync: 'wearables/providers/sync/',
  wearablesSettings: 'wearables/settings/current/',
  provision: (clientId: string) => `clients/${clientId}/integrations/junction/provision/`,
  syncTenant: (clientId: string) => `clients/${clientId}/integrations/junction/sync-tenant/`,
  ensureKey: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/api-keys/${environment}/ensure/`,
  rotateKey: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/api-keys/${environment}/rotate/`,
  ensureWebhook: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/webhooks/${environment}/ensure/`,
  ensureSense: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/sense/${environment}/ensure/`,
  senseAccess: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/sense/${environment}/access-granted/`,
  senseQueries: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/sense/${environment}/queries/`,
  senseQuery: (clientId: string, environment: string, queryId: string) => `clients/${clientId}/integrations/junction/sense/${environment}/queries/${queryId}/`,
  prepareEnvironment: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/environments/${environment}/prepare/`,
  switchEnvironment: (clientId: string, environment: string) => `clients/${clientId}/integrations/junction/environments/${environment}/switch/`,
  labAccounts: (clientId: string) => `clients/${clientId}/integrations/junction/lab-accounts/`,
  linkLabAccount: (clientId: string, id: string) => `clients/${clientId}/integrations/junction/lab-accounts/${id}/link/`,
  unlinkLabAccount: (clientId: string, id: string) => `clients/${clientId}/integrations/junction/lab-accounts/${id}/unlink/`,
} as const;

export const TREATMENT_ASSIGNMENT_ENDPOINTS = {
  preflight: "/treatments/assignment/preflight/",
  operations: "/treatments/assignment/operations/",
  operation: (operationId: string) =>
    `/treatments/assignment/operations/${operationId}/`,
  retry: (operationId: string) =>
    `/treatments/assignment/operations/${operationId}/retry/`,
  cancel: (operationId: string) =>
    `/treatments/assignment/operations/${operationId}/cancel/`,
} as const;

export const TREATMENT_PROGRAM_ENDPOINTS = {
  collection: "treatments/programs/",
  detail: (programId: string) => `treatments/programs/${programId}/`,
  slug: (programId: string) => `treatments/programs/${programId}/slug/`,
  live: (programId: string) => `treatments/programs/${programId}/live/`,
  archive: (programId: string) => `treatments/programs/${programId}/archive/`,
  restore: (programId: string) => `treatments/programs/${programId}/restore/`,
  duplicate: (programId: string) => `treatments/programs/${programId}/duplicate/`,
  questions: (programId: string) => `treatments/programs/${programId}/questions/`,
  effectiveContent: (programId: string) => `treatments/programs/${programId}/effective-content/`,
} as const;
