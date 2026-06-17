import type { Program } from "../types";
import { MOCK_IDS } from "./mockIds";

export const mockPrograms: Program[] = [
  // 1. ED
  {
    id: "program-ed-intake",
    name: "Erectile Dysfunction Intake",
    stage: "intake",
    treatmentTypeKey: MOCK_IDS.TREATMENT_ED,
    visitType: "ed",
    questionCount: 8,
    checkoutQuestionCount: 1,
    status: "published",
    updatedAt: new Date(Date.now() - 34 * 86400000).toISOString().split('T')[0],
    slug: "ed-intake",
    authConfig: {
      email: true,
      phone: true,
      identity: false,
      account: true,
    },
    checkoutQuestions: [
      {
        id: "cq-ed-1",
        text: "Recommended ED product options",
        products: [
          {
            category: "Sildenafil",
            regimen: "Standard",
            doseLabel: "Sildenafil 20mg",
          },
          {
            category: "Tadalafil",
            regimen: "Standard",
            doseLabel: "Tadalafil 5mg",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      }
    ],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY, "consent-ed"],
  },
  {
    id: "program-ed-followup",
    name: "Erectile Dysfunction Follow-up",
    stage: "follow_up",
    treatmentTypeKey: MOCK_IDS.TREATMENT_ED,
    visitType: "edFollowup",
    questionCount: 0,
    checkoutQuestionCount: 0,
    status: "draft",
    updatedAt: new Date().toISOString().split('T')[0],
    slug: "ed-followup",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY],
  },

  // 2. Compounded GLP
  {
    id: "program-compounded-glp-intake",
    name: "Compounded GLP Intake",
    stage: "intake",
    treatmentTypeKey: MOCK_IDS.TREATMENT_COMPOUNDED_GLP,
    visitType: "weightloss",
    questionCount: 23,
    checkoutQuestionCount: 3,
    status: "draft",
    updatedAt: new Date().toISOString().split('T')[0],
    slug: "compounded-glp-intake",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [
      {
        id: "cq-cglp-1",
        text: "Recommended Compounded Semaglutide options",
        products: [
          {
            category: "Semaglutide",
            regimen: "Standard",
            doseLabel: "Semaglutide 0.2mg",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      }
    ],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY, "consent-glp"],
  },
  {
    id: "program-compounded-glp-followup",
    name: "Compounded GLP Follow-up",
    stage: "follow_up",
    treatmentTypeKey: MOCK_IDS.TREATMENT_COMPOUNDED_GLP,
    visitType: "weightlossFollowup",
    questionCount: 8,
    checkoutQuestionCount: 1,
    status: "draft",
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    slug: "compounded-glp-followup",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY],
  },

  // 3. Branded GLP
  {
    id: "program-branded-glp-intake",
    name: "Branded GLP Intake",
    stage: "intake",
    treatmentTypeKey: MOCK_IDS.TREATMENT_BRANDED_GLP,
    visitType: "weightloss",
    questionCount: 21,
    checkoutQuestionCount: 2,
    status: "draft",
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    slug: "branded-glp-intake",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [
      {
        id: "cq-bglp-1",
        text: "Recommended Branded Wegovy options",
        products: [
          {
            category: "Semaglutide",
            regimen: "Standard",
            doseLabel: "Wegovy 0.25mg",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      }
    ],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY, "consent-glp"],
  },

  // 4. Testosterone Replacement
  {
    id: "program-trt-intake",
    name: "Testosterone Replacement Intake",
    stage: "intake",
    treatmentTypeKey: MOCK_IDS.TREATMENT_TRT,
    visitType: "trt",
    questionCount: 12,
    checkoutQuestionCount: 2,
    status: "published",
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    slug: "trt-intake",
    authConfig: {
      email: true,
      phone: true,
      identity: true,
      account: true,
    },
    checkoutQuestions: [
      {
        id: "cq-trt-1",
        text: "Recommended TRT Therapy options",
        products: [
          {
            category: "TRT",
            regimen: "Normal Dose",
            doseLabel: "Testosterone Cypionate 200mg",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      }
    ],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY, "consent-trt"],
  },
  {
    id: "program-trt-followup",
    name: "Testosterone Replacement Follow-up",
    stage: "follow_up",
    treatmentTypeKey: MOCK_IDS.TREATMENT_TRT,
    visitType: "trtFollowup",
    questionCount: 7,
    checkoutQuestionCount: 1,
    status: "published",
    updatedAt: new Date(Date.now() - 32 * 86400000).toISOString().split('T')[0],
    slug: "trt-followup",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY],
  },

  // 5. NAD+ Therapy
  {
    id: "program-nad-intake",
    name: "NAD+ Therapy Intake",
    stage: "intake",
    treatmentTypeKey: MOCK_IDS.TREATMENT_NAD,
    visitType: "antiAging",
    questionCount: 5,
    checkoutQuestionCount: 1,
    status: "draft",
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    slug: "nad-intake",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [
      {
        id: "cq-nad-1",
        text: "Recommended NAD+ injection options",
        products: [
          {
            category: "NAD+",
            regimen: "Standard",
            doseLabel: "NAD+",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      }
    ],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY, "consent-peptide"],
  },

  // 6. Hormone Replacement (HRT)
  {
    id: "program-hrt-intake",
    name: "HRT Intake",
    stage: "intake",
    treatmentTypeKey: MOCK_IDS.TREATMENT_HRT,
    visitType: "menopause",
    questionCount: 10,
    checkoutQuestionCount: 2,
    status: "draft",
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    slug: "hrt-intake",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [
      {
        id: "cq-hrt-1",
        text: "Recommended HRT options",
        products: [
          {
            category: "Estradiol",
            regimen: "Normal Dose",
            doseLabel: "Estradiol 0.5mg",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      }
    ],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY, "consent-hrt"],
  },

  // 7. GLP Microdose (Special/Client Prototype match)
  {
    id: "program-glp-microdose",
    name: "GLP Microdose Intake",
    stage: "intake",
    treatmentTypeKey: MOCK_IDS.TREATMENT_COMPOUNDED_GLP,
    visitType: "weightloss",
    questionCount: 1,
    checkoutQuestionCount: 2,
    status: "published",
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    slug: "glp-microdose",
    authConfig: {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    checkoutQuestions: [
      {
        id: "cq-1",
        text: "Product Options — Microdose Semaglutide",
        products: [
          {
            category: "Semaglutide",
            regimen: "Low Dose",
            doseLabel: "Semaglutide 0.2mg Microdosing",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      },
      {
        id: "cq-2",
        text: "Product Options — Microdose Tirzepatide",
        products: [
          {
            category: "Tirzepatide",
            regimen: "Low Dose",
            doseLabel: "Tirzepatide 1.5mg Microdosing",
          }
        ],
        visibilityRules: {
          mode: "simple",
          rules: [],
        },
      },
    ],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY],
  },
];
