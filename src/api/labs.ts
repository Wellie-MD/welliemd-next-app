/**
 * Mock Lab Management API for Admin Portal
 */

export interface Biomarker {
  id: string;
  name: string;
  category: string;
  code: string;
  slug: string;
  common_tat: string;
  worst_case_tat: string;
  labs?: string[];
}

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
  is_active: boolean;
  junction_status: "Pending" | "Active";
  service_states: string[];
  junction_price?: number;
  sample_type?: string;
  turnaround_days?: string;
  vital_slug?: string;
  required?: "required" | "optional";
}

export interface ClientAssignment {
  id: string;
  name: string;
  email: string;
  assigned: boolean;
  linkedLabAccountIds?: string[];
}

export interface LabOrder {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  client_name: string;
  product_name: string;
  lab_provider: string;
  price: number;
  status: "Completed" | "In Process" | "Requisition Created" | "Failed";
  payment_status: "Paid" | "Unpaid";
  visit_status: "Lab";
  doctor_name: string;
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

// Global Mock Storage (to persist state in local memory for this session)
const LOCAL_STORAGE_KEY_LABS = "welliemd_mock_labs_v2";
const LOCAL_STORAGE_KEY_ASSIGNMENTS = "welliemd_mock_assignments_v2";
const LOCAL_STORAGE_KEY_ORDERS = "welliemd_mock_orders_v2";

const MOCK_BIOMARKERS: Biomarker[] = [
  { id: "glucose", name: "Glucose", category: "Metabolic", code: "GLU", slug: "glucose", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "bun", name: "BUN (Urea Nitrogen)", category: "Renal", code: "BUN", slug: "bun", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "creatinine", name: "Creatinine", category: "Renal", code: "CRE", slug: "creatinine", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "sodium", name: "Sodium", category: "Electrolytes", code: "SOD", slug: "sodium", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "potassium", name: "Potassium", category: "Electrolytes", code: "POT", slug: "potassium", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "chloride", name: "Chloride", category: "Electrolytes", code: "CHL", slug: "chloride", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "co2", name: "CO2 (Bicarbonate)", category: "Electrolytes", code: "CO2", slug: "co2", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "calcium", name: "Calcium", category: "Metabolic", code: "CAL", slug: "calcium", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "albumin", name: "Albumin", category: "Liver", code: "ALB", slug: "albumin", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "total_protein", name: "Total Protein", category: "Liver", code: "TP", slug: "total_protein", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "alt", name: "ALT", category: "Liver", code: "ALT", slug: "alt", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "ast", name: "AST", category: "Liver", code: "AST", slug: "ast", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "alp", name: "ALP", category: "Liver", code: "ALP", slug: "alp", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "bilirubin", name: "Bilirubin", category: "Liver", code: "BIL", slug: "bilirubin", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "total_cholesterol", name: "Total Cholesterol", category: "Lipids", code: "CHO", slug: "total_cholesterol", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "hdl", name: "HDL", category: "Lipids", code: "HDL", slug: "hdl", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "ldl", name: "LDL", category: "Lipids", code: "LDL", slug: "ldl", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "triglycerides", name: "Triglycerides", category: "Lipids", code: "TRI", slug: "triglycerides", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "wbc", name: "WBC", category: "CBC", code: "WBC", slug: "wbc", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "rbc", name: "RBC", category: "CBC", code: "RBC", slug: "rbc", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "hemoglobin", name: "Hemoglobin", category: "CBC", code: "HEM", slug: "hemoglobin", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "hematocrit", name: "Hematocrit", category: "CBC", code: "HCT", slug: "hematocrit", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "platelets", name: "Platelets", category: "CBC", code: "PLT", slug: "platelets", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "testosterone_total", name: "Testosterone, Total", category: "Hormones", code: "TESTO_TOT", slug: "testosterone_total", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "testosterone_free", name: "Testosterone, Free", category: "Hormones", code: "TESTO_FREE", slug: "testosterone_free", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "shbg", name: "SHBG", category: "Hormones", code: "SHBG", slug: "shbg", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "estradiol", name: "Estradiol (E2)", category: "Hormones", code: "ESTR", slug: "estradiol", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "lh", name: "LH", category: "Hormones", code: "LH", slug: "lh", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "fsh", name: "FSH", category: "Hormones", code: "FSH", slug: "fsh", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "prolactin", name: "Prolactin", category: "Hormones", code: "PROL", slug: "prolactin", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "psa", name: "PSA", category: "Hormones", code: "PSA", slug: "psa", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "hba1c", name: "Hemoglobin A1c", category: "Endocrine", code: "A1C", slug: "hba1c", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "tsh", name: "TSH", category: "Endocrine", code: "TSH", slug: "tsh", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "ft4", name: "Free T4", category: "Endocrine", code: "FT4", slug: "ft4", common_tat: "1-2 days", worst_case_tat: "3 days" },
  { id: "vitamin_d", name: "Vitamin D, 25-OH", category: "Endocrine", code: "VITD", slug: "vitamin_d", common_tat: "2-3 days", worst_case_tat: "5 days" },
  { id: "hcg", name: "hCG (Pregnancy)", category: "Endocrine", code: "HCG", slug: "hcg", common_tat: "1-2 days", worst_case_tat: "2-3 days" }
];

const INITIAL_LABS: LabPanel[] = [
  {
    id: "lab_1",
    name: "Comprehensive Metabolic Panel",
    description: "Baseline metabolic markers including glucose, electrolytes, and kidney/liver function.",
    lab_provider: "Quest Diagnostics",
    biomarkers: [
      MOCK_BIOMARKERS[0], MOCK_BIOMARKERS[1], MOCK_BIOMARKERS[2], MOCK_BIOMARKERS[3],
      MOCK_BIOMARKERS[4], MOCK_BIOMARKERS[5], MOCK_BIOMARKERS[6], MOCK_BIOMARKERS[7],
      MOCK_BIOMARKERS[8], MOCK_BIOMARKERS[9], MOCK_BIOMARKERS[10], MOCK_BIOMARKERS[11],
      MOCK_BIOMARKERS[12], MOCK_BIOMARKERS[13]
    ],
    fasting_required: "yes",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 45.00,
    cost_to_welliemd: 12.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "TX", "FL"],
    junction_price: 39.00,
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_cmp14_quest",
    required: "required",
  },
  {
    id: "lab_2",
    name: "Lipid Panel",
    description: "Total cholesterol, HDL, LDL, and triglycerides.",
    lab_provider: "Quest Diagnostics",
    biomarkers: [MOCK_BIOMARKERS[14], MOCK_BIOMARKERS[15], MOCK_BIOMARKERS[16], MOCK_BIOMARKERS[17]],
    fasting_required: "yes",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 35.00,
    cost_to_welliemd: 9.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "TX", "FL", "IL"],
    junction_price: 29.00,
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_lipid_quest",
    required: "required",
  },
  {
    id: "lab_3",
    name: "Complete Blood Count",
    description: "Red blood cells, white blood cells, platelets, and hemoglobin.",
    lab_provider: "Quest Diagnostics",
    biomarkers: [MOCK_BIOMARKERS[18], MOCK_BIOMARKERS[19], MOCK_BIOMARKERS[20], MOCK_BIOMARKERS[21], MOCK_BIOMARKERS[22]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 25.00,
    cost_to_welliemd: 7.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "NY"],
    junction_price: 19.00,
    sample_type: "serum",
    turnaround_days: "2-3 days",
    vital_slug: "jl_cbc_quest",
    required: "required",
  },
  {
    id: "lab_4",
    name: "Testosterone — Total + Free",
    description: "Total and free testosterone levels. Required for TRT eligibility and monitoring.",
    lab_provider: "LabCorp",
    biomarkers: [MOCK_BIOMARKERS[23], MOCK_BIOMARKERS[24]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 75.00,
    cost_to_welliemd: 22.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "TX", "NV"],
    junction_price: 65.00,
    sample_type: "serum",
    turnaround_days: "3-5 days",
    vital_slug: "jl_test_tf_labcorp",
    required: "required",
  },
  {
    id: "lab_5",
    name: "PSA — Prostate Specific Antigen",
    description: "Required PSA baseline for men 45+ starting TRT.",
    lab_provider: "LabCorp",
    biomarkers: [MOCK_BIOMARKERS[30]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 50.00,
    cost_to_welliemd: 14.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "TX"],
    junction_price: 42.00,
    sample_type: "serum",
    turnaround_days: "3-5 days",
    vital_slug: "jl_psa_labcorp",
    required: "required",
  },
  {
    id: "lab_6",
    name: "Hemoglobin A1C",
    description: "3-month average blood glucose. Required for GLP-1 monitoring.",
    lab_provider: "Quest Diagnostics",
    biomarkers: [MOCK_BIOMARKERS[31]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 30.00,
    cost_to_welliemd: 8.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "FL"],
    junction_price: 24.00,
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_hba1c_quest",
    required: "required",
  },
  {
    id: "lab_7",
    name: "TSH — Thyroid Stimulating Hormone",
    description: "Thyroid function screen.",
    lab_provider: "Quest Diagnostics",
    biomarkers: [MOCK_BIOMARKERS[32]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 30.00,
    cost_to_welliemd: 9.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA"],
    junction_price: 26.00,
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_tsh_quest",
    required: "optional",
  },
  {
    id: "lab_8",
    name: "Vitamin D 25-OH",
    description: "Vitamin D deficiency screen.",
    lab_provider: "LabCorp",
    biomarkers: [MOCK_BIOMARKERS[34]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 45.00,
    cost_to_welliemd: 13.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "TX", "FL"],
    junction_price: 38.00,
    sample_type: "serum",
    turnaround_days: "4-7 days",
    vital_slug: "jl_vitd_labcorp",
    required: "optional",
  },
  {
    id: "lab_9",
    name: "Estradiol",
    description: "Estrogen levels — required for TRT aromatization monitoring.",
    lab_provider: "LabCorp",
    biomarkers: [MOCK_BIOMARKERS[26]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 55.00,
    cost_to_welliemd: 16.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "TX", "FL", "NY"],
    junction_price: 48.00,
    sample_type: "serum",
    turnaround_days: "3-5 days",
    vital_slug: "jl_e2_labcorp",
    required: "optional",
  },
  {
    id: "lab_10",
    name: "Sex Hormone Binding Globulin",
    description: "SHBG levels to interpret free testosterone calculations.",
    lab_provider: "LabCorp",
    biomarkers: [MOCK_BIOMARKERS[25]],
    fasting_required: "no",
    collection_method: "at_home_phlebotomy",
    cost_to_client: 40.00,
    cost_to_welliemd: 12.00,
    is_active: false,
    junction_status: "Pending",
    service_states: ["CA", "TX"],
    junction_price: 34.00,
    sample_type: "serum",
    turnaround_days: "4-6 days",
    vital_slug: "jl_shbg_labcorp",
    required: "optional",
  },
  {
    id: "lab_11",
    name: "Pregnancy Test (hCG, urine)",
    description: "Required negative pregnancy test before GLP-1 prescription for women of childbearing age.",
    lab_provider: "BioReference",
    biomarkers: [MOCK_BIOMARKERS[35]],
    fasting_required: "no",
    collection_method: "testkit",
    cost_to_client: 15.00,
    cost_to_welliemd: 4.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "TX", "FL", "NJ"],
    junction_price: 12.00,
    sample_type: "urine",
    turnaround_days: "1-2 days",
    vital_slug: "jl_hcg_u_bioref",
    required: "required",
  }
];

const INITIAL_ASSIGNMENTS: Record<string, string[]> = {
  "lab_1": [],
  "lab_2": [],
  "lab_3": [],
  "lab_4": [],
  "lab_5": [],
  "lab_6": [],
  "lab_7": [],
  "lab_8": [],
  "lab_9": [],
  "lab_10": [],
  "lab_11": []
};

const INITIAL_CLIENTS: ClientAssignment[] = [
  { id: "client_1", name: "Kin Meds", email: "info@kinmeds.com", assigned: false, linkedLabAccountIds: ["acct_1"] },
  { id: "client_2", name: "RVD Rx", email: "orders@rvdrx.com", assigned: false, linkedLabAccountIds: ["acct_2", "acct_3"] },
  { id: "client_3", name: "Moxie Health", email: "care@moxie.com", assigned: false, linkedLabAccountIds: ["acct_4"] }
];

const INITIAL_ORDERS: LabOrder[] = [
  {
    id: "kinmeds-00319",
    patient_name: "Jennifer Glancy",
    patient_email: "j.glance@aol.com",
    patient_phone: "+17326043910",
    client_name: "Kin Meds",
    product_name: "Comprehensive Metabolic Panel",
    lab_provider: "Quest Diagnostics",
    price: 45.00,
    status: "Completed",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "06/12/2026",
      sample_collected: "06/12/2026",
      results: "06/12/2026"
    },
    resultsReady: true,
    biomarkers: [
      { biomarker: "Glucose", result: "100", units: "mg/dL", reference_range: "70 - 99", flag: "High" },
      { biomarker: "BUN (Urea Nitrogen)", result: "14", units: "mg/dL", reference_range: "7 - 20", flag: "Normal" },
      { biomarker: "Creatinine", result: "1.05", units: "mg/dL", reference_range: "0.5 - 1.3", flag: "Normal" },
      { biomarker: "Sodium", result: "140", units: "mmol/L", reference_range: "135 - 145", flag: "Normal" },
      { biomarker: "Potassium", result: "4.2", units: "mmol/L", reference_range: "3.5 - 5.1", flag: "Normal" },
      { biomarker: "Chloride", result: "102", units: "mmol/L", reference_range: "98 - 107", flag: "Normal" },
      { biomarker: "CO2 (Bicarbonate)", result: "25", units: "mmol/L", reference_range: "22 - 29", flag: "Normal" }
    ]
  },
  {
    id: "mavnhealth-00058",
    patient_name: "Diana Essoka",
    patient_email: "dianasoppo@gmail.com",
    patient_phone: "+17155605785",
    client_name: "Mavn Health",
    product_name: "Lipid Panel",
    lab_provider: "Quest Diagnostics",
    price: 35.00,
    status: "In Process",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "06/10/2026",
      sample_collected: "06/12/2026"
    },
    resultsReady: false
  },
  {
    id: "rvdrx-00122",
    patient_name: "Robert Pimentel",
    patient_email: "robertpimen@gmail.com",
    patient_phone: "+15512219488",
    client_name: "RVD Rx",
    product_name: "Complete Blood Count",
    lab_provider: "Quest Diagnostics",
    price: 25.00,
    status: "In Process",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "06/10/2026",
      sample_collected: "06/12/2026"
    },
    resultsReady: false
  },
  {
    id: "kinmeds-00318",
    patient_name: "David Vose",
    patient_email: "dvose11@gmail.com",
    patient_phone: "+16174801124",
    client_name: "Kin Meds",
    product_name: "Testosterone — Total + Free",
    lab_provider: "LabCorp",
    price: 75.00,
    status: "In Process",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "06/09/2026"
    },
    resultsReady: false
  },
  {
    id: "kinmeds-00317",
    patient_name: "David Vose",
    patient_email: "dvose11@gmail.com",
    patient_phone: "+16174801124",
    client_name: "Kin Meds",
    product_name: "PSA — Prostate Specific Antigen",
    lab_provider: "LabCorp",
    price: 50.00,
    status: "Completed",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "06/09/2026",
      sample_collected: "06/10/2026",
      results: "06/11/2026"
    },
    resultsReady: true,
    biomarkers: [
      { biomarker: "PSA", result: "1.2", units: "ng/mL", reference_range: "0.0 - 4.0", flag: "Normal" }
    ]
  },
  {
    id: "moxie-00911",
    patient_name: "Clara Oswald",
    patient_email: "coswald@moxie.com",
    patient_phone: "+14159902231",
    client_name: "Moxie Health",
    product_name: "Hemoglobin A1C",
    lab_provider: "Quest Diagnostics",
    price: 30.00,
    status: "Completed",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "06/08/2026",
      sample_collected: "06/09/2026",
      results: "06/10/2026"
    },
    resultsReady: true,
    biomarkers: [
      { biomarker: "Hemoglobin A1c", result: "5.4", units: "%", reference_range: "4.0 - 5.6", flag: "Normal" }
    ]
  },
  {
    id: "vidarx-00030",
    patient_name: "Richard Sanso",
    patient_email: "sansori16@yahoo.com",
    patient_phone: "+15126634814",
    client_name: "Vida RX",
    product_name: "Vitamin D 25-OH",
    lab_provider: "LabCorp",
    price: 45.00,
    status: "Failed",
    payment_status: "Unpaid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "06/09/2026"
    },
    resultsReady: false
  }
];

// Load from local storage or set defaults
const loadFromStorage = (key: string, defaults: any) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const labsApi = {
  getBiomarkers: async (): Promise<Biomarker[]> => {
    return MOCK_BIOMARKERS;
  },

  getLabPanels: async (): Promise<LabPanel[]> => {
    return loadFromStorage(LOCAL_STORAGE_KEY_LABS, INITIAL_LABS);
  },

  createLabPanel: async (payload: Omit<LabPanel, "id" | "junction_status" | "junction_price">): Promise<LabPanel> => {
    const panels = loadFromStorage(LOCAL_STORAGE_KEY_LABS, INITIAL_LABS);
    const newPanel: LabPanel = {
      ...payload,
      id: `lab_${panels.length + 1}`,
      junction_status: "Pending",
      junction_price: parseFloat((payload.cost_to_welliemd * 0.85).toFixed(2)),
      sample_type: "Blood draw",
      turnaround_days: "1-2 days",
      vital_slug: `quest-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    };
    panels.push(newPanel);
    saveToStorage(LOCAL_STORAGE_KEY_LABS, panels);
    return newPanel;
  },

  updateLabPanel: async (id: string, payload: Partial<LabPanel>): Promise<LabPanel> => {
    const panels = loadFromStorage(LOCAL_STORAGE_KEY_LABS, INITIAL_LABS);
    const index = panels.findIndex((p: any) => p.id === id);
    if (index === -1) throw new Error("Lab panel not found");
    
    // Definition fields (lab_provider, biomarkers, fasting_required, collection_method) are immutable,
    // only pricing, availability, and service states are editable.
    const updated = {
      ...panels[index],
      cost_to_client: payload.cost_to_client ?? panels[index].cost_to_client,
      cost_to_welliemd: payload.cost_to_welliemd ?? panels[index].cost_to_welliemd,
      is_active: payload.is_active ?? panels[index].is_active,
      service_states: payload.service_states ?? panels[index].service_states,
    };
    panels[index] = updated;
    saveToStorage(LOCAL_STORAGE_KEY_LABS, panels);
    return updated;
  },

  checkLabPanelJunctionStatus: async (id: string): Promise<LabPanel> => {
    const panels = loadFromStorage(LOCAL_STORAGE_KEY_LABS, INITIAL_LABS);
    const index = panels.findIndex((p: any) => p.id === id);
    if (index === -1) throw new Error("Lab panel not found");
    
    panels[index].junction_status = "Active";
    saveToStorage(LOCAL_STORAGE_KEY_LABS, panels);
    return panels[index];
  },

  getClientsForLabAssignment: async (labId: string): Promise<ClientAssignment[]> => {
    const assignments = loadFromStorage(LOCAL_STORAGE_KEY_ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    const assignedClientIds = assignments[labId] || [];
    return INITIAL_CLIENTS.map(client => ({
      ...client,
      assigned: assignedClientIds.includes(client.id)
    }));
  },

  assignLabPanelToClients: async (labId: string, clientIds: string[]): Promise<{ success: boolean }> => {
    const assignments = loadFromStorage(LOCAL_STORAGE_KEY_ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    assignments[labId] = clientIds;
    saveToStorage(LOCAL_STORAGE_KEY_ASSIGNMENTS, assignments);
    return { success: true };
  },

  getAdminLabOrders: async (): Promise<LabOrder[]> => {
    return loadFromStorage(LOCAL_STORAGE_KEY_ORDERS, INITIAL_ORDERS);
  },

  getAdminLabOrderResults: async (orderId: string) => {
    const orders = loadFromStorage(LOCAL_STORAGE_KEY_ORDERS, INITIAL_ORDERS);
    const order = orders.find((o: any) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    return {
      patient_name: order.patient_name,
      lab_provider: order.lab_provider,
      product_name: order.product_name,
      order_id: order.id,
      collection_date: order.timeline.sample_collected || "N/A",
      reporting_date: order.timeline.results || "N/A",
      status: order.resultsReady ? "Results Ready" : "In Progress",
      biomarkers: (order.biomarkers || []).map((bm: any, index: number) => ({
        id: bm.id || `bm_${index}`,
        name: bm.biomarker || bm.name,
        result: bm.result,
        units: bm.units,
        reference_range: bm.reference_range,
        flag: bm.flag
      }))
    };
  },

  downloadAdminLabResultPdf: async (orderId: string): Promise<Blob> => {
    // Return a dummy PDF blob
    return new Blob(["%PDF-1.4 Mock Lab Report PDF Content"], { type: "application/pdf" });
  },

  getJunctionLabOrderResultsPdf: async (orderId: string): Promise<string> => {
    // Return dummy base64 representation of a PDF
    return "JVBERi0xLjQKJVRleHQgQ29udGVudCBmb3IgTW9jayBMYWIgUmVwb3J0IFBERg==";
  }
};
