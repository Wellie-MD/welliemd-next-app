import { useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

import {
  usePrograms,
  useProgramQuestions,
  useConsents,
  useTreatmentTypes,
  useSaveProgram,
  useUpdateProgramSlug,
  useSaveProgramQuestions,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import type { CommonSection, ProgramAuthConfig, ProgramCheckoutQuestion, ProgramQuestion } from "@/features/treatments/types";
import { ProgramFlowBuilder } from "@/features/treatments/programs/flow-builder/ProgramFlowBuilder";
import { ProgramDetailHeader } from "@/features/treatments/programs/components/ProgramDetailHeader";
import { ProgramConfigurationAccess } from "@/features/treatments/programs/components/ProgramConfigurationAccess";
import { CreateProgramModal } from "@/features/treatments/programs/components/CreateProgramModal";
import { ProgramMetrics } from "@/features/treatments/programs/components/ProgramMetrics";
import { ProgramCheckoutQuestions } from "@/features/treatments/programs/components/ProgramCheckoutQuestions";
import { ProgramScreeningQuestions } from "@/features/treatments/programs/components/ProgramScreeningQuestions";
import { ProgramConsents } from "@/features/treatments/programs/components/ProgramConsents";
import { ProgramEligibility } from "@/features/treatments/programs/components/ProgramEligibility";
import { CheckoutQuestionModal } from "@/features/treatments/programs/components/CheckoutQuestionModal";
import { SectionSelectorModal } from "@/features/treatments/programs/components/SectionSelectorModal";
import { QuestionEditorDialog } from "@/features/treatments/question-editor/components/shell/QuestionEditorDialog";
import { AddConsentModal } from "@/features/treatments/programs/components/AddConsentModal";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { createMockId } from "@/features/treatments/common/data/factories";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import { DeleteConfirmDialog } from "@/features/treatments/common/components";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import { TreatmentAssignmentModal } from "@/features/treatments/assignment/components/TreatmentAssignmentModal";
import { ASSIGNMENT_SOURCE } from "@/features/treatments/assignment/constants";



type ApiErrorData = {
  detail?: string;
  error?: string;
  message?: string;
};

type ApiErrorLike = {
  response?: {
    data?: ApiErrorData;
  };
  message?: string;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorLike;
  return (
    apiError.response?.data?.detail ||
    apiError.response?.data?.error ||
    apiError.response?.data?.message ||
    apiError.message ||
    fallback
  );
};

const normalizeQuestionKind = (type: string): QuestionKind => {
  switch (type) {
    case "single":
      return "single_choice";
    case "multiple":
      return "multiple_choice";
    case "text":
      return "text";
    case "number":
      return "number";
    default:
      return "number";
  }
};

export default function ProgramDetailPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeProgramId = programId || "program-glp-microdose";

  // Queries
  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms();
  const { data: allConsents = [] } = useConsents();
  const { data: treatmentTypes = [] } = useTreatmentTypes();

  const foundProgram = programs.find((p) => p.id === activeProgramId || p.slug === activeProgramId);
  const { data: allQuestions = [], isLoading: isQuestionsLoading } = useProgramQuestions(foundProgram?.id || "");

  // Mutations
  const saveProgramMutation = useSaveProgram();
  const updateProgramSlugMutation = useUpdateProgramSlug();
  const saveProgramQuestionsMutation = useSaveProgramQuestions(foundProgram?.id || "");

  const isFlowBuilderRoute =
    new URLSearchParams(location.search).get("view") === "flow";
  const viewMode = isFlowBuilderRoute ? "flow" : "list";

  const setViewMode = (mode: "list" | "flow") => {
    navigate(
      mode === "flow"
        ? ADMIN_TREATMENT_ROUTES.programQuestionsFlow(
            foundProgram?.id || activeProgramId
          )
        : ADMIN_TREATMENT_ROUTES.programQuestions(
            foundProgram?.id || activeProgramId
          ),
      { replace: true }
    );
  };

  // Dialog control states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Edit target states
  const [editingCheckoutId, setEditingCheckoutId] = useState<string | null>(null);
  const [editingScreeningId, setEditingScreeningId] = useState<string | null>(null);
  const [checkoutDeleteId, setCheckoutDeleteId] = useState<string | null>(null);

  if (isProgramsLoading || isQuestionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Program Details...</div>
      </div>
    );
  }

  if (!foundProgram) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-md font-extrabold text-slate-900 mb-2">Program Not Found</div>
        <div className="text-sm text-slate-500">The program with ID or slug "{activeProgramId}" could not be found.</div>
      </div>
    );
  }

  const screeningQuestionsForUI = allQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.kind === "single_choice" ? "single" : q.kind === "multiple_choice" ? "multiple" : "text",
    choices: q.choices || ["Yes", "No"],
  }));

  const programSpecificConsents = allConsents.filter(c => (foundProgram.consentIds || []).includes(c.id));
  const universalConsents = allConsents.filter(c => c.scope === "global");
  const consentsForUI = [
    ...universalConsents.map(c => ({ id: c.id, name: c.name, scope: "global" })),
    ...programSpecificConsents.map(c => ({ id: c.id, name: c.name, scope: "visit_type" })),
  ];

  const handleCopySlug = () => {
    void navigator.clipboard.writeText(foundProgram.slug);
    toast({ title: "Slug Copied", description: "Program slug copied to clipboard." });
  };

  const handlePublish = async () => {
    const nextStatus = foundProgram.status === "published" ? "draft" : "published";
    try {
      await saveProgramMutation.mutateAsync({
        id: foundProgram.id,
        status: nextStatus,
      } as any);
      toast({
        title: nextStatus === "published" ? "Program Published" : "Program Reverted to Draft",
      });
    } catch (error) {
      toast({
        title: "Unable to publish Program",
        description: getApiErrorMessage(error, "The Program could not be published."),
        variant: "destructive",
      });
    }
  };

  const handleOpenAddCheckout = () => {
    setEditingCheckoutId(null);
    setIsCheckoutOpen(true);
  };

  const handleOpenEditCheckout = (cq: ProgramCheckoutQuestion) => {
    setEditingCheckoutId(cq.id);
    setIsCheckoutOpen(true);
  };

  const handleDeleteCheckout = (id: string) => {
    setCheckoutDeleteId(id);
  };

  const confirmDeleteCheckout = async () => {
    if (!checkoutDeleteId) return;
    const updatedCheckout = (foundProgram.checkoutQuestions || []).filter((cq) => cq.id !== checkoutDeleteId);
    try {
      await saveProgramMutation.mutateAsync({
        id: foundProgram.id,
        checkoutQuestions: updatedCheckout,
        checkoutQuestionCount: updatedCheckout.length,
      } as any);
      setCheckoutDeleteId(null);
      toast({ title: "Checkout question deleted" });
    } catch (error) {
      toast({
        title: "Error deleting checkout question",
        description: getApiErrorMessage(error, "The checkout question could not be deleted."),
        variant: "destructive",
      });
    }
  };

  const handleOpenAddScreening = () => {
    setEditingScreeningId(null);
    setIsScreeningOpen(true);
  };

  const handleOpenAddServiceArea = () => {
    const nextOrder = Math.max(0, ...allQuestions.map((question) => question.order || 0)) + 1;
    const serviceAreaQuestion: ProgramQuestion = {
      id: createMockId("q-state"),
      order: nextOrder,
      text: "Which state are you located in?",
      kind: "state_routing",
      section: "Service Area",
      required: true,
    };

    saveProgramQuestionsMutation.mutateAsync([...allQuestions, serviceAreaQuestion])
      .then(() => {
        toast({
          title: "Service Area Check Added",
          description: "State routing question added to this program.",
        });
      })
      .catch((error) => {
        toast({
          title: "Error adding service area check",
          description: getApiErrorMessage(error, "The state routing question could not be saved."),
          variant: "destructive",
        });
      });
  };

  const handleSaveAuthConfig = (config: ProgramAuthConfig) => {
    saveProgramMutation.mutate({
      id: foundProgram.id,
      authConfig: config,
    } as any);
    toast({ title: "Authentication Settings Saved" });
  };

  const handleAttachSection = (section: CommonSection) => {
    if (allQuestions.some((question) =>
      question.kind === "section" &&
      String(question.elementConfig?.sourceSectionId || question.elementConfig?.sourceId || "") === section.id
    )) {
      toast({
        title: "Section already attached",
        description: "This section is already part of the program.",
      });
      return;
    }

    const nextOrder = Math.max(0, ...allQuestions.map((question) => question.order || 0)) + 1;
    const sectionQuestion: ProgramQuestion = {
      id: createMockId("q-section"),
      order: nextOrder,
      text: section.name,
      kind: "section",
      section: section.name,
      required: true,
      elementConfig: {
        sourceId: section.id,
        sourceSectionId: section.id,
        sourceSectionName: section.name,
        fieldCount: section.fieldCount,
        description: `${section.fieldCount} fields · Reusable from library`,
      },
    };

    saveProgramQuestionsMutation.mutateAsync([...allQuestions, sectionQuestion])
      .then(() => {
        toast({
          title: "Common Section Attached",
          description: `${section.fieldCount} fields · Reusable from library`,
        });
      })
      .catch((error) => {
        toast({
          title: "Error attaching section",
          description: getApiErrorMessage(error, "The section could not be attached."),
          variant: "destructive",
        });
      });
  };

  const handleAddConsentById = (id: string) => {
    if ((foundProgram.consentIds || []).includes(id)) return;
    const updatedConsents = [...(foundProgram.consentIds || []), id];
    saveProgramMutation.mutate({
      id: foundProgram.id,
      consentIds: updatedConsents,
    } as any);
  };

  const setSexRequirement = (val: "any" | "male" | "female") => {
    saveProgramMutation.mutate({ id: foundProgram.id, sexRequirement: val } as any);
  };

  const setMinAge = (val: number | null) => {
    saveProgramMutation.mutate({ id: foundProgram.id, minAge: val } as any);
  };

  const setMaxAge = (val: number | null) => {
    saveProgramMutation.mutate({ id: foundProgram.id, maxAge: val } as any);
  };

  const setMinBmi = (val: number | null) => {
    saveProgramMutation.mutate({ id: foundProgram.id, minBmi: val } as any);
  };

  const setMaxBmi = (val: number | null) => {
    saveProgramMutation.mutate({ id: foundProgram.id, maxBmi: val } as any);
  };

  return (
    <div className="p-6 lg:p-8 w-full bg-[#f8fafc] min-h-screen">

      <ProgramDetailHeader
        programName={foundProgram.name}
        programStatus={foundProgram.status}
        programStage={foundProgram.stage}
        visitType={foundProgram.visitType || ""}
        slug={foundProgram.slug}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPublishToggle={handlePublish}
        onSimulate={() => setIsSimulateOpen(true)}
        onAssign={() => setIsAssignOpen(true)}
        onQuestions={() => setViewMode("list")}
        onReorder={() => navigate(ADMIN_TREATMENT_ROUTES.programQuestions(foundProgram.id))}
        onAddElement={handleOpenAddScreening}
        onAddQuestion={handleOpenAddScreening}
        onAddAuth={() => setIsAuthOpen(true)}
        onAddServiceArea={handleOpenAddServiceArea}
        onAddSection={() => setIsSectionOpen(true)}
        onAddConsent={() => setIsConsentOpen(true)}
        onAddCheckout={handleOpenAddCheckout}
        onCopySlug={handleCopySlug}
        onSaveSlug={async (newSlug) => {
          try {
            await updateProgramSlugMutation.mutateAsync({
              programId: foundProgram.id,
              slug: newSlug,
            });
            toast({
              title: "Slug Updated",
              description: `Program slug updated to: ${newSlug}`,
            });
          } catch (error) {
            if (isDuplicateSlugError(error)) {
              showDuplicateSlugToast();
              return;
            }

            toast({
              title: "Error Updating Slug",
              description: getApiErrorMessage(error, "Slug could not be updated"),
              variant: "destructive",
            });
          }
        }}
      />

      <ProgramConfigurationAccess
        programId={foundProgram.id}
        treatmentTypeKey={foundProgram.treatmentTypeKey}
        serviceStatesAll={foundProgram.serviceStatesAll ?? true}
        serviceStates={foundProgram.serviceStates || []}
        serviceAreaCoverage={foundProgram.serviceAreaCoverage}
        onEditSettings={() => setIsSettingsOpen(true)}
      />

      {viewMode === "list" && (
        <ProgramMetrics
          screeningCount={allQuestions.length}
          checkoutCount={(foundProgram.checkoutQuestions || []).length}
          planCount={1}
          visitType={foundProgram.visitType || ""}
        />
      )}

      {viewMode === "list" ? (
        <div className="space-y-6">
          <ProgramCheckoutQuestions
            questions={foundProgram.checkoutQuestions || []}
            onAdd={handleOpenAddCheckout}
            onEdit={handleOpenEditCheckout}
            onDelete={handleDeleteCheckout}
          />
          <ProgramScreeningQuestions
            questions={screeningQuestionsForUI}
            onAdd={handleOpenAddScreening}
            onViewAll={() => navigate(ADMIN_TREATMENT_ROUTES.programQuestions(foundProgram.id))}
          />
          <ProgramConsents
            consents={consentsForUI}
            onAddConsent={() => setIsConsentOpen(true)}
          />
          <ProgramEligibility
            sexRequirement={foundProgram.sexRequirement || "any"}
            minAge={foundProgram.minAge ?? null}
            maxAge={foundProgram.maxAge ?? null}
            minBmi={foundProgram.minBmi ?? null}
            maxBmi={foundProgram.maxBmi ?? null}
            setSexRequirement={setSexRequirement}
            setMinAge={setMinAge}
            setMaxAge={setMaxAge}
            setMinBmi={setMinBmi}
            setMaxBmi={setMaxBmi}
          />
        </div>
      ) : (
        <ProgramFlowBuilder
          program={foundProgram}
          questions={allQuestions}
          allConsents={allConsents}
          onAddQuestion={handleOpenAddScreening}
          onEditQuestion={(questionId) => {
            setEditingScreeningId(questionId);
            setIsScreeningOpen(true);
          }}
          onAddCheckoutQuestion={handleOpenAddCheckout}
          onEditCheckoutQuestion={handleOpenEditCheckout}
          onSaveProgram={(updatedProgram) =>
            saveProgramMutation.mutate({
              id: updatedProgram.id,
              consentIds: updatedProgram.consentIds,
            } as any)
          }
        />
      )}

      {/* DIALOGS */}
      <CheckoutQuestionModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        programName={foundProgram.name}
        programTreatmentTypeKey={foundProgram.treatmentTypeKey}
        screeningQuestions={allQuestions}
        initialQuestion={
          editingCheckoutId
            ? (foundProgram.checkoutQuestions || []).find(cq => cq.id === editingCheckoutId)
            : null
        }
        onSave={async (data) => {
          let updatedCheckout = [...(foundProgram.checkoutQuestions || [])];
          if (editingCheckoutId) {
            updatedCheckout = updatedCheckout.map((cq) =>
              cq.id === editingCheckoutId
                ? { ...cq, ...data }
                : cq
            );
          } else {
            updatedCheckout.push({
              id: createMockId("cq"),
              ...data,
            });
          }
          await saveProgramMutation.mutateAsync({
            id: foundProgram.id,
            checkoutQuestions: updatedCheckout,
            checkoutQuestionCount: updatedCheckout.length,
          } as any);
          toast({
            title: editingCheckoutId ? "Checkout question updated" : "Checkout question added",
          });
        }}
      />

      <QuestionEditorDialog
        open={isScreeningOpen}
        onOpenChange={setIsScreeningOpen}
        questions={allQuestions}
        programId={foundProgram.id}
        programName={foundProgram.name}
        programTreatmentTypeKey={foundProgram.treatmentTypeKey}
        initialQuestionId={editingScreeningId || null}
        onSave={(updatedQuestion: ProgramQuestion) => {
          if (editingScreeningId) {
            const updatedQuestions: ProgramQuestion[] = allQuestions.map((sq) =>
              sq.id === editingScreeningId
                ? updatedQuestion
                : sq
            );
            saveProgramQuestionsMutation.mutateAsync(updatedQuestions).catch((error) => {
              toast({
                title: "Error saving question",
                description: getApiErrorMessage(error, "The question could not be saved."),
                variant: "destructive",
              });
            });
          } else {
            saveProgramQuestionsMutation.mutateAsync([...allQuestions, updatedQuestion]).catch((error) => {
              toast({
                title: "Error saving question",
                description: getApiErrorMessage(error, "The question could not be saved."),
                variant: "destructive",
              });
            });
          }
        }}
      />

      <AddConsentModal
        open={isConsentOpen}
        onOpenChange={setIsConsentOpen}
        onAddConsent={handleAddConsentById}
        attachedConsentIds={foundProgram.consentIds || []}
      />

      <SectionSelectorModal
        open={isSectionOpen}
        onOpenChange={setIsSectionOpen}
        onSelect={handleAttachSection}
      />

      <QuestionnairePreviewDialog
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        previewContext={{
          type: "program",
          id: foundProgram.id,
          slug: foundProgram.slug,
          name: foundProgram.name,
          visitType: foundProgram.visitType,
          templateId: foundProgram.sourceQuestionnaireTemplateId,
        }}
        subtitle={`Patient view of "${foundProgram.name}"`}
      />

      <TreatmentAssignmentModal
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        items={[
          {
            id: foundProgram.id,
            name: foundProgram.name,
            subtitle: foundProgram.treatmentTypeKey,
          },
        ]}
        sourceKind={ASSIGNMENT_SOURCE.program}
        itemLabel="program"
      />

      <CreateProgramModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        treatmentTypes={treatmentTypes}
        initialProgram={foundProgram}
        mode="edit"
        onSave={async (programData) => {
          try {
            await saveProgramMutation.mutateAsync({
              id: foundProgram.id,
              ...programData,
            });
            toast({
              title: "Program Updated",
              description: `Saved changes to ${programData.name}`,
            });
            setIsSettingsOpen(false);
            return true;
          } catch (error) {
            if (isDuplicateSlugError(error)) {
              showDuplicateSlugToast();
            } else {
              toast({
                title: "Error",
                description: getApiErrorMessage(error, "Failed to update program"),
                variant: "destructive",
              });
            }
            return false;
          }
        }}
      />

      <DeleteConfirmDialog
        open={Boolean(checkoutDeleteId)}
        onOpenChange={(open) => {
          if (!open) setCheckoutDeleteId(null);
        }}
        title="Delete checkout question?"
        description="This removes the configured Category / Regimen / Dose checkout mapping from this program."
        onConfirm={confirmDeleteCheckout}
        loading={saveProgramMutation.isPending}
      />
    </div>
  );
}
