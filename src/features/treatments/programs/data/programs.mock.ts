import type { Program } from "@/features/treatments/types";
import { MOCK_IDS } from "@/features/treatments/common/data/mockIds";

export const mockPrograms: Program[] = [
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

  // 7. GLP Microdose (Special/Client Prototype match)
  {
    id: "program-glp-microdose",
    name: "GLP Microdose Intake",
    stage: "intake",
    treatmentTypeKey: "glp-microdose",
    visitType: "glpMicrodosing",
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

  // 8. Enclomiphene (shares the "trt" intake visit type with TRT)
  {
    id: "program-enclomiphene-intake",
    name: "Enclomiphene Intake",
    stage: "intake",
    treatmentTypeKey: "enclomiphene",
    visitType: "trt",
    questionCount: 6,
    checkoutQuestionCount: 1,
    status: "published",
    updatedAt: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
    slug: "enclomiphene-intake",
    authConfig: { email: true, phone: false, identity: false, account: true },
    checkoutQuestions: [],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY, "consent-trt"],
  },

  // 10. Premature Ejaculation
  {
    id: "program-pe-intake",
    name: "PE Intake",
    stage: "intake",
    treatmentTypeKey: "pe",
    visitType: "pe",
    questionCount: 5,
    checkoutQuestionCount: 1,
    status: "draft",
    updatedAt: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    slug: "pe-intake",
    authConfig: { email: true, phone: false, identity: false, account: true },
    checkoutQuestions: [],
    consentIds: [MOCK_IDS.CONSENT_TRUTHFULNESS, MOCK_IDS.CONSENT_TELEHEALTH, MOCK_IDS.CONSENT_PRIVACY],
  },
];
