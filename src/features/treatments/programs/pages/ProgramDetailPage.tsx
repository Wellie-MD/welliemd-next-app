import { useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

import {
  usePrograms,
  useProgramQuestions,
  useConsents,
  useSaveProgram,
  useSaveProgramQuestions,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";

import { ProgramFlowBuilder } from "@/features/treatments/programs/flow-builder/ProgramFlowBuilder";
import { ProgramDetailHeader } from "@/features/treatments/programs/components/ProgramDetailHeader";
import { ProgramMetrics } from "@/features/treatments/programs/components/ProgramMetrics";
import { ProgramCheckoutQuestions } from "@/features/treatments/programs/components/ProgramCheckoutQuestions";
import { ProgramScreeningQuestions } from "@/features/treatments/programs/components/ProgramScreeningQuestions";
import { ProgramConsents } from "@/features/treatments/programs/components/ProgramConsents";
import { ProgramAuthentication } from "@/features/treatments/programs/components/ProgramAuthentication";
import { CheckoutQuestionModal } from "@/features/treatments/programs/components/CheckoutQuestionModal";
import { AuthSetupModal } from "@/features/treatments/programs/components/AuthSetupModal";
import { SectionSelectorModal } from "@/features/treatments/programs/components/SectionSelectorModal";
import { QuestionEditorDialog } from "@/features/treatments/question-editor/components/shell/QuestionEditorDialog";
import { AddConsentModal } from "@/features/treatments/programs/components/AddConsentModal";
import { PatientFlowTestModal } from "@/features/treatments/flow-builder/components/modals/PatientFlowTestModal";
import { createMockId } from "@/features/treatments/common/data/factories";
import type { CommonSection, ProgramAuthConfig, ProgramCheckoutQuestion, ProgramQuestion } from "@/features/treatments/types";
import { DeleteConfirmDialog } from "@/features/treatments/common/components";



const defaultAuthConfig = {
  email: true,
  phone: false,
  identity: false,
  account: true,
};

export default function ProgramDetailPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeProgramId = programId || "program-glp-microdose";

  // Queries
  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms();
  const { data: allConsents = [] } = useConsents();

  const foundProgram = programs.find((p) => p.id === activeProgramId || p.slug === activeProgramId);
  const { data: allQuestions = [], isLoading: isQuestionsLoading } = useProgramQuestions(foundProgram?.id || "");

  // Mutations
  const saveProgramMutation = useSaveProgram();
  const saveProgramQuestionsMutation = useSaveProgramQuestions(foundProgram?.id || "");

  const isFlowBuilderRoute = location.pathname.endsWith("/flow-builder");
  const viewMode = isFlowBuilderRoute ? "flow" : "list";

  const setViewMode = (mode: "list" | "flow") => {
    navigate(
      mode === "flow"
        ? `/dashboard/treatments/programs/${foundProgram?.id || activeProgramId}/flow-builder`
        : `/dashboard/treatments/programs/${foundProgram?.id || activeProgramId}`,
      { replace: true }
    );
  };

  // Dialog control states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

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
    ...programSpecificConsents.map(c => ({ id: c.id, name: c.name, scope: "treatment" })),
  ];

  const authEmail = foundProgram.authConfig?.email ?? true;
  const authPhone = foundProgram.authConfig?.phone ?? false;
  const authIdentity = foundProgram.authConfig?.identity ?? false;
  const authAccount = foundProgram.authConfig?.account ? "At intake start (recommended)" : "Not required";

  const handleCopySlug = () => {
    navigator.clipboard.writeText(`welliemd.com/intake/${foundProgram.slug}`);
    toast({ title: "URL Copied", description: "Slug URL copied to clipboard." });
  };

  const handlePublish = () => {
    const nextStatus = foundProgram.status === "published" ? "draft" : "published";
    saveProgramMutation.mutate({
      ...foundProgram,
      status: nextStatus,
    });
    toast({
      title: nextStatus === "published" ? "Program Published" : "Program Reverted to Draft",
    });
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

  const confirmDeleteCheckout = () => {
    if (!checkoutDeleteId) return;
    const updatedCheckout = (foundProgram.checkoutQuestions || []).filter((cq) => cq.id !== checkoutDeleteId);
    saveProgramMutation.mutate({
      ...foundProgram,
      checkoutQuestions: updatedCheckout,
      checkoutQuestionCount: updatedCheckout.length,
    });
    setCheckoutDeleteId(null);
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

    saveProgramQuestionsMutation.mutate([...allQuestions, serviceAreaQuestion]);
    toast({
      title: "Service Area Check Added",
      description: "State routing question added to this program.",
    });
  };

  const handleSaveAuthConfig = (config: ProgramAuthConfig) => {
    saveProgramMutation.mutate({
      ...foundProgram,
      authConfig: config,
    });
    toast({ title: "Authentication Settings Saved" });
  };

  const handleAttachSection = (section: CommonSection) => {
    const nextOrder = Math.max(0, ...allQuestions.map((question) => question.order || 0)) + 1;
    const sectionQuestion: ProgramQuestion = {
      id: createMockId("q-section"),
      order: nextOrder,
      text: `${section.name} Section`,
      kind: "multiple_choice",
      section: section.name,
      required: true,
    };

    saveProgramQuestionsMutation.mutate([...allQuestions, sectionQuestion]);
    toast({ title: "Common Section Attached" });
  };

  const handleAddConsentById = (id: string) => {
    if ((foundProgram.consentIds || []).includes(id)) return;
    const updatedConsents = [...(foundProgram.consentIds || []), id];
    saveProgramMutation.mutate({
      ...foundProgram,
      consentIds: updatedConsents,
    });
  };

  const setAuthEmail = (val: boolean) => {
    saveProgramMutation.mutate({
      ...foundProgram,
      authConfig: {
        ...(foundProgram.authConfig || defaultAuthConfig),
        email: val,
      }
    });
  };

  const setAuthPhone = (val: boolean) => {
    saveProgramMutation.mutate({
      ...foundProgram,
      authConfig: {
        ...(foundProgram.authConfig || defaultAuthConfig),
        phone: val,
      }
    });
  };

  const setAuthIdentity = (val: boolean) => {
    saveProgramMutation.mutate({
      ...foundProgram,
      authConfig: {
        ...(foundProgram.authConfig || defaultAuthConfig),
        identity: val,
      }
    });
  };

  const setAuthAccount = (val: string) => {
    saveProgramMutation.mutate({
      ...foundProgram,
      authConfig: {
        ...(foundProgram.authConfig || defaultAuthConfig),
        account: val.includes("recommended") || val === "true" || val === "At intake start (recommended)",
      }
    });
  };

  return (
    <div className="p-6 lg:p-8 w-full bg-[#f8fafc] min-h-screen">
      
      <ProgramDetailHeader
        programName={foundProgram.name}
        programStatus={foundProgram.status}
        programStage={foundProgram.stage}
        visitType={foundProgram.visitType || "weightloss"}
        slug={foundProgram.slug}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPublishToggle={handlePublish}
        onSimulate={() => setIsSimulateOpen(true)}
        onQuestions={() => setViewMode("list")}
        onReorder={() => navigate(`/dashboard/treatments/programs/${foundProgram.id}/questions`)}
        onAddElement={handleOpenAddScreening}
        onAddQuestion={handleOpenAddScreening}
        onAddAuth={() => setIsAuthOpen(true)}
        onAddServiceArea={handleOpenAddServiceArea}
        onAddSection={() => setIsSectionOpen(true)}
        onAddConsent={() => setIsConsentOpen(true)}
        onAddCheckout={handleOpenAddCheckout}
        onCopySlug={handleCopySlug}
        onSaveSlug={(newSlug) => {
          saveProgramMutation.mutate({
            ...foundProgram,
            slug: newSlug,
          });
          toast({
            title: "Slug Updated",
            description: `Program slug updated to: ${newSlug}`,
          });
        }}
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
            onViewAll={() => navigate(`/dashboard/treatments/programs/${foundProgram.id}/questions`)}
          />
          <ProgramConsents
            consents={consentsForUI}
            onAddConsent={() => setIsConsentOpen(true)}
          />
          <ProgramAuthentication
            authEmail={authEmail}
            authPhone={authPhone}
            authIdentity={authIdentity}
            authAccount={authAccount}
            setAuthEmail={setAuthEmail}
            setAuthPhone={setAuthPhone}
            setAuthIdentity={setAuthIdentity}
            setAuthAccount={setAuthAccount}
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
          onSaveProgram={(updatedProgram) => saveProgramMutation.mutate(updatedProgram)}
        />
      )}

      {/* DIALOGS */}
      <CheckoutQuestionModal 
        open={isCheckoutOpen} 
        onOpenChange={setIsCheckoutOpen} 
        programName={foundProgram.name}
        screeningQuestions={allQuestions.map(q => ({ id: q.id, text: q.text }))}
        initialQuestion={
          editingCheckoutId 
            ? (foundProgram.checkoutQuestions || []).find(cq => cq.id === editingCheckoutId)
            : null
        }
        onSave={(data) => {
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
          saveProgramMutation.mutate({
            ...foundProgram,
            checkoutQuestions: updatedCheckout,
            checkoutQuestionCount: updatedCheckout.length,
          });
        }}
      />

      <QuestionEditorDialog
        open={isScreeningOpen}
        onOpenChange={setIsScreeningOpen}
        questions={allQuestions}
        programId={foundProgram.id}
        initialQuestionId={editingScreeningId || null}
        onSave={(updatedQuestion: ProgramQuestion) => {
          if (editingScreeningId) {
            const updatedQuestions: ProgramQuestion[] = allQuestions.map((sq) =>
              sq.id === editingScreeningId
                ? updatedQuestion
                : sq
            );
            saveProgramQuestionsMutation.mutate(updatedQuestions);
          } else {
            saveProgramQuestionsMutation.mutate([...allQuestions, updatedQuestion]);
          }
        }}
      />

      <AddConsentModal
        open={isConsentOpen}
        onOpenChange={setIsConsentOpen}
        onAddConsent={handleAddConsentById}
        attachedConsentIds={foundProgram.consentIds || []}
      />

      <AuthSetupModal
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        initialConfig={foundProgram.authConfig || defaultAuthConfig}
        onSave={handleSaveAuthConfig}
      />

      <SectionSelectorModal
        open={isSectionOpen}
        onOpenChange={setIsSectionOpen}
        onSelect={handleAttachSection}
      />

      <PatientFlowTestModal
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        previewContext={{
          type: "program",
          id: foundProgram.id,
          slug: foundProgram.slug,
          visitType: foundProgram.visitType,
          templateId: foundProgram.sourceQuestionnaireTemplateId,
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
      />
    </div>
  );
}
