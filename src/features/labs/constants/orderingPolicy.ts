export const ORDERING_MODE_LABELS = {
  junction_network: "Junction physician network",
  own_physician: "WellieMD physician/account",
} as const;

export const BILLING_TYPE_LABELS: Record<string, string> = {
  client_bill: "Client billing",
  patient_bill_passthrough: "Client billing via BioReference passthrough",
};
