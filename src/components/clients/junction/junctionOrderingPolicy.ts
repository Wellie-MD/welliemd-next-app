export const JUNCTION_ORDERING_MODE_LABELS = {
  junction_network: "Junction physician network",
  own_physician: "WellieMD physician/account",
} as const

export const JUNCTION_NETWORK_POLICY_SUMMARY = [
  "BioReference: NY and NJ only, patient_bill_passthrough.",
  "Quest and Labcorp: states outside NY, NJ, and RI, client_bill.",
  "Rhode Island: unavailable under the current Junction physician-network matrix.",
] as const
