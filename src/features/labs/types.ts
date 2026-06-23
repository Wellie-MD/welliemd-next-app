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
