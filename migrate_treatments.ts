import { Project } from "ts-morph";
import * as path from "path";

async function main() {
  const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
  });

  const baseDir = "./src/features/treatments";

  // Directories we want to create
  const dirs = {
    common: project.createDirectory(`${baseDir}/common`),
    commonComponents: project.createDirectory(`${baseDir}/common/components`),
    commonData: project.createDirectory(`${baseDir}/common/data`),

    programs: project.createDirectory(`${baseDir}/programs`),
    programsPages: project.createDirectory(`${baseDir}/programs/pages`),
    programsComponents: project.createDirectory(`${baseDir}/programs/components`),
    programsData: project.createDirectory(`${baseDir}/programs/data`),
    programsCheckoutComponents: project.createDirectory(`${baseDir}/programs/checkout-question/components`),
    programsCheckoutHooks: project.createDirectory(`${baseDir}/programs/checkout-question/hooks`),
    programsCheckoutUtils: project.createDirectory(`${baseDir}/programs/checkout-question/utils`),

    customPrograms: project.createDirectory(`${baseDir}/custom-programs`),
    customProgramsPages: project.createDirectory(`${baseDir}/custom-programs/pages`),
    customProgramsComponents: project.createDirectory(`${baseDir}/custom-programs/components`),
    customProgramsHooks: project.createDirectory(`${baseDir}/custom-programs/hooks`),
    customProgramsData: project.createDirectory(`${baseDir}/custom-programs/data`),

    flowBuilder: project.createDirectory(`${baseDir}/flow-builder`),
    flowBuilderPages: project.createDirectory(`${baseDir}/flow-builder/pages`),
    flowBuilderComponents: project.createDirectory(`${baseDir}/flow-builder/components`),
    flowBuilderCanvas: project.createDirectory(`${baseDir}/flow-builder/components/canvas`),
    flowBuilderTabs: project.createDirectory(`${baseDir}/flow-builder/components/tabs`),
    flowBuilderModals: project.createDirectory(`${baseDir}/flow-builder/components/modals`),
    flowBuilderCards: project.createDirectory(`${baseDir}/flow-builder/components/cards`),
    flowBuilderHooks: project.createDirectory(`${baseDir}/flow-builder/hooks`),
    flowBuilderUtils: project.createDirectory(`${baseDir}/flow-builder/utils`),

    questionEditor: project.createDirectory(`${baseDir}/question-editor`),
    questionEditorComponentsShell: project.createDirectory(`${baseDir}/question-editor/components/shell`),
    questionEditorComponentsTabs: project.createDirectory(`${baseDir}/question-editor/components/tabs`),
    questionEditorComponentsEditors: project.createDirectory(`${baseDir}/question-editor/components/editors`),
    questionEditorComponentsPreviews: project.createDirectory(`${baseDir}/question-editor/components/previews`),

    libraries: project.createDirectory(`${baseDir}/libraries`),
    librariesPages: project.createDirectory(`${baseDir}/libraries/pages`),
    librariesHooks: project.createDirectory(`${baseDir}/libraries/hooks`),
    librariesData: project.createDirectory(`${baseDir}/libraries/data`),
    librariesConsents: project.createDirectory(`${baseDir}/libraries/consents`),
    librariesSections: project.createDirectory(`${baseDir}/libraries/sections`),
    librariesTreatmentTypes: project.createDirectory(`${baseDir}/libraries/treatment-types`),
  };

  const moveFile = (oldRelativePath: string, newDirectory: any) => {
    const file = project.getSourceFile(`${baseDir}/${oldRelativePath}`);
    if (file) {
      file.moveToDirectory(newDirectory);
      console.log(`Moved ${oldRelativePath} -> ${newDirectory.getPath()}`);
    } else {
      console.warn(`File not found: ${oldRelativePath}`);
    }
  };

  // COMMON
  moveFile("components/common/DeleteConfirmDialog.tsx", dirs.commonComponents);
  moveFile("components/common/EmptyStateCard.tsx", dirs.commonComponents);
  moveFile("components/common/FilterToolbar.tsx", dirs.commonComponents);
  moveFile("components/common/LibraryContentCard.tsx", dirs.commonComponents);
  moveFile("components/common/LibraryStatCard.tsx", dirs.commonComponents);
  moveFile("components/common/PrototypeNotice.tsx", dirs.commonComponents);
  moveFile("components/common/StatusPill.tsx", dirs.commonComponents);
  moveFile("components/common/TreatmentPageHeader.tsx", dirs.commonComponents);
  // delete components/common/index.ts (if exists) -> ignore or let it be orphaned
  moveFile("data/factories.ts", dirs.commonData);
  moveFile("data/mockIds.ts", dirs.commonData);
  moveFile("utils/labels.ts", dirs.common.createDirectory(`${baseDir}/common/utils`));

  // PROGRAMS
  moveFile("pages/ProgramsPage.tsx", dirs.programsPages);
  moveFile("pages/ProgramDetailPage.tsx", dirs.programsPages);
  moveFile("pages/ProgramQuestionsListPage.tsx", dirs.programsPages);
  moveFile("data/programs.mock.ts", dirs.programsData);
  moveFile("data/programQuestions.mock.ts", dirs.programsData);
  moveFile("components/programs/AddConsentModal.tsx", dirs.programsComponents);
  moveFile("components/programs/AuthSetupModal.tsx", dirs.programsComponents);
  moveFile("components/programs/CheckoutQuestionModal.tsx", dirs.programsComponents);
  moveFile("components/programs/ConsentSelectorModal.tsx", dirs.programsComponents);
  moveFile("components/programs/CreateProgramModal.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramAuthentication.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramCheckoutQuestions.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramConsents.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramDetailHeader.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramFlowCanvas.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramListTable.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramMetrics.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramQuestionList.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramQuestionsListRow.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramQuestionsList.tsx", dirs.programsComponents);
  moveFile("components/programs/ProgramScreeningQuestions.tsx", dirs.programsComponents);
  moveFile("components/programs/SectionSelectorModal.tsx", dirs.programsComponents);
  moveFile("components/programs/TreatmentProgramCard.tsx", dirs.programsComponents);

  // Checkout module
  moveFile("components/programs/checkout-question/CheckoutPatientPreview.tsx", dirs.programsCheckoutComponents);
  moveFile("components/programs/checkout-question/CheckoutProductsSection.tsx", dirs.programsCheckoutComponents);
  moveFile("components/programs/checkout-question/CheckoutVisibilitySection.tsx", dirs.programsCheckoutComponents);
  moveFile("components/programs/checkout-question/useCheckoutQuestionForm.ts", dirs.programsCheckoutHooks);
  moveFile("components/programs/checkout-question/checkoutQuestionConstants.ts", dirs.programsCheckoutUtils);

  // CUSTOM PROGRAMS
  moveFile("pages/CustomProgramsPage.tsx", dirs.customProgramsPages);
  moveFile("components/custom-programs/CatalogConnectionsDialog.tsx", dirs.customProgramsComponents);
  moveFile("components/custom-programs/CustomProgramCard.tsx", dirs.customProgramsComponents);
  moveFile("components/custom-programs/CustomProgramModal.tsx", dirs.customProgramsComponents);
  moveFile("components/custom-programs/CustomProgramsContent.tsx", dirs.customProgramsComponents);
  moveFile("components/custom-programs/CustomProgramsToolbar.tsx", dirs.customProgramsComponents);
  moveFile("components/custom-programs/CustomProgramTable.tsx", dirs.customProgramsComponents);
  moveFile("hooks/useCustomProgramsPage.ts", dirs.customProgramsHooks);
  moveFile("data/customPrograms.mock.ts", dirs.customProgramsData);

  // FLOW BUILDER
  moveFile("pages/CustomProgramBuilderPage.tsx", dirs.flowBuilderPages);
  moveFile("hooks/useCustomProgramFlowBuilder.ts", dirs.flowBuilderHooks);
  moveFile("utils/flowBuilderDrag.ts", dirs.flowBuilderUtils);
  moveFile("utils/flowBuilderGraph.ts", dirs.flowBuilderUtils);
  moveFile("components/builder/CustomProgramFlowBuilder.tsx", dirs.flowBuilderComponents);
  moveFile("components/builder/flow/FlowBuilderCanvas.tsx", dirs.flowBuilderCanvas);
  moveFile("components/builder/flow/FlowBuilderHeader.tsx", dirs.flowBuilderCanvas);
  moveFile("components/builder/flow/FlowBuilderListView.tsx", dirs.flowBuilderCanvas);
  moveFile("components/builder/flow/FlowBuilderSidebar.tsx", dirs.flowBuilderCanvas);
  moveFile("components/builder/flow/FlowCanvasChip.tsx", dirs.flowBuilderCanvas);
  moveFile("components/builder/tabs/CheckoutOptionTab.tsx", dirs.flowBuilderTabs);
  moveFile("components/builder/tabs/ConsentLibraryTab.tsx", dirs.flowBuilderTabs);
  moveFile("components/builder/tabs/FieldLibraryTab.tsx", dirs.flowBuilderTabs);
  moveFile("components/builder/tabs/ProgramLibraryTab.tsx", dirs.flowBuilderTabs);
  moveFile("components/builder/tabs/QuestionCreatorTab.tsx", dirs.flowBuilderTabs);
  moveFile("components/builder/AddToFlowDrawer.tsx", dirs.flowBuilderModals);
  moveFile("components/builder/PatientFlowTestModal.tsx", dirs.flowBuilderModals);
  moveFile("components/builder/FlowItemCard.tsx", dirs.flowBuilderCards);

  // QUESTION EDITOR
  moveFile("components/question-editor/QuestionEditorDialog.tsx", dirs.questionEditorComponentsShell);
  moveFile("components/question-editor/components/QuestionEditorSidebar.tsx", dirs.questionEditorComponentsShell);
  moveFile("components/question-editor/components/QuestionEditorHeader.tsx", dirs.questionEditorComponentsShell);
  moveFile("components/question-editor/subcomponents/QuestionContentTab.tsx", dirs.questionEditorComponentsTabs);
  moveFile("components/question-editor/subcomponents/QuestionPreviewTab.tsx", dirs.questionEditorComponentsTabs);
  moveFile("components/question-editor/subcomponents/QuestionSetupTab.tsx", dirs.questionEditorComponentsTabs);
  moveFile("components/question-editor/subcomponents/QuestionVisibilityTab.tsx", dirs.questionEditorComponentsTabs);
  moveFile("components/question-editor/editors/AuthEditor.tsx", dirs.questionEditorComponentsEditors);
  moveFile("components/question-editor/editors/CheckoutEditor.tsx", dirs.questionEditorComponentsEditors);
  moveFile("components/question-editor/editors/StandardEditor.tsx", dirs.questionEditorComponentsEditors);
  moveFile("components/question-editor/previews/AuthPatientPreview.tsx", dirs.questionEditorComponentsPreviews);

  // LIBRARIES
  moveFile("pages/ContentLibrariesPage.tsx", dirs.librariesPages);
  moveFile("pages/ConsentsPage.tsx", dirs.librariesPages);
  moveFile("pages/SectionsPage.tsx", dirs.librariesPages);
  moveFile("pages/TreatmentTypeDetailPage.tsx", dirs.librariesPages);
  moveFile("pages/TreatmentTypesPage.tsx", dirs.librariesPages);
  moveFile("hooks/useTreatmentLibraries.ts", dirs.librariesHooks);
  moveFile("data/consents.mock.ts", dirs.librariesData);
  moveFile("data/sections.mock.ts", dirs.librariesData);
  moveFile("data/treatmentTypes.mock.ts", dirs.librariesData);
  moveFile("components/consents/ConsentDetailModal.tsx", dirs.librariesConsents);
  moveFile("components/consents/ConsentEditModal.tsx", dirs.librariesConsents);
  moveFile("components/consents/ConsentListTable.tsx", dirs.librariesConsents);
  moveFile("components/sections/SectionListTable.tsx", dirs.librariesSections);
  moveFile("components/sections/SectionModal.tsx", dirs.librariesSections);
  moveFile("components/treatment-types/TreatmentTypeModal.tsx", dirs.librariesTreatmentTypes);
  moveFile("components/treatment-types/TreatmentTypeTable.tsx", dirs.librariesTreatmentTypes);

  // Update pages/index.ts exports because we moved the files out of pages/
  const pagesIndex = project.getSourceFile(`${baseDir}/pages/index.ts`);
  if (pagesIndex) {
    console.log("Updating pages/index.ts exports...");
    // Just delete it. We'll fix App.tsx below.
    pagesIndex.delete();
  }

  const dataIndex = project.getSourceFile(`${baseDir}/data/index.ts`);
  if (dataIndex) {
    dataIndex.delete();
  }

  const commonIndex = project.getSourceFile(`${baseDir}/components/common/index.ts`);
  if (commonIndex) {
    commonIndex.delete();
  }

  console.log("Saving changes...");
  await project.save();
  console.log("Migration complete!");
}

main().catch(console.error);
