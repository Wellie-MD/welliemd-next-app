// Mock catalog of products scoped to a visit type, keyed by the visit-type
// identifier (e.g. "trt", "weightloss"). Swap this adapter for a real products
// API later — consumers only depend on the exported shape + accessor.

export type VisitTypeProductStatus = "active" | "draft";

export interface VisitTypeProduct {
  id: string;
  name: string;
  dose: string;
  titration: string;
  status: VisitTypeProductStatus;
}

const VISIT_TYPE_PRODUCTS: Record<string, VisitTypeProduct[]> = {
  trt: [
    { id: "vtp-trt-cyp", name: "Testosterone Cypionate", dose: "100–200 mg/week", titration: "Weekly Injection", status: "active" },
    { id: "vtp-trt-enan", name: "Testosterone Enanthate", dose: "100–200 mg/week", titration: "Weekly Injection", status: "active" },
    { id: "vtp-trt-cream", name: "Compounded T Cream", dose: "5–10 mg/day", titration: "Daily topical", status: "active" },
    { id: "vtp-trt-pellets", name: "Testosterone Pellets", dose: "Per provider", titration: "Quarterly insertion", status: "draft" },
  ],
  weightloss: [
    { id: "vtp-wl-sema", name: "Compounded Semaglutide", dose: "0.25–2.4 mg/week", titration: "Weekly Injection", status: "active" },
    { id: "vtp-wl-tirz", name: "Compounded Tirzepatide", dose: "2.5–15 mg/week", titration: "Weekly Injection", status: "active" },
    { id: "vtp-wl-wegovy", name: "Wegovy", dose: "0.25–2.4 mg/week", titration: "Weekly Injection", status: "active" },
    { id: "vtp-wl-zepbound", name: "Zepbound", dose: "2.5–15 mg/week", titration: "Weekly Injection", status: "draft" },
  ],
  glpMicrodosing: [
    { id: "vtp-md-sema", name: "Microdose Semaglutide", dose: "0.1–0.2 mg/week", titration: "Weekly Injection", status: "active" },
    { id: "vtp-md-tirz", name: "Microdose Tirzepatide", dose: "1.0–1.5 mg/week", titration: "Weekly Injection", status: "active" },
  ],
  ed: [
    { id: "vtp-ed-sild", name: "Sildenafil", dose: "20–100 mg", titration: "As needed", status: "active" },
    { id: "vtp-ed-tada", name: "Tadalafil", dose: "2.5–20 mg", titration: "Daily or as needed", status: "active" },
  ],
  menopause: [
    { id: "vtp-meno-estradiol", name: "Estradiol", dose: "0.5–1.0 mg/day", titration: "Daily", status: "active" },
    { id: "vtp-meno-prog", name: "Progesterone", dose: "100–200 mg/day", titration: "Daily", status: "active" },
  ],
  antiAging: [
    { id: "vtp-nad-inj", name: "NAD+ Injection", dose: "100–250 mg", titration: "Weekly Injection", status: "active" },
    { id: "vtp-nad-iv", name: "NAD+ IV", dose: "Per provider", titration: "Monthly infusion", status: "draft" },
  ],
  pe: [
    { id: "vtp-pe-sert", name: "Sertraline", dose: "50–100 mg", titration: "Daily", status: "active" },
    { id: "vtp-pe-priligy", name: "Compounded Priligy", dose: "30–60 mg", titration: "As needed", status: "draft" },
  ],
};

export const getVisitTypeProducts = (visitType: string | undefined): VisitTypeProduct[] =>
  visitType ? VISIT_TYPE_PRODUCTS[visitType] ?? [] : [];
