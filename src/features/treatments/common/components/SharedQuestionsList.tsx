import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import type { ProgramAuthConfig, ProgramCheckoutQuestion, ProgramQuestion } from "@/features/treatments/types";
import { createMockId } from "@/features/treatments/common/data/factories";
import { useQueryClient } from "@tanstack/react-query";
import { treatmentsApi } from "@/features/treatments/api/treatmentsApi";
import {
  useDeleteSectionField,
  useSaveProgramQuestion,
  useSaveSectionField,
  useDeleteProgramQuestion,
  useReorderSectionFields,
  useReorderProgramQuestions,
  treatmentQueryKeys,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import type { QuestionFlowAdapter, QuestionFlowItem } from "@/features/treatments/question-flow-builder/types";
import { toast } from "@/components/ui/use-toast";

// Sub-modals & components
import { AuthSetupModal } from "@/features/treatments/programs/components/AuthSetupModal";
import { SectionSelectorModal } from "@/features/treatments/programs/components/SectionSelectorModal";
import { ConsentSelectorModal } from "@/features/treatments/programs/components/ConsentSelectorModal";
import { CheckoutQuestionModal } from "@/features/treatments/programs/components/CheckoutQuestionModal";
import { QuestionEditorDialog } from "@/features/treatments/question-editor/components/shell/QuestionEditorDialog";
import { QuestionListFilters } from "@/features/treatments/common/components/QuestionListFilters";
import { QuestionListHeader } from "@/features/treatments/common/components/QuestionListHeader";
import { QuestionListTable } from "@/features/treatments/common/components/QuestionListTable";
import { DeleteElementDialog } from "@/features/treatments/common/components/DeleteElementDialog";
import { countQuestionTypes, filterQuestions } from "@/features/treatments/common/utils/questionList";

import { QuestionFlowBuilder } from "@/features/treatments/question-flow-builder/components/QuestionFlowBuilder";

export interface SharedQuestionsListProps {
  entityId: string;
  entityName: string;
  entityType?: "program" | "section";
  initialQuestions: ProgramQuestion[];
  headerTitle: string;
  headerSubtitle: string;
  onBack: () => void;
  headerExtraActions?: React.ReactNode;
  authConfig?: ProgramAuthConfig;
  viewMode?: "list" | "flow";
  onViewModeChange?: (mode: "list" | "flow") => void;
  onOpenPreview?: () => void;
}

export function SharedQuestionsList({
  entityId,
  entityName,
  entityType = "program",
  initialQuestions,
  headerTitle,
  headerSubtitle,
  onBack,
  headerExtraActions,
  authConfig,
  viewMode = "list",
  onViewModeChange,
  onOpenPreview,
}: SharedQuestionsListProps) {
  const [questions, setQuestions] = useState<ProgramQuestion[]>(initialQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isReorderActive, setIsReorderActive] = useState(false);

  // Modal open states
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Active question editing/deleting state
  const [activeEditingQuestion, setActiveEditingQuestion] = useState<ProgramQuestion | null>(null);
  const [questionToDeleteId, setQuestionToDeleteId] = useState<string | null>(null);

  // Sync state if initialQuestions change
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  // Mutations
  const queryClient = useQueryClient();
  const saveQuestionMutation = useSaveProgramQuestion(entityId);
  const deleteQuestionMutation = useDeleteProgramQuestion(entityId);
  const reorderQuestionsMutation = useReorderProgramQuestions(entityId);
  const saveSectionFieldMutation = useSaveSectionField(entityId);
  const deleteSectionFieldMutation = useDeleteSectionField(entityId);
  const reorderSectionFieldsMutation = useReorderSectionFields(entityId);

  // Every flow starts with Patient Authentication. If no auth element was
  // explicitly added, lead the list with a non-persisted system entry so it
  // always reads correctly — matching the patient flow, where auth always
  // comes first. It isn't part of `questions` state and can't be removed.
  const displayQuestions = useMemo<ProgramQuestion[]>(() => {
    if (questions.some((q) => q.kind === "personal_details")) return questions;
    const systemAuthQuestion: ProgramQuestion = {
      id: `auth-system-${entityId}`,
      order: 0,
      text: "Patient Authentication",
      kind: "personal_details",
      section: entityName,
      required: true,
      system: true,
    };
    return [systemAuthQuestion, ...questions];
  }, [questions, entityId, entityName]);

  // Flow-builder adapter derived from the live questions, so the Flow view and
  // the List view share one source of truth and one persistence store. Adding
  // an element via the modals (which updates `questions`) re-seeds the canvas;
  // canvas reorders/deletes persist through the same program-questions store.
  const flowSubtitle = entityType === "program"
    ? `Internal Program • ${displayQuestions.length} elements`
    : `Common Section • ${displayQuestions.length} fields`;

  const flowBuilderAdapter = useMemo<QuestionFlowAdapter>(() => ({
    entityType,
    entityId,
    title: headerTitle,
    subtitle: flowSubtitle,
    items: [...displayQuestions]
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        order: q.order,
        text: q.text,
        kind: q.kind,
        required: q.required,
        metadata: { section: q.section, choices: q.choices },
      })),
    saveItems: async (newItems: QuestionFlowItem[]) => {
      const updated: ProgramQuestion[] = newItems.map((item, index) => {
        const existing = questions.find((q) => q.id === item.id);
        return {
          choices: existing?.choices,
          dqChoices: existing?.dqChoices,
          flags: existing?.flags,
          consentText: existing?.consentText,
          checkoutProductIds: existing?.checkoutProductIds,
          checkoutProducts: existing?.checkoutProducts,
          visibilityRule: existing?.visibilityRule,
          visibilityRuleGroup: existing?.visibilityRuleGroup,
          includeInQa: existing?.includeInQa,
          hiddenFromPatient: existing?.hiddenFromPatient,
          prefillFromPrevious: existing?.prefillFromPrevious,
          elementConfig: existing?.elementConfig,
          id: item.id,
          order: index + 1,
          text: item.text,
          kind: item.kind,
          required: item.required,
          section: existing?.section ?? (entityType === "section" ? entityName : "Default"),
        };
      });
      if (entityType === "section") {
        await treatmentsApi.saveSectionFields(
          entityId,
          updated.map((question) => ({
            id: question.id,
            sectionId: entityId,
            order: question.order,
            label: question.text,
            kind: question.kind,
            required: question.required,
            configuration: question.elementConfig || {},
          }))
        );
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sectionFields(entityId) });
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sections() });
      } else {
        await treatmentsApi.saveProgramQuestions(entityId, updated);
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(entityId) });
      }
      setQuestions(updated);
      toast({ title: "Flow Saved", description: "Question sequence saved successfully." });
    },
  }), [questions, displayQuestions, entityType, entityId, entityName, headerTitle, flowSubtitle, queryClient]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const updated = arrayMove(questions, oldIndex, newIndex).map((q, idx) => ({
        ...q,
        order: idx + 1,
      }));

      setQuestions(updated);
      const reorderMutation = entityType === "section"
        ? reorderSectionFieldsMutation
        : reorderQuestionsMutation;

      reorderMutation.mutate(
        updated.map((q) => q.id),
        {
          onSuccess: () => {
            toast({ title: "Order Saved", description: "The list order has been successfully saved." });
          },
          onError: () => {
            setQuestions(questions); // Rollback
            toast({ title: "Error", description: "Failed to save the new order.", variant: "destructive" });
          },
        }
      );
    }
  };

  const processedQuestions = useMemo(
    () => filterQuestions(displayQuestions, searchQuery, typeFilter),
    [displayQuestions, searchQuery, typeFilter]
  );
  const typeCounts = useMemo(() => countQuestionTypes(displayQuestions), [displayQuestions]);

  // Editing dispatch — every element kind (question, checkout, auth) opens
  // the same QuestionEditorDialog "Question Builder"; it switches its
  // middle/right panels internally based on the active question's kind.
  const handleEditClick = (q: ProgramQuestion) => {
    setActiveEditingQuestion(q);
    setIsQuestionOpen(true);
  };

  // Deleting confirmation
  const handleDeleteClick = (id: string) => {
    setQuestionToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDeleteId) {
      const deleteMutation = entityType === "section" ? deleteSectionFieldMutation : deleteQuestionMutation;
      deleteMutation.mutate(questionToDeleteId, {
        onSuccess: () => {
          setQuestions((prev) => prev.filter((q) => q.id !== questionToDeleteId));
          toast({ title: "Element Removed", description: "The element has been removed successfully." });
        },
      });
    }
    setIsDeleteDialogOpen(false);
  };

  // Add handlers
  const handleAddQuestionSave = (updatedQuestion: ProgramQuestion) => {
    const isEditing = questions.some((q) => q.id === updatedQuestion.id);

    const mutation = entityType === "section"
      ? saveSectionFieldMutation
      : saveQuestionMutation;
    const payload = entityType === "section"
      ? {
          id: updatedQuestion.id,
          sectionId: entityId,
          order: updatedQuestion.order,
          label: updatedQuestion.text,
          kind: updatedQuestion.kind,
          required: updatedQuestion.required,
          configuration: {
            choices: updatedQuestion.choices || [],
            dqChoices: updatedQuestion.dqChoices || [],
            visibilityRuleGroup: updatedQuestion.visibilityRuleGroup || {},
            includeInQa: updatedQuestion.includeInQa,
            hiddenFromPatient: updatedQuestion.hiddenFromPatient,
            prefillFromPrevious: updatedQuestion.prefillFromPrevious,
            ...(updatedQuestion.elementConfig || {}),
          },
        }
      : updatedQuestion;

    mutation.mutate(payload as never, {
      onSuccess: () => {
        setQuestions((prev) => {
          if (isEditing) {
            return prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));
          }
          return [...prev, updatedQuestion];
        });
        toast({ title: isEditing ? "Question Updated" : "Question Added" });
      },
    });
    setActiveEditingQuestion(null);
  };

  const saveElement = (element: ProgramQuestion, successTitle: string) => {
    const isEditing = questions.some((question) => question.id === element.id);
    const mutation = entityType === "section" ? saveSectionFieldMutation : saveQuestionMutation;
    const payload = entityType === "section"
      ? {
          id: element.id,
          sectionId: entityId,
          order: element.order,
          label: element.text,
          kind: element.kind,
          required: element.required,
          configuration: {
            choices: element.choices || [],
            dqChoices: element.dqChoices || [],
            consentText: element.consentText,
            checkoutProductIds: element.checkoutProductIds || [],
            checkoutProducts: element.checkoutProducts || [],
            visibilityRuleGroup: element.visibilityRuleGroup || {},
            includeInQa: element.includeInQa,
            hiddenFromPatient: element.hiddenFromPatient,
            prefillFromPrevious: element.prefillFromPrevious,
            ...(element.elementConfig || {}),
          },
        }
      : element;

    mutation.mutate(payload as never, {
      onSuccess: () => {
        setQuestions((previous) => isEditing
          ? previous.map((question) => question.id === element.id ? element : question)
          : [...previous, element]);
        toast({ title: successTitle });
      },
    });
  };

  const handleAddServiceArea = () => {
    if (questions.some((question) => question.kind === "state_routing")) {
      toast({
        title: "Service Area Check Already Added",
        description: "This flow already contains a service area check.",
      });
      return;
    }

    saveElement({
      id: createMockId("q-state"),
      order: questions.length + 1,
      text: "Service Area Check",
      kind: "state_routing",
      section: entityName,
      required: true,
    }, "Service Area Check Added");
  };

  const handleAddCheckoutSave = (data: Omit<ProgramCheckoutQuestion, "id">) => {
    const isEditing = !!activeEditingQuestion;
    const newQuestion: ProgramQuestion = {
      id: isEditing ? activeEditingQuestion!.id : createMockId("q-checkout"),
      order: isEditing ? activeEditingQuestion!.order : questions.length + 1,
      text: data.text,
      kind: "checkout",
      section: "Checkout",
      required: true,
      checkoutProductIds: data.products
        .map((product) => product.productId)
        .filter((productId): productId is string => Boolean(productId)),
      checkoutProducts: data.products,
      visibilityRuleGroup: data.visibilityRules,
      elementConfig: {
        checkoutProducts: data.products,
        checkoutProductIds: data.products
          .map((product) => product.productId)
          .filter((productId): productId is string => Boolean(productId)),
        visibilityRuleGroup: data.visibilityRules,
      },
    };

    saveElement(newQuestion, isEditing ? "Checkout Options Saved" : "Checkout Options Added");
    setActiveEditingQuestion(null);
  };

  if (viewMode === "flow") {
    const subtitle = flowSubtitle;

    return (
      <div className="flex flex-col min-h-screen bg-slate-50 w-full p-6">
        <QuestionFlowBuilder
          adapter={flowBuilderAdapter}
          entityType={entityType}
          title={headerTitle}
          subtitle={subtitle}
          viewMode="flow"
          onViewModeChange={onViewModeChange || (() => {})}
          onAddElementClick={() => {
            // For macro-style "Add Element" button, just open question modal for now, or maybe dropdown
            setIsQuestionOpen(true);
          }}
          onAddItemRequest={(kind) => {
            if (kind === "question") setIsQuestionOpen(true);
            if (kind === "auth") setIsAuthOpen(true);
            if (kind === "service_area") handleAddServiceArea();
            if (kind === "section") setIsSectionOpen(true);
            if (kind === "consent") setIsConsentOpen(true);
            if (kind === "checkout") setIsCheckoutOpen(true);
            if (!["question", "auth", "service_area", "section", "consent", "checkout"].includes(kind)) {
              setIsQuestionOpen(true);
            }
          }}
          onOpenPreview={onOpenPreview || (() => {})}
        />
        {/* Render Modals in flow mode too! */}
        <QuestionEditorDialog
          open={isQuestionOpen}
          onOpenChange={setIsQuestionOpen}
          onSave={handleAddQuestionSave}
          initialQuestionId={activeEditingQuestion?.id || null}
          questions={displayQuestions}
          programId={entityId}
        />
        <CheckoutQuestionModal
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          onSave={handleAddCheckoutSave}
          initialQuestion={null}
          programName={entityName}
          screeningQuestions={questions}
        />
        <AuthSetupModal
          open={isAuthOpen}
          onOpenChange={setIsAuthOpen}
          initialConfig={authConfig}
          onSave={(config) => {
            const authQuestion: ProgramQuestion = {
              id: createMockId("q-auth"),
              order: questions.length + 1,
              text: `Patient Authentication (Email, Phone, Identity, Account)`,
              kind: "personal_details",
              section: "Authentication",
              required: true,
              elementConfig: { authConfig: config },
            };
            saveElement(authQuestion, "Authentication Settings Saved");
          }}
        />
        <SectionSelectorModal
          open={isSectionOpen}
          onOpenChange={setIsSectionOpen}
          excludeSectionId={entityType === "section" ? entityId : undefined}
          onSelect={(section) => {
            const sectionQuestion: ProgramQuestion = {
              id: createMockId("q-section"),
              order: questions.length + 1,
              text: section.name,
              kind: entityType === "section" ? "section" : "multiple_choice",
              section: section.name,
              required: true,
              elementConfig: { sourceId: section.id },
            };
            saveElement(sectionQuestion, "Common Section Attached");
          }}
        />
        <ConsentSelectorModal
          open={isConsentOpen}
          onOpenChange={setIsConsentOpen}
          onSelect={(consent) => {
            const consentQuestion: ProgramQuestion = {
              id: createMockId("q-consent"),
              order: questions.length + 1,
              text: consent.name,
              kind: "consent",
              section: "Consents",
              required: true,
              consentText: `Patient must accept: ${consent.name}`,
              elementConfig: { sourceId: consent.id },
            };
            saveElement(consentQuestion, "Consent Form Attached");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full">
      <QuestionListHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        extraActions={headerExtraActions}
        reorderActive={isReorderActive}
        onBack={onBack}
        onToggleReorder={() => setIsReorderActive((active) => !active)}
        onAddQuestion={() => { setActiveEditingQuestion(null); setIsQuestionOpen(true); }}
        onAddAuth={() => { setActiveEditingQuestion(null); setIsAuthOpen(true); }}
        onAddServiceArea={handleAddServiceArea}
        onAddSection={() => { setActiveEditingQuestion(null); setIsSectionOpen(true); }}
        onAddConsent={() => { setActiveEditingQuestion(null); setIsConsentOpen(true); }}
        onAddCheckout={() => { setActiveEditingQuestion(null); setIsCheckoutOpen(true); }}
      />

      <main className="flex-1 p-6 w-full">
        <div className="mb-3.5">
          <QuestionListFilters
            counts={typeCounts}
            selectedType={typeFilter}
            searchQuery={searchQuery}
            onSelectType={setTypeFilter}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <QuestionListTable
            questions={processedQuestions}
            reorderActive={isReorderActive}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>
      </main>

      {/* Modals & Dialogs */}
      <QuestionEditorDialog
        open={isQuestionOpen}
        onOpenChange={setIsQuestionOpen}
        onSave={handleAddQuestionSave}
        initialQuestionId={activeEditingQuestion?.id || null}
        questions={displayQuestions}
        programId={entityId}
      />

      <CheckoutQuestionModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        onSave={handleAddCheckoutSave}
        initialQuestion={
          activeEditingQuestion
            ? {
                id: activeEditingQuestion.id,
                text: activeEditingQuestion.text,
                products: activeEditingQuestion.checkoutProducts || [],
                visibilityRules: activeEditingQuestion.visibilityRuleGroup || {
                  mode: "simple",
                  rules: [],
                },
              }
            : null
        }
        programName={entityName}
        screeningQuestions={questions}
      />

      <AuthSetupModal
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        initialConfig={authConfig}
        onSave={(config) => {
          const authQuestion: ProgramQuestion = {
            id: activeEditingQuestion?.id || createMockId("q-auth"),
            order: activeEditingQuestion?.order || questions.length + 1,
            text: `Patient Authentication (Email, Phone, Identity, Account)`,
            kind: "personal_details",
            section: "Authentication",
            required: true,
            elementConfig: { authConfig: config },
          };
          saveElement(authQuestion, "Authentication Settings Saved");
        }}
      />

      <SectionSelectorModal
        open={isSectionOpen}
        onOpenChange={setIsSectionOpen}
        excludeSectionId={entityType === "section" ? entityId : undefined}
        onSelect={(section) => {
          const sectionQuestion: ProgramQuestion = {
            id: createMockId("q-section"),
            order: questions.length + 1,
            text: section.name,
            kind: entityType === "section" ? "section" : "multiple_choice",
            section: section.name,
            required: true,
            elementConfig: { sourceId: section.id },
          };
          saveElement(sectionQuestion, "Common Section Attached");
        }}
      />

      <ConsentSelectorModal
        open={isConsentOpen}
        onOpenChange={setIsConsentOpen}
        onSelect={(consent) => {
          const consentQuestion: ProgramQuestion = {
            id: createMockId("q-consent"),
            order: questions.length + 1,
            text: consent.name,
            kind: "consent",
            section: "Consents",
            required: true,
            consentText: `Patient must accept: ${consent.name}`,
            elementConfig: { sourceId: consent.id },
          };
          saveElement(consentQuestion, "Consent Form Attached");
        }}
      />

      <DeleteElementDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={confirmDelete} />
    </div>
  );
}
