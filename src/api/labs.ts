/**
 * Mock Lab Management API for Client/Tenant Portal
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

export interface ClientLabPanel {
  id: string;
  name: string;
  description: string;
  lab_provider: string;
  biomarkers: Biomarker[];
  fasting_required: "yes" | "no";
  collection_method: "testkit" | "walk_in_test" | "at_home_phlebotomy" | "on_site_collection";
  cost_to_client: number; // What the admin charges the client
  price: number; // What the client charges patients (client-customizable)
  is_active: boolean; // Whether the client enables this in their patient storefront
  junction_status: "Pending" | "Active";
  service_states: string[];
  required?: "required" | "optional";
  sample_type?: string;
  turnaround_days?: string;
  vital_slug?: string;
}

export interface LabOrder {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
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
  resultsReleased?: boolean;
  releasedAt?: string | null;
  releasedBy?: string | null;
  biomarkers?: Array<{
    biomarker: string;
    result: string;
    units: string;
    reference_range: string;
    flag: "Normal" | "High" | "Low";
  }>;
}

// Global Mock Storage (shares version 2 keys with admin to simulate database sync)
const LOCAL_STORAGE_KEY_LABS = "welliemd_mock_labs_v2";
const LOCAL_STORAGE_KEY_ORDERS = "welliemd_mock_orders_v3";

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

const INITIAL_LABS: ClientLabPanel[] = [
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
    price: 60.00, // Patient price set by client
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "TX", "FL"],
    required: "required",
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_cmp14_quest",
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
    price: 49.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "TX", "FL", "IL"],
    required: "required",
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_lipid_quest",
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
    price: 39.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "NY"],
    required: "required",
    sample_type: "serum",
    turnaround_days: "2-3 days",
    vital_slug: "jl_cbc_quest",
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
    price: 99.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "TX", "NV"],
    required: "required",
    sample_type: "serum",
    turnaround_days: "3-5 days",
    vital_slug: "jl_test_tf_labcorp",
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
    price: 69.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "TX"],
    required: "required",
    sample_type: "serum",
    turnaround_days: "3-5 days",
    vital_slug: "jl_psa_labcorp",
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
    price: 45.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "FL"],
    required: "required",
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_hba1c_quest",
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
    price: 45.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA"],
    required: "required",
    sample_type: "serum",
    turnaround_days: "2-4 days",
    vital_slug: "jl_tsh_quest",
  },
  {
    id: "lab_8",
    name: "Vitamin D, 25-Hydroxy",
    description: "Check for vitamin D deficiency.",
    lab_provider: "Quest Diagnostics",
    biomarkers: [MOCK_BIOMARKERS[34]],
    fasting_required: "no",
    collection_method: "walk_in_test",
    cost_to_client: 40.00,
    price: 59.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["NY", "CA", "TX"],
    required: "optional",
    sample_type: "serum",
    turnaround_days: "2-3 days",
    vital_slug: "jl_vitd_quest",
  },
  {
    id: "lab_9",
    name: "Female Hormone Panel",
    description: "Estrogen, LH, FSH, Prolactin, and progesterone indicators.",
    lab_provider: "LabCorp",
    biomarkers: [MOCK_BIOMARKERS[26], MOCK_BIOMARKERS[27], MOCK_BIOMARKERS[28], MOCK_BIOMARKERS[29]],
    fasting_required: "no",
    collection_method: "walk_in_test",
    cost_to_client: 110.00,
    price: 149.00,
    is_active: true,
    junction_status: "Active",
    service_states: ["CA", "TX", "FL"],
    required: "optional",
    sample_type: "serum",
    turnaround_days: "3-5 days",
    vital_slug: "jl_female_hormone_labcorp",
  },
  {
    id: "lab_10",
    name: "hCG Pregnancy Test (Quantitative)",
    description: "Blood serum measurement of human chorionic gonadotropin.",
    lab_provider: "LabCorp",
    biomarkers: [MOCK_BIOMARKERS[35]],
    fasting_required: "no",
    collection_method: "walk_in_test",
    cost_to_client: 28.00,
    price: 39.00,
    is_active: false,
    junction_status: "Active",
    service_states: ["NY", "CA", "TX"],
    required: "optional",
    sample_type: "serum",
    turnaround_days: "1-2 days",
    vital_slug: "jl_hcg_labcorp",
  },
  {
    id: "lab_11",
    name: "Cortisol (Morning)",
    description: "Adrenal function baseline marker.",
    lab_provider: "Quest Diagnostics",
    biomarkers: [],
    fasting_required: "no",
    collection_method: "walk_in_test",
    cost_to_client: 35.00,
    price: 49.00,
    is_active: false,
    junction_status: "Pending",
    service_states: ["NY", "CA"],
    required: "optional",
    sample_type: "serum",
    turnaround_days: "2-3 days",
    vital_slug: "jl_cortisol_quest",
  }
];

const INITIAL_ORDERS: LabOrder[] = [
  {
    id: "kinmeds-00306",
    patient_name: "Jennifer Glancy",
    patient_email: "j.glance@aol.com",
    patient_phone: "+17326043810",
    product_name: "Comprehensive Metabolic Panel",
    lab_provider: "Quest Diagnostics",
    price: 45.00,
    status: "Completed",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Mitchell Stotland MD",
    timeline: {
      ordered: "2026-06-11T07:05:00Z",
      sample_collected: "2026-06-11T11:20:00Z",
      results: "2026-06-11T16:55:00Z",
    },
    resultsReady: true,
    resultsReleased: true,
    releasedAt: "2026-06-11T17:00:00Z",
    releasedBy: "Mitchell Stotland MD",
    biomarkers: [
      { biomarker: "Glucose", result: "73", units: "mg/dL", reference_range: "70-99", flag: "Normal" },
      { biomarker: "BUN", result: "10", units: "mg/dL", reference_range: "7-20", flag: "Normal" },
      { biomarker: "Creatinine", result: "1.3", units: "mg/dL", reference_range: "0.6-1.3", flag: "Normal" },
      { biomarker: "Sodium", result: "145", units: "mmol/L", reference_range: "135-145", flag: "Normal" },
      { biomarker: "Potassium", result: "3.8", units: "mmol/L", reference_range: "3.5-5.1", flag: "Normal" },
      { biomarker: "Chloride", result: "99", units: "mmol/L", reference_range: "98-107", flag: "Normal" },
      { biomarker: "CO2", result: "29", units: "mmol/L", reference_range: "22-29", flag: "Normal" },
      { biomarker: "Calcium", result: "10.3", units: "mg/dL", reference_range: "8.5-10.2", flag: "High" },
    ],
  },
  {
    id: "kinmeds-00302",
    patient_name: "BENJI DAVIDSON",
    patient_email: "DJBENJIDAVIDSON@GMAIL.COM",
    patient_phone: "+14242546362",
    product_name: "Lipid Panel",
    lab_provider: "LabCorp",
    price: 39.00,
    status: "In Process",
    payment_status: "Paid",
    visit_status: "Lab",
    doctor_name: "Dr. Sarah Jenkins",
    timeline: {
      ordered: "2026-06-07T08:15:00Z",
    },
    resultsReady: false,
    resultsReleased: false,
  },
];

export const clientLabsApi = {
  getLabPanels: (): ClientLabPanel[] => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_LABS);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY_LABS, JSON.stringify(INITIAL_LABS));
      return INITIAL_LABS;
    }
    try {
      const parsed = JSON.parse(stored);
      // Ensure prices and is_active are initialized correctly
      return parsed.map((item: any) => ({
        ...item,
        price: item.price ?? (item.cost_to_client * 1.3),
        is_active: item.is_active ?? true,
      }));
    } catch {
      return INITIAL_LABS;
    }
  },

  updateLabPanel: (id: string, updates: Partial<ClientLabPanel>): ClientLabPanel => {
    const list = clientLabsApi.getLabPanels();
    const updatedList = list.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_LABS, JSON.stringify(updatedList));
    return updatedList.find(x => x.id === id)!;
  },

  getLabOrders: (): LabOrder[] => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    try {
      let parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
      let modified = false;
      INITIAL_ORDERS.forEach(initialOrd => {
        if (!parsed.some((o: any) => o.id === initialOrd.id)) {
          parsed.push(initialOrd);
          modified = true;
        }
      });
      if (modified) {
        localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(parsed));
      }
      // Filter only lab orders (identified by is_lab/visit_status/type)
      return parsed.filter((ord: any) => ord.is_lab || ord.visit_status === "Lab");
    } catch {
      return INITIAL_ORDERS;
    }
  },

  getLabResults: (orderId: string) => {
    const orders = clientLabsApi.getLabOrders();
    const order = orders.find(o => o.id === orderId);
    return order ? order.biomarkers : null;
  },
  
  releaseLabResults: (orderId: string, released: boolean, releasedBy?: string): LabOrder => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
    let orders: any[] = [];
    if (stored) {
      try {
        orders = JSON.parse(stored);
      } catch {
        orders = [...INITIAL_ORDERS];
      }
    } else {
      orders = [...INITIAL_ORDERS];
    }
    const updated = orders.map((o: any) => {
      if (o.id === orderId) {
        return {
          ...o,
          resultsReleased: released,
          releasedAt: released ? new Date().toISOString() : null,
          releasedBy: released ? (releasedBy || "Staff Member") : null,
        };
      }
      return o;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(updated));
    return updated.find((x: any) => x.id === orderId);
  }
};
