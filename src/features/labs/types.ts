/**
 * Shared types for the admin Labs feature.
 * Imported by page, modals, and table components.
 */

export const STATES_LIST = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY",
] as const;

export const COLLECTION_METHOD_OPTIONS = [
  { value: "at_home_phlebotomy", label: "At-home phlebotomy" },
  { value: "walk_in_test", label: "Walk-in test" },
  { value: "testkit", label: "Test kit" },
  { value: "on_site_collection", label: "On-site collection" },
] as const;

export type CollectionMethodKey = typeof COLLECTION_METHOD_OPTIONS[number]["value"];

/** An item in the left pane of the Assign to Clients modal. */
export interface AssignItem {
  id: string;
  name: string;
  sub: string;
  checked: boolean;
}

/** A client row in the right pane of the Assign to Clients modal. */
export interface AssignClient {
  id: string;
  name: string;
  email: string;
  checked: boolean;
  assignment_id?: string | null;
  junction_lab_test_id?: string;
  junction_status?: string;
  junction_external_status?: string;
  operational_status?: string;
  is_orderable?: boolean;
  lab_account_id?: string;
  lab_account_state?: string;
  lab_account_options?: Array<{
    lab_account_id: string;
    lab: string;
    account_name?: string;
    status?: string;
    delegated_flow?: string;
    provider_account_id?: string;
    is_orderable?: boolean;
  }>;
  linkedLabAccountIds?: string[];
}

/** Shape used by the Create panel form. */
export interface CreateFormState {
  name: string;
  description: string;
  lab_provider: string;
  lab_provider_id: string;
  fasting_required: "yes" | "no";
  collection_method: "at_home_phlebotomy" | "on_site_collection" | "walk_in_test" | "testkit";
  cost_to_client: number;
  cost_to_welliemd: number;
  is_active: boolean;
  service_states: string[];
  biomarkers: string[];
}

export const INITIAL_CREATE_FORM: CreateFormState = {
  name: "",
  description: "",
  lab_provider: "",
  lab_provider_id: "",
  fasting_required: "yes",
  collection_method: "at_home_phlebotomy",
  cost_to_client: 0,
  cost_to_welliemd: 0,
  is_active: true,
  service_states: [],
  biomarkers: [],
};

// ---------------------------------------------------------------------------
// Combined panel types
// ---------------------------------------------------------------------------

/** One method-leg of a combined panel. */
export interface CombinedPanelMember {
  id: string;
  panel_id: string;
  panel_name: string;
  collection_method: CollectionMethodKey;
  junction_status: string;
  junction_lab_test_id: string;
  lab_provider: string;
  is_orderable: boolean;
  patient_price: { amount: string; currency: string };
  display_order: number;
}

/** Combined panel derived status (computed per client, never stored globally). */
export type CombinedDerivedStatus = "ready" | "degraded" | "unavailable" | "needs_attention" | "archived";

/** Combined lab panel as returned by the admin API. */
export interface CombinedLabPanel {
  id: string;
  name: string;
  description: string;
  category: string;
  is_combined: true;
  derived_status: CombinedDerivedStatus;
  members: CombinedPanelMember[];
  cost_to_client: { amount: string; currency: string };
  cost_to_welliemd: { amount: string; currency: string };
  patient_price: { amount: string; currency: string };
  discounted_patient_price: { amount: string; currency: string } | null;
  is_active: boolean;
  is_archived: boolean;
  service_states: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

/** One row per method in the Create Combined form. */
export interface CombinedMethodRow {
  method: CollectionMethodKey;
  label: string;
  checked: boolean;
  /** ID of the selected single-method LabPanel for this method slot. */
  selectedPanelId: string;
}

export const INITIAL_COMBINED_METHODS: CombinedMethodRow[] = [
  { method: "at_home_phlebotomy", label: "At-home phlebotomy", checked: false, selectedPanelId: "" },
  { method: "walk_in_test",       label: "Walk-in test",        checked: false, selectedPanelId: "" },
  { method: "testkit",            label: "Test kit",            checked: false, selectedPanelId: "" },
  { method: "on_site_collection", label: "On-site collection",  checked: false, selectedPanelId: "" },
];
