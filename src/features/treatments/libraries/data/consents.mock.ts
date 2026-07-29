import type { ConsentForm, ConsentOption } from "@/features/treatments/types";
import { MOCK_IDS } from "@/features/treatments/common/data/mockIds";

/** Standard agree / decline pair used across most consents. */
const consentChoicePair = (prefix: string): ConsentOption[] => [
  { id: `${prefix}-agree`, text: "I have read and agree to the above", disqualifies: false },
  { id: `${prefix}-decline`, text: "I do not wish to continue", disqualifies: true },
];

export const mockConsents: ConsentForm[] = [
  {
    id: MOCK_IDS.CONSENT_TRUTHFULNESS,
    name: "Consent (Truthfulness)",
    scope: "global",
    isArchived: false,
    visitTypeKeys: [],
    updatedAt: "2026-05-21",
    text:
      "<p>Please attest to the following confirming that all information you have provided to us is true and complete.</p>" +
      "<p><strong>Consent:</strong> I verify that I am the patient and that I have answered the questions asked in this intake form. I confirm that I have reviewed and understood all the questions asked of me. I attest that the answers and information I have provided in this questionnaire is true and complete to the best of my knowledge. I understand that it is critical to my health to share complete health information with my doctor. I will not hold the doctor or affiliated medical practice responsible for any oversights or omissions, whether intentional or not, in the information that I provided.</p>",
    options: consentChoicePair("opt-truth"),
  },
  {
    id: MOCK_IDS.CONSENT_TELEHEALTH,
    name: "Consent (Telehealth)",
    scope: "global",
    isArchived: false,
    visitTypeKeys: [],
    updatedAt: "2026-05-18",
    text:
      "<p>I consent to receive care via <strong>telehealth</strong>. I understand that:</p>" +
      "<ul><li>Telehealth involves the use of electronic communications to deliver care.</li><li>My provider may determine that telehealth is not appropriate for my condition.</li></ul>",
    options: consentChoicePair("opt-tele"),
  },
  {
    id: MOCK_IDS.CONSENT_PRIVACY,
    name: "Consent (Privacy Policy)",
    scope: "global",
    isArchived: false,
    visitTypeKeys: [],
    updatedAt: "2026-04-30",
    text:
      "<p>I acknowledge that I have read and agree to the <strong>Privacy Policy</strong> describing how my personal health information is collected, used, and protected.</p>",
    options: consentChoicePair("opt-priv"),
  },
  {
    id: "consent-glp",
    name: "Consent (GLP-1 Weight Loss)",
    scope: "visit_type",
    status: "active",
    visitTypeKeys: ["weightloss", "glpMicrodosing"],
    updatedAt: "2026-05-12",
    text:
      "<p>I understand the <strong>risks and benefits</strong> of GLP-1 weight loss medication, including possible gastrointestinal side effects, and agree to follow the prescribed titration schedule.</p>",
    options: consentChoicePair("opt-glp"),
  },
  {
    id: "consent-trt",
    name: "Consent (TRT)",
    scope: "visit_type",
    status: "active",
    visitTypeKeys: ["trt"],
    updatedAt: "2026-05-10",
    text:
      "<p>I understand the risks and benefits of <strong>Testosterone Replacement Therapy</strong>, including effects on fertility, and consent to ongoing lab monitoring.</p>",
    options: consentChoicePair("opt-trt"),
  },
  {
    id: "consent-hrt",
    name: "Consent (HRT / Estrogen)",
    scope: "visit_type",
    isArchived: true,
    visitTypeKeys: ["menopause"],
    updatedAt: "2026-05-05",
    text:
      "<p>I understand the risks and benefits of <strong>Hormone Replacement Therapy</strong> and consent to treatment under provider supervision.</p>",
    options: consentChoicePair("opt-hrt"),
  },
  {
    id: "consent-ed",
    name: "Consent (ED / PDE5 inhibitors)",
    scope: "visit_type",
    isArchived: true,
    visitTypeKeys: ["ed"],
    updatedAt: "2026-05-02",
    text:
      "<p>I understand the risks and benefits of <strong>PDE5 inhibitor</strong> medications and confirm I am not taking nitrates.</p>",
    options: [
      { id: "opt-ed-agree", text: "I have read and agree to the above", disqualifies: false },
      { id: "opt-ed-nitrates", text: "I am currently taking nitrates", disqualifies: true },
    ],
  },
  {
    id: "consent-peptide",
    name: "Consent (Peptide therapy)",
    scope: "visit_type",
    status: "active",
    visitTypeKeys: ["antiAging"],
    updatedAt: "2026-04-28",
    text:
      "<p>I understand the <strong>investigational nature</strong> of peptide therapy and consent to treatment as prescribed.</p>",
    options: consentChoicePair("opt-pep"),
  },
];
