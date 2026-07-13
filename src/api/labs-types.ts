export interface Biomarker {
  id: string;
  name: string;
  category: string;
  code: string;
  slug: string;
  provider_id?: string;
  display_code?: string;
  junction_marker_id?: string;
  lab_id?: string;
  lab_slug?: string;
  lab_name?: string;
  lab_account_ids?: string[];
  marker_type?: string;
  units?: string;
  reference_range?: string;
  common_tat: string;
  worst_case_tat: string;
  labs?: string[];
  aoe_questions?: Array<{
    marker_id?: string;
    provider_id?: string;
    biomarker_id?: string;
    biomarker_name?: string;
    question_id: string;
    label: string;
    raw_label?: string;
    code: string;
    type: string;
    required: boolean;
    sequence?: number;
    constraint?: string | null;
    default?: string | null;
    answers?: Array<{ id: string; code: string; value: string }>;
    options: Array<{ code: string; value: string }>;
    is_fasting_duplicate?: boolean;
  }>;
  aoe_required_count?: number;
  aoe_optional_count?: number;
  loinc_map?: Array<{
    name: string;
    test_code: string;
    slug: string;
    required: boolean;
    loinc: string;
    loinc_name?: string;
    unit?: string;
  }>;
}

export interface CatalogLab {
  id: string;
  name: string;
  slug: string;
  catalog_item_count: number;
  orderable_item_count: number;
}

export interface CatalogItem {
  id: string;
  provider_id: string;
  source_item_id: string;
  slug: string;
  name: string;
  item_type: string;
  status: string;
  price: string;
  lab_id: string;
  lab_slug: string;
  lab_name: string;
  common_tat_days?: number | null;
  worst_case_tat_days?: number | null;
  has_aoe_required?: boolean;
  is_orderable?: boolean;
  marker_count?: number;
}

export interface CatalogItemDetail {
  id: string;
  provider_id: string;
  source_item_id: string;
  slug: string;
  name: string;
  item_type: string;
  status: string;
  price: string;
  sample_type?: string;
  collection_method?: string;
  fasting?: boolean;
  common_tat_days?: number | null;
  worst_case_tat_days?: number | null;
  is_orderable_summary?: boolean;
  lab?: { id: string; slug: string; name: string };
  markers?: Array<{
    id: string;
    provider_id: string;
    junction_id: string;
    name: string;
    slug: string;
    type: string;
    unit?: string;
    is_orderable?: boolean | null;
    a_la_carte_enabled?: boolean | null;
  }>;
  expected_results?: Array<{
    name: string;
    test_code: string;
    slug: string;
    required: boolean;
    loinc: string;
    loinc_name?: string;
    unit?: string;
  }>;
  aoe_summary?: { required: number; optional: number };
}

export type JunctionStatus =
  | "draft"
  | "pending_submission"
  | "pending_approval"
  | "active"
  | "inactive"
  | "failed"
  | "Pending"
  | "Active";

export interface LabPanel {
  id: string;
  name: string;
  description: string;
  lab_provider: string;
  biomarkers: Biomarker[];
  fasting_required: "yes" | "no";
  collection_method: "testkit" | "walk_in_test" | "at_home_phlebotomy" | "on_site_collection";
  cost_to_client: number;
  cost_to_welliemd: number;
  patient_price?: number;
  discounted_patient_price?: number | null;
  is_active: boolean;
  junction_status: JunctionStatus;
  junction_external_status?: string;
  junction_rejection_reason?: string;
  service_states: string[];
  junction_price?: number;
  sample_type?: string;
  turnaround_days?: string;
  vital_slug?: string;
  required?: "required" | "optional";
  aoe_required_count?: number;
  aoe_optional_count?: number;
  configuration_status?: "in_progress" | "complete";
  configuration_missing?: string[];
  is_assignable?: boolean;
}

export interface CreateLabPanelPayload {
  name: string;
  description: string;
  lab_provider: string;
  fasting_required: "yes" | "no";
  collection_method: "testkit" | "walk_in_test" | "at_home_phlebotomy" | "on_site_collection";
  cost_to_client: number;
  cost_to_welliemd: number;
  is_active: boolean;
  service_states: string[];
  catalog_item_ids: string[];
}

export interface CreateDraftLabPanelFromCatalogPayload {
  name: string;
  description: string;
  fasting_required: "yes" | "no";
  collection_method: "testkit" | "walk_in_test" | "at_home_phlebotomy" | "on_site_collection";
  catalog_item_ids: string[];
}

export interface ClientAssignment {
  id: string;
  name: string;
  email: string;
  assigned: boolean;
  assigned_at?: string | null;
  assignment_id?: string | null;
  is_current?: boolean;
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
  client_configuration_ready?: boolean;
  submission_ready?: boolean;
  blocking_reason?: string;
  patient_price_configured?: boolean;
  service_state_options?: string[];
  junction_provider_key?: string;
  junction_billing_type?: string;
  physician_ordering_mode?: "junction_network" | "own_physician" | "";
  provider_supported_states?: string[];
  provider_policy_revision?: number | null;
  provider_policy_source?: string;
}

export interface LabOrder {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone?: string;
  client_name: string;
  product_name: string;
  lab_provider: string;
  price: number;
  status: string;
  payment_status: string;
  visit_status: string;
  fulfillment_status?: string;
  lab_event?: string;
  lab_event_label?: string;
  ui_order_status?: string;
  ui_payment_status?: string;
  ui_fulfillment_status?: string;
  ui_lab_event?: string;
  ui_lab_event_label?: string;
  ui_lab_event_tone?: string;
  results_status?: string;
  junction_provider_key?: string;
  junction_billing_type?: string;
  junction_patient_state?: string;
  junction_policy_revision?: number | null;
  doctor_name?: string;
  tracking_number?: string;
  timeline: {
    ordered?: string;
    sample_collected?: string;
    results?: string;
  };
  resultsReady: boolean;
  biomarkers?: Array<{
    biomarker: string;
    result: string;
    units: string;
    reference_range: string;
    flag: "Normal" | "High" | "Low";
  }>;
}
