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
import type { ConsentForm, Program, ProgramAuthConfig, ProgramCheckoutQuestion, ProgramQuestion } from "@/features/treatments/types";
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
  useSaveProgram,
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
import { ProgramFlowBuilder } from "@/features/treatments/programs/flow-builder/ProgramFlowBuilder";

export interface SharedQuestionsListProps {
  entityId: string;
  entityName: string;
  entityType?: "program" | "section";
  program?: Program;
  initialQuestions: ProgramQuestion[];
  headerTitle: string;
  headerSubtitle: string;
  onBack: () => void;
  headerExtraActions?: React.ReactNode;
  authConfig?: ProgramAuthConfig;
  viewMode?: "list" | "flow";
  onViewModeChange?: (mode: "list" | "flow") => void;
  onOpenPreview?: () => void;
  allConsents?: ConsentForm[];
}

export function SharedQuestionsList({
  entityId,
  entityName,
  entityType = "program",
  program,
  initialQuestions,
  headerTitle,
  headerSubtitle,
  onBack,
  headerExtraActions,
  authConfig,
  viewMode = "list",
  onViewModeChange,
  onOpenPreview,
  allConsents = [],
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
  const saveProgramMutation = useSaveProgram();
  const deleteQuestionMutation = useDeleteProgramQuestion(entityId);
  const reorderQuestionsMutation = useReorderProgramQuestions(entityId);
  const saveSectionFieldMutation = useSaveSectionField(entityId);
  const deleteSectionFieldMutation = useDeleteSectionField(entityId);
  const reorderSectionFieldsMutation = useReorderSectionFields(entityId);

  // Flow-builder adapter derived from the live questions, so the Flow view and
  // the List view share one source of truth and one persistence store. Adding
  // an element via the modals (which updates `questions`) re-seeds the canvas;
  // canvas reorders/deletes persist through the same program-questions store.
  const flowSubtitle = entityType === "program"
    ? `Internal Program • ${questions.length} elements`
    : `Common Section • ${questions.length} fields`;

  const flowBuilderAdapter = useMemo<QuestionFlowAdapter>(() => ({
    entityType,
    entityId,
    title: headerTitle,
    subtitle: flowSubtitle,
    items: [...questions]
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
  }), [questions, entityType, entityId, entityName, headerTitle, flowSubtitle, queryClient]);

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
      const sourceQuestion = questions[oldIndex];
      const targetQuestion = questions[newIndex];
      if (!sourceQuestion || !targetQuestion || sourceQuestion.elementConfig?.system === true) return;
      if (entityType === "program" && sourceQuestion.kind !== targetQuestion.kind &&
          (sourceQuestion.kind === "checkout" || targetQuestion.kind === "checkout")) {
        toast({
          title: "Checkout stays at the end of the intake",
          description: "Reorder screening questions and checkout options within their own groups.",
        });
        return;
      }
      const updated = arrayMove(questions, oldIndex, newIndex).map((q, idx) => ({
        ...q,
        order: idx + 1,
      }));

      setQuestions(updated);
      if (entityType === "program" && program && sourceQuestion.kind === "checkout") {
        const checkoutQuestions = updated
          .filter((question) => question.kind === "checkout")
          .map(listItemToCheckoutQuestion);
        treatmentsApi.saveProgram({
          ...program,
          checkoutQuestions,
          checkoutQuestionCount: checkoutQuestions.length,
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
          toast({ title: "Checkout Order Saved" });
        }).catch(() => {
          setQuestions(questions);
          toast({ title: "Error", description: "Failed to save checkout order.", variant: "destructive" });
        });
        return;
      }
      const reorderMutation = entityType === "section"
        ? reorderSectionFieldsMutation
        : reorderQuestionsMutation;

      reorderMutation.mutate(
        updated
          .filter((question) => question.kind !== "checkout" && question.elementConfig?.system !== true)
          .map((q) => q.id),
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
    () => filterQuestions(questions, searchQuery, typeFilter),
    [questions, searchQuery, typeFilter]
  );
  const typeCounts = useMemo(() => countQuestionTypes(questions), [questions]);

  // Editing dispatch
  const handleEditClick = (q: ProgramQuestion) => {
    setActiveEditingQuestion(q);
    if (entityType === "program") {
      setIsQuestionOpen(true);
      return;
    }
    if (q.kind === "checkout") {
      setIsCheckoutOpen(true);
    } else if (q.kind === "personal_details") {
      setIsAuthOpen(true);
    } else {
      setIsQuestionOpen(true);
    }
  };

  const handleOpenAuthentication = () => {
    const authentication = questions.find((question) => question.kind === "personal_details") || null;
    setActiveEditingQuestion(authentication);
    if (entityType === "program") {
      setIsQuestionOpen(true);
      return;
    }
    setIsAuthOpen(true);
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

  const checkoutQuestionToListItem = (
    checkout: ProgramCheckoutQuestion,
    order: number
  ): ProgramQuestion => ({
    id: checkout.id,
    order,
    text: checkout.text,
    kind: "checkout",
    section: "Checkout",
    required: true,
    checkoutProductIds: checkout.products
      .map((product) => product.productId)
      .filter((productId): productId is string => Boolean(productId)),
    checkoutProducts: checkout.products,
    visibilityRuleGroup: checkout.visibilityRules,
    elementConfig: {
      checkoutProducts: checkout.products,
      checkoutProductIds: checkout.products
        .map((product) => product.productId)
        .filter((productId): productId is string => Boolean(productId)),
      visibilityRuleGroup: checkout.visibilityRules,
    },
  });

  const listItemToCheckoutQuestion = (question: ProgramQuestion): ProgramCheckoutQuestion => ({
    id: question.id,
    text: question.text,
    products: question.checkoutProducts || [],
    visibilityRules: question.visibilityRuleGroup || { mode: "simple", rules: [] },
  });

  const handleAddCheckoutSave = async (data: Omit<ProgramCheckoutQuestion, "id">) => {
    const isEditing = !!activeEditingQuestion;
    const checkoutId = isEditing ? activeEditingQuestion!.id : createMockId("cq");
    const checkoutQuestion: ProgramCheckoutQuestion = {
      id: checkoutId,
      ...data,
    };

    if (entityType === "program" && program) {
      const localCheckout = questions
        .filter((question) => question.kind === "checkout")
        .map(listItemToCheckoutQuestion);
      const currentCheckout = localCheckout.length > 0
        ? localCheckout
        : program.checkoutQuestions || [];
      const updatedCheckout = isEditing
        ? currentCheckout.map((checkout) =>
            checkout.id === checkoutId ? checkoutQuestion : checkout
          )
        : [...currentCheckout, checkoutQuestion];

      const savedProgram = await treatmentsApi.saveProgram({
        ...program,
        checkoutQuestions: updatedCheckout,
        checkoutQuestionCount: updatedCheckout.length,
      });

      queryClient.setQueryData<Program[]>(treatmentQueryKeys.programs(), (current) =>
        current?.map((item) => item.id === savedProgram.id ? savedProgram : item)
      );
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });

      const listItem = checkoutQuestionToListItem(
        checkoutQuestion,
        isEditing ? activeEditingQuestion!.order : questions.length + 1
      );
      setQuestions((previous) =>
        isEditing
          ? previous.map((question) => question.id === checkoutId ? listItem : question)
          : [...previous, listItem]
      );
      toast({ title: isEditing ? "Checkout Options Saved" : "Checkout Options Added" });
      setActiveEditingQuestion(null);
      return;
    }

    const newQuestion = checkoutQuestionToListItem(
      checkoutQuestion,
      isEditing ? activeEditingQuestion!.order : questions.length + 1
    );
    await new Promise<void>((resolve, reject) => {
      const mutation = entityType === "section" ? saveSectionFieldMutation : saveQuestionMutation;
      const payload = entityType === "section"
        ? {
            id: newQuestion.id,
            sectionId: entityId,
            order: newQuestion.order,
            label: newQuestion.text,
            kind: newQuestion.kind,
            required: newQuestion.required,
            configuration: newQuestion.elementConfig || {},
          }
        : newQuestion;
      mutation.mutate(payload as never, {
        onSuccess: () => {
          setQuestions((previous) => isEditing
            ? previous.map((question) => question.id === newQuestion.id ? newQuestion : question)
            : [...previous, newQuestion]);
          toast({ title: isEditing ? "Checkout Options Saved" : "Checkout Options Added" });
          resolve();
        },
        onError: (error) => reject(error),
      });
    });
    setActiveEditingQuestion(null);
  };

  if (viewMode === "flow") {
    const subtitle = flowSubtitle;

    if (entityType === "program" && program) {
      return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50 p-6">
          <QuestionListHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            extraActions={headerExtraActions}
            reorderActive={false}
            onBack={onBack}
            onToggleReorder={() => onViewModeChange?.("list")}
            onAddQuestion={() => {
              setActiveEditingQuestion(null);
              setIsQuestionOpen(true);
            }}
            onAddAuth={handleOpenAuthentication}
            onAddServiceArea={handleAddServiceArea}
            onAddSection={() => {
              setActiveEditingQuestion(null);
              setIsSectionOpen(true);
            }}
            onAddConsent={() => {
              setActiveEditingQuestion(null);
              setIsConsentOpen(true);
            }}
            onAddCheckout={() => {
              setActiveEditingQuestion(null);
              setIsCheckoutOpen(true);
            }}
          />
          <ProgramFlowBuilder
            program={program}
            questions={questions}
            allConsents={allConsents}
            onAddQuestion={() => {
              setActiveEditingQuestion(null);
              setIsQuestionOpen(true);
            }}
            onEditQuestion={(questionId) => {
              const question = questions.find((item) => item.id === questionId) || null;
              setActiveEditingQuestion(question);
              setIsQuestionOpen(Boolean(question));
            }}
            onAddCheckoutQuestion={() => {
              setActiveEditingQuestion(null);
              setIsCheckoutOpen(true);
            }}
            onEditCheckoutQuestion={(checkoutQuestion) => {
              setActiveEditingQuestion({
                id: checkoutQuestion.id,
                order: questions.length + 1,
                text: checkoutQuestion.text,
                kind: "checkout",
                section: "Checkout",
                required: true,
                checkoutProducts: checkoutQuestion.products,
                visibilityRuleGroup: checkoutQuestion.visibilityRules,
              });
              setIsCheckoutOpen(true);
            }}
            onSaveProgram={(updatedProgram) => saveProgramMutation.mutate(updatedProgram)}
          />

          <QuestionEditorDialog
            open={isQuestionOpen}
            onOpenChange={setIsQuestionOpen}
            onSave={handleAddQuestionSave}
            initialQuestionId={activeEditingQuestion?.id || null}
            questions={questions}
            programId={entityId}
            programName={entityName}
          />
          <CheckoutQuestionModal
            open={isCheckoutOpen}
            onOpenChange={setIsCheckoutOpen}
            onSave={handleAddCheckoutSave}
            initialQuestion={activeEditingQuestion?.kind === "checkout" ? {
              id: activeEditingQuestion.id,
              text: activeEditingQuestion.text,
              products: activeEditingQuestion.checkoutProducts || [],
              visibilityRules: activeEditingQuestion.visibilityRuleGroup || { mode: "simple", rules: [] },
            } : null}
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
                text: "Personal Details",
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
            onSelect={(section) => {
              saveElement({
                id: createMockId("q-section"),
                order: questions.length + 1,
                text: section.name,
                kind: "multiple_choice",
                section: section.name,
                required: true,
                elementConfig: { sourceId: section.id },
              }, "Common Section Attached");
            }}
          />
          <ConsentSelectorModal
            open={isConsentOpen}
            onOpenChange={setIsConsentOpen}
            onSelect={(consent) => {
              saveElement({
                id: createMockId("q-consent"),
                order: questions.length + 1,
                text: consent.name,
                kind: "consent",
                section: "Consents",
                required: true,
                consentText: `Patient must accept: ${consent.name}`,
                elementConfig: { sourceId: consent.id },
              }, "Consent Form Attached");
            }}
          />
        </div>
      );
    }

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
          questions={questions}
          programId={entityId}
          programName={entityName}
        />
        <CheckoutQuestionModal
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          onSave={handleAddCheckoutSave}
          initialQuestion={null}
          programName={entityName}
          programTreatmentTypeKey={program?.treatmentTypeKey}
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
              text: "Personal Details",
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
    <div className="flex min-h-screen w-full flex-col bg-slate-50 p-6">
      <QuestionListHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        extraActions={headerExtraActions}
        reorderActive={isReorderActive}
        onBack={onBack}
        onToggleReorder={() => setIsReorderActive((active) => !active)}
        onAddQuestion={() => { setActiveEditingQuestion(null); setIsQuestionOpen(true); }}
        onAddAuth={handleOpenAuthentication}
        onAddServiceArea={handleAddServiceArea}
        onAddSection={() => { setActiveEditingQuestion(null); setIsSectionOpen(true); }}
        onAddConsent={() => { setActiveEditingQuestion(null); setIsConsentOpen(true); }}
        onAddCheckout={() => { setActiveEditingQuestion(null); setIsCheckoutOpen(true); }}
      />

      <main className="mt-7 w-full flex-1">
        <QuestionListFilters
          counts={typeCounts}
          selectedType={typeFilter}
          searchQuery={searchQuery}
          onSelectType={setTypeFilter}
          onSearchChange={setSearchQuery}
        />
        <div className="flex flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
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
        questions={questions}
        programId={entityId}
        programName={entityName}
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
        programTreatmentTypeKey={program?.treatmentTypeKey}
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
            text: "Personal Details",
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
