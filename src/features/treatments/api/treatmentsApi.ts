import type {
  CommonSection,
  ConsentForm,
  ContentLibraryStats,
  CustomProgram,
  Program,
  ProgramQuestion,
  TreatmentType,
} from "../types";
import {
  mockConsents,
  mockContentLibraryStats,
  mockCustomPrograms,
  mockProgramQuestions,
  mockPrograms,
  mockSections,
  mockTreatmentTypes,
} from "../data/mockTreatmentLibraries";

const resolveMock = async <T>(value: T): Promise<T> => Promise.resolve(value);

export const treatmentsApi = {
  listStats: (): Promise<ContentLibraryStats> => resolveMock(mockContentLibraryStats),
  listTreatmentTypes: (): Promise<TreatmentType[]> => resolveMock(mockTreatmentTypes),
  listPrograms: (): Promise<Program[]> => resolveMock(mockPrograms),
  listSections: (): Promise<CommonSection[]> => resolveMock(mockSections),
  listConsents: (): Promise<ConsentForm[]> => resolveMock(mockConsents),
  listCustomPrograms: (): Promise<CustomProgram[]> => resolveMock(mockCustomPrograms),
  getCustomProgram: (id: string): Promise<CustomProgram | undefined> =>
    resolveMock(mockCustomPrograms.find((program) => program.id === id) ?? mockCustomPrograms[0]),
  getProgram: (id: string): Promise<Program | undefined> =>
    resolveMock(mockPrograms.find((program) => program.id === id) ?? mockPrograms[0]),
  listProgramQuestions: (_programId: string): Promise<ProgramQuestion[]> =>
    resolveMock(mockProgramQuestions),
};
