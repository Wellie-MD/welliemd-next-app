import type {
  CommonSection,
  ConsentForm,
  ContentLibraryStats,
  CustomProgram,
  Program,
  ProgramQuestion,
  TreatmentType,
} from "@/features/treatments/types";
import { mockConsents } from "@/features/treatments/libraries/data/consents.mock";
import { mockCustomPrograms } from "@/features/treatments/custom-programs/data/customPrograms.mock";
import { mockProgramQuestions } from "@/features/treatments/programs/data/programQuestions.mock";
import { mockPrograms } from "@/features/treatments/programs/data/programs.mock";
import { mockSections } from "@/features/treatments/libraries/data/sections.mock";
import { mockTreatmentTypes } from "@/features/treatments/libraries/data/treatmentTypes.mock";
import { mockContentLibraryStats } from "@/features/treatments/libraries/data/stats.mock";
import { createMockId, currentDateStamp } from "@/features/treatments/common/data/factories";

// Keys for localStorage
const KEYS = {
  TREATMENT_TYPES: "welliemd_mock_treatment_types",
  PROGRAMS: "welliemd_mock_programs",
  SECTIONS: "welliemd_mock_sections",
  CONSENTS: "welliemd_mock_consents",
  CUSTOM_PROGRAMS: "welliemd_mock_custom_programs",
  PROGRAM_QUESTIONS: "welliemd_mock_program_questions",
  SECTION_FIELDS: "welliemd_mock_section_fields",
};

const SEED_VERSION_KEY = "welliemd_mock_data_version_v9";

const checkAndSeedMockData = () => {
  const seeded = localStorage.getItem(SEED_VERSION_KEY);
  if (!seeded) {
    localStorage.removeItem(KEYS.CUSTOM_PROGRAMS);
    localStorage.removeItem(KEYS.PROGRAMS);
    localStorage.removeItem(KEYS.TREATMENT_TYPES);
    localStorage.removeItem(KEYS.SECTIONS);
    localStorage.removeItem(KEYS.CONSENTS);
    localStorage.removeItem(KEYS.PROGRAM_QUESTIONS);
    localStorage.removeItem(KEYS.SECTION_FIELDS);

    localStorage.setItem(KEYS.CUSTOM_PROGRAMS, JSON.stringify(mockCustomPrograms));
    localStorage.setItem(KEYS.PROGRAMS, JSON.stringify(mockPrograms));
    localStorage.setItem(KEYS.TREATMENT_TYPES, JSON.stringify(mockTreatmentTypes));
    localStorage.setItem(KEYS.SECTIONS, JSON.stringify(mockSections));
    localStorage.setItem(KEYS.CONSENTS, JSON.stringify(mockConsents));

    const initialQuestions: Record<string, ProgramQuestion[]> = {
      "program-glp-intake": mockProgramQuestions,
      "program-compounded-glp-intake": mockProgramQuestions,
      "program-branded-glp-intake": mockProgramQuestions,
      "program-glp-microdose": mockProgramQuestions,
      "program-ed-intake": mockProgramQuestions.slice(0, 2),
      "program-trt-intake": mockProgramQuestions.slice(0, 3),
      "sec-medical-baseline": [
        {
          id: "medical-conditions",
          order: 1,
          text: "Please identify all your current medical conditions",
          kind: "multiple_choice",
          section: "Medical Baseline",
          required: true,
          choices: ["Hypertension", "Diabetes", "Asthma", "None"]
        },
        {
          id: "current-medications",
          order: 2,
          text: "Please list all your current medications including dosages",
          kind: "text",
          section: "Medical Baseline",
          required: true,
        },
        {
          id: "known-allergies",
          order: 3,
          text: "Please list all of your known allergies",
          kind: "multiple_choice",
          section: "Medical Baseline",
          required: true,
          choices: ["Penicillin", "Peanuts", "None"]
        },
        {
          id: "past-surgeries",
          order: 4,
          text: "Past surgeries",
          kind: "text",
          section: "Medical Baseline",
          required: false,
        },
        {
          id: "family-medical-history",
          order: 5,
          text: "Family medical history",
          kind: "text",
          section: "Medical Baseline",
          required: false,
        },
      ],
      "sec-body-stats": [
        {
          id: "highest-weight",
          order: 1,
          text: "What was the highest weight that you have reached?",
          kind: "text",
          section: "Body Stats",
          required: true,
        },
      ]
    };
    localStorage.setItem(KEYS.PROGRAM_QUESTIONS, JSON.stringify(initialQuestions));

    const initialSectionFields: Record<string, any[]> = {
      "sec-medical-baseline": initialQuestions["sec-medical-baseline"].map(q => ({
        id: q.id,
        sectionId: "sec-medical-baseline",
        order: q.order,
        label: q.text,
        kind: q.kind,
        required: q.required,
      })),
      "sec-body-stats": initialQuestions["sec-body-stats"].map(q => ({
        id: q.id,
        sectionId: "sec-body-stats",
        order: q.order,
        label: q.text,
        kind: q.kind,
        required: q.required,
      }))
    };
    localStorage.setItem(KEYS.SECTION_FIELDS, JSON.stringify(initialSectionFields));

    localStorage.setItem(SEED_VERSION_KEY, "true");
  }
};

if (typeof window !== "undefined") {
  checkAndSeedMockData();
}

// Initializers
const getStored = <T>(key: string, defaults: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

const setStored = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Seed/Load data
const getTreatmentTypes = () => getStored(KEYS.TREATMENT_TYPES, mockTreatmentTypes);
const getPrograms = () => getStored(KEYS.PROGRAMS, mockPrograms);
const getSections = () => getStored(KEYS.SECTIONS, mockSections);
const getConsents = () => getStored(KEYS.CONSENTS, mockConsents);
const getCustomPrograms = () => {
  const stored = getStored<CustomProgram[]>(KEYS.CUSTOM_PROGRAMS, mockCustomPrograms);
  if (stored.length < mockCustomPrograms.length) {
    const merged = [...stored];
    mockCustomPrograms.forEach(def => {
      if (!merged.some(p => p.id === def.id)) {
        merged.push(def);
      }
    });
    setStored(KEYS.CUSTOM_PROGRAMS, merged);
    return merged;
  }
  return stored;
};

const getInitialSectionFields = () => {
  return {
    "sec-medical-baseline": [
      { id: "medical-conditions", sectionId: "sec-medical-baseline", order: 1, label: "Please identify all your current medical conditions", kind: "multiple_choice", required: true },
      { id: "current-medications", sectionId: "sec-medical-baseline", order: 2, label: "Please list all your current medications including dosages", kind: "text", required: true },
      { id: "known-allergies", sectionId: "sec-medical-baseline", order: 3, label: "Please list all of your known allergies", kind: "multiple_choice", required: true },
      { id: "past-surgeries", sectionId: "sec-medical-baseline", order: 4, label: "Past surgeries", kind: "text", required: false },
      { id: "family-medical-history", sectionId: "sec-medical-baseline", order: 5, label: "Family medical history", kind: "text", required: false },
    ],
    "sec-body-stats": [
      { id: "highest-weight", sectionId: "sec-body-stats", order: 1, label: "What was the highest weight that you have reached?", kind: "text", required: true },
    ]
  };
};
const getProgramQuestions = (programId: string) => {
  const allQuestions = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {
    "program-glp-intake": mockProgramQuestions,
    "program-compounded-glp-intake": mockProgramQuestions,
    "program-branded-glp-intake": mockProgramQuestions,
    "program-glp-microdose": mockProgramQuestions,
    "program-ed-intake": mockProgramQuestions.slice(0, 2),
    "program-trt-intake": mockProgramQuestions.slice(0, 3),
    "sec-medical-baseline": [
      {
        id: "medical-conditions",
        order: 1,
        text: "Please identify all your current medical conditions",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Hypertension", "Diabetes", "Asthma", "None"]
      },
      {
        id: "current-medications",
        order: 2,
        text: "Please list all your current medications including dosages",
        kind: "text",
        section: "Medical Baseline",
        required: true,
      },
      {
        id: "known-allergies",
        order: 3,
        text: "Please list all of your known allergies",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Penicillin", "Peanuts", "None"]
      },
      {
        id: "past-surgeries",
        order: 4,
        text: "Past surgeries",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
      {
        id: "family-medical-history",
        order: 5,
        text: "Family medical history",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
    ],
    "sec-body-stats": [
      {
        id: "highest-weight",
        order: 1,
        text: "What was the highest weight that you have reached?",
        kind: "text",
        section: "Body Stats",
        required: true,
      },
    ]
  });
  return allQuestions[programId] || [];
};

const setProgramQuestions = (programId: string, questions: ProgramQuestion[]) => {
  const allQuestions = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {
    "program-glp-intake": mockProgramQuestions,
    "program-compounded-glp-intake": mockProgramQuestions,
    "program-branded-glp-intake": mockProgramQuestions,
    "program-glp-microdose": mockProgramQuestions,
    "program-ed-intake": mockProgramQuestions.slice(0, 2),
    "program-trt-intake": mockProgramQuestions.slice(0, 3),
    "sec-medical-baseline": [
      {
        id: "medical-conditions",
        order: 1,
        text: "Please identify all your current medical conditions",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Hypertension", "Diabetes", "Asthma", "None"]
      },
      {
        id: "current-medications",
        order: 2,
        text: "Please list all your current medications including dosages",
        kind: "text",
        section: "Medical Baseline",
        required: true,
      },
      {
        id: "known-allergies",
        order: 3,
        text: "Please list all of your known allergies",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Penicillin", "Peanuts", "None"]
      },
      {
        id: "past-surgeries",
        order: 4,
        text: "Past surgeries",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
      {
        id: "family-medical-history",
        order: 5,
        text: "Family medical history",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
    ],
    "sec-body-stats": [
      {
        id: "highest-weight",
        order: 1,
        text: "What was the highest weight that you have reached?",
        kind: "text",
        section: "Body Stats",
        required: true,
      },
    ]
  });
  allQuestions[programId] = questions;
  setStored(KEYS.PROGRAM_QUESTIONS, allQuestions);
};

const getSectionFields = (sectionId: string) => {
  const allFields = getStored<Record<string, any[]>>(KEYS.SECTION_FIELDS, getInitialSectionFields());
  return allFields[sectionId] || [];
};

const setSectionFields = (sectionId: string, fields: any[]) => {
  const allFields = getStored<Record<string, any[]>>(KEYS.SECTION_FIELDS, getInitialSectionFields());
  allFields[sectionId] = fields;
  setStored(KEYS.SECTION_FIELDS, allFields);
};


const resolveMock = async <T>(value: T): Promise<T> => Promise.resolve(value);

export const treatmentsApi = {
  listStats: (): Promise<ContentLibraryStats> => {
    const stats: ContentLibraryStats = {
      consentForms: getConsents().length,
      commonSections: getSections().length,
      programs: getPrograms().length,
      customPrograms: getCustomPrograms().length,
    };
    return resolveMock(stats);
  },
  listTreatmentTypes: (): Promise<TreatmentType[]> => resolveMock(getTreatmentTypes()),
  listPrograms: (): Promise<Program[]> => resolveMock(getPrograms()),
  listSections: (): Promise<CommonSection[]> => resolveMock(getSections()),
  listConsents: (): Promise<ConsentForm[]> => resolveMock(getConsents()),
  listCustomPrograms: (): Promise<CustomProgram[]> => resolveMock(getCustomPrograms()),

  getCustomProgram: (id: string): Promise<CustomProgram | undefined> =>
    resolveMock(getCustomPrograms().find((program) => program.id === id)),

  getProgram: (id: string): Promise<Program | undefined> =>
    resolveMock(getPrograms().find((program) => program.id === id)),

  listProgramQuestions: (programId: string): Promise<ProgramQuestion[]> =>
    resolveMock(getProgramQuestions(programId)),

  saveProgramQuestions: (programId: string, questions: ProgramQuestion[]): Promise<ProgramQuestion[]> => {
    setProgramQuestions(programId, questions);
    return resolveMock(questions);
  },

  // Mutations
  saveCustomProgram: (program: CustomProgram): Promise<CustomProgram> => {
    const list = getCustomPrograms();
    const index = list.findIndex((p) => p.id === program.id);
    if (index >= 0) {
      list[index] = { ...program, updatedAt: currentDateStamp() };
    } else {
      list.push({ ...program, id: createMockId("custom"), updatedAt: currentDateStamp() });
    }
    setStored(KEYS.CUSTOM_PROGRAMS, list);
    return resolveMock(program);
  },

  deleteCustomProgram: (id: string): Promise<void> => {
    const list = getCustomPrograms().filter((p) => p.id !== id);
    setStored(KEYS.CUSTOM_PROGRAMS, list);
    return resolveMock(undefined);
  },

  saveProgram: (program: Program): Promise<Program> => {
    const list = getPrograms();
    const index = list.findIndex((p) => p.id === program.id);
    if (index >= 0) {
      list[index] = { ...program, updatedAt: new Date().toISOString().split("T")[0] };
    } else {
      list.push(program);
    }
    setStored(KEYS.PROGRAMS, list);
    return resolveMock(program);
  },

  saveProgramQuestion: (programId: string, question: ProgramQuestion): Promise<ProgramQuestion> => {
    const list = getProgramQuestions(programId);
    const index = list.findIndex((q) => q.id === question.id);
    if (index >= 0) {
      list[index] = question;
    } else {
      list.push(question);
    }
    setProgramQuestions(programId, list);
    return resolveMock(question);
  },

  deleteProgramQuestion: (programId: string, questionId: string): Promise<void> => {
    const list = getProgramQuestions(programId).filter((q) => q.id !== questionId);
    // Recalculate order
    const updated = list.map((q, idx) => ({ ...q, order: idx + 1 }));
    setProgramQuestions(programId, updated);
    return resolveMock(undefined);
  },

  reorderProgramQuestions: (programId: string, questionIds: string[]): Promise<void> => {
    const list = getProgramQuestions(programId);
    const reordered = questionIds.map((id, index) => {
      const found = list.find((q) => q.id === id);
      return { ...found!, order: index + 1 };
    });
    setProgramQuestions(programId, reordered);
    return resolveMock(undefined);
  },

  listSectionFields: (sectionId: string): Promise<any[]> => resolveMock(getSectionFields(sectionId)),

  saveSectionFields: (sectionId: string, fields: any[]): Promise<any[]> => {
    setSectionFields(sectionId, fields);
    return resolveMock(fields);
  },

  saveSectionField: (sectionId: string, field: any): Promise<any> => {
    const list = getSectionFields(sectionId);
    const index = list.findIndex((f) => f.id === field.id);
    if (index >= 0) {
      list[index] = field;
    } else {
      list.push(field);
    }
    setSectionFields(sectionId, list);
    return resolveMock(field);
  },

  deleteSectionField: (sectionId: string, fieldId: string): Promise<void> => {
    const list = getSectionFields(sectionId).filter((f) => f.id !== fieldId);
    const updated = list.map((f, idx) => ({ ...f, order: idx + 1 }));
    setSectionFields(sectionId, updated);
    return resolveMock(undefined);
  },

  reorderSectionFields: (sectionId: string, fieldIds: string[]): Promise<void> => {
    const list = getSectionFields(sectionId);
    const reordered = fieldIds.map((id, index) => {
      const found = list.find((f) => f.id === id);
      return { ...found!, order: index + 1 };
    });
    setSectionFields(sectionId, reordered);
    return resolveMock(undefined);
  },

  saveSection: (section: CommonSection): Promise<CommonSection> => {
    const list = getSections();
    const index = list.findIndex((s) => s.id === section.id);
    if (index >= 0) {
      list[index] = { ...section, updatedAt: currentDateStamp() };
    } else {
      list.push({ ...section, id: createMockId("section"), updatedAt: currentDateStamp() });
    }
    setStored(KEYS.SECTIONS, list);
    return resolveMock(section);
  },

  deleteSection: (id: string): Promise<void> => {
    const list = getSections().filter((s) => s.id !== id);
    setStored(KEYS.SECTIONS, list);
    return resolveMock(undefined);
  },

  saveConsent: (consent: ConsentForm): Promise<ConsentForm> => {
    const list = getConsents();
    const index = list.findIndex((c) => c.id === consent.id);
    if (index >= 0) {
      list[index] = { ...consent, updatedAt: currentDateStamp() };
    } else {
      list.push({ ...consent, id: createMockId("consent"), updatedAt: currentDateStamp() });
    }
    setStored(KEYS.CONSENTS, list);
    return resolveMock(consent);
  },

  deleteConsent: (id: string): Promise<void> => {
    const list = getConsents().filter((c) => c.id !== id);
    setStored(KEYS.CONSENTS, list);
    return resolveMock(undefined);
  },

  saveTreatmentType: (type: TreatmentType): Promise<TreatmentType> => {
    const list = getTreatmentTypes();
    const index = list.findIndex((t) => t.id === type.id || t.key === type.key);
    if (index >= 0) {
      list[index] = type;
    } else {
      list.push({ ...type, id: createMockId("tt") });
    }
    setStored(KEYS.TREATMENT_TYPES, list);
    return resolveMock(type);
  },

  deleteTreatmentType: (id: string): Promise<void> => {
    const list = getTreatmentTypes().filter((t) => t.id !== id);
    setStored(KEYS.TREATMENT_TYPES, list);
    return resolveMock(undefined);
  },
};
