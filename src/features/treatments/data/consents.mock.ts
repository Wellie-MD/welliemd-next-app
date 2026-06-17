import type { ConsentForm } from "../types";
import { MOCK_IDS } from "./mockIds";

export const mockConsents: ConsentForm[] = [
  {
    id: MOCK_IDS.CONSENT_TRUTHFULNESS,
    name: "Consent (Truthfulness)",
    scope: "global",
    visitTypeKeys: [],
    updatedAt: "2026-05-21",
  },
  {
    id: MOCK_IDS.CONSENT_TELEHEALTH,
    name: "Consent (Telehealth)",
    scope: "global",
    visitTypeKeys: [],
    updatedAt: "2026-05-20",
  },
  {
    id: MOCK_IDS.CONSENT_PRIVACY,
    name: "Consent (Privacy Policy)",
    scope: "global",
    visitTypeKeys: [],
    updatedAt: "2026-05-19",
  },
  {
    id: "consent-glp",
    name: "Consent (GLP-1 Weight Loss)",
    scope: "treatment",
    visitTypeKeys: ["glp_weight_loss"],
    updatedAt: "2026-05-12",
  },
  {
    id: "consent-trt",
    name: "Consent (TRT)",
    scope: "treatment",
    visitTypeKeys: ["trt"],
    updatedAt: "2026-05-15",
  },
  {
    id: "consent-hrt",
    name: "Consent (HRT / Estrogen)",
    scope: "treatment",
    visitTypeKeys: ["menopause"],
    updatedAt: "2026-05-11",
  },
  {
    id: "consent-ed",
    name: "Consent (ED / PDE5 inhibitors)",
    scope: "treatment",
    visitTypeKeys: ["ed"],
    updatedAt: "2026-05-02",
  },
  {
    id: "consent-peptide",
    name: "Consent (Peptide therapy)",
    scope: "treatment",
    visitTypeKeys: ["anti_aging"],
    updatedAt: "2026-05-10",
  },
];
