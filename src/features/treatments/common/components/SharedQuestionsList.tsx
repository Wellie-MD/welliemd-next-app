import { useState, useMemo, useEffect } from "react";
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
import { isCheckoutQuestionRequired } from "@/features/treatments/programs/checkout-question/constants";
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
  useConsents,
  treatmentQueryKeys,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";

type ApiErrorLike = {
  response?: { data?: { detail?: string; error?: string; message?: string } };
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

  // Every flow starts with Personal Details. Programs pre-inject a real
  // one (see ProgramQuestionsList); for entities that don't (e.g. Sections),
  // lead the list with a non-persisted system entry so it always reads
  // correctly. It isn't part of `questions` state until something moves it.
  const systemAuthId = `auth-system-${entityId}`;
  const displayQuestions = useMemo<ProgramQuestion[]>(() => {
    if (questions.some((q) => q.kind === "personal_details")) return questions;
    const systemAuthQuestion: ProgramQuestion = {
      id: systemAuthId,
      order: 0,
      text: "Personal Details",
      kind: "personal_details",
      section: entityName,
      required: true,
      elementConfig: { system: true, locked: true },
    };
    return [systemAuthQuestion, ...questions];
  }, [questions, systemAuthId, entityName]);

  // Sections have no backing Program record, so the Flow view (which always
  // renders through ProgramFlowBuilder — see below) gets a minimal synthetic
  // one. Auth/consent edits made from a section's canvas only update this
  // local override; there's no Program to persist them to.
  const [sectionFlowOverrides, setSectionFlowOverrides] = useState<Partial<Program>>({});
  const syntheticProgram = useMemo<Program>(() => ({
    id: entityId,
    name: entityName,
    stage: "intake",
    treatmentTypeKey: "",
    visitType: "",
    questionCount: displayQuestions.length,
    checkoutQuestionCount: 0,
    status: "draft",
    updatedAt: new Date().toISOString(),
    slug: entityId,
    authConfig: { email: true, phone: false, identity: false, account: true },
    checkoutQuestions: [],
    consentIds: [],
    ...sectionFlowOverrides,
  }), [entityId, entityName, displayQuestions.length, sectionFlowOverrides]);

  const { data: fetchedConsents = [] } = useConsents();
  const effectiveConsents = allConsents.length > 0 ? allConsents : fetchedConsents;

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const listItemToCheckoutQuestion = (question: ProgramQuestion): ProgramCheckoutQuestion => ({
    id: question.id,
    text: question.text,
    products: question.checkoutProducts || [],
    visibilityRules: question.visibilityRuleGroup || { mode: "simple", rules: [] },
  });

  // Patient Authentication can be dragged like any other row — the prototype
  // never pins it first, only its Actions column is restricted (no delete).
  // It isn't a real record until something actually moves it, so dragging it
  // specifically materializes it into a genuine persisted question first,
  // then reorders. Checkout options stay grouped at the end of the intake and
  // persist through the program record instead of the question-order endpoint.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayQuestions.findIndex((q) => q.id === active.id);
    const newIndex = displayQuestions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const sourceQuestion = displayQuestions[oldIndex];
    const targetQuestion = displayQuestions[newIndex];

    if (entityType === "program" && sourceQuestion.kind !== targetQuestion.kind &&
        (sourceQuestion.kind === "checkout" || targetQuestion.kind === "checkout")) {
      toast({
        title: "Checkout stays at the end of the intake",
        description: "Reorder screening questions and checkout options within their own groups.",
      });
      return;
    }

    const previousQuestions = questions;
    const isSystemDrag = sourceQuestion.elementConfig?.system === true;
    const reordered = arrayMove(displayQuestions, oldIndex, newIndex).map((q, idx) => ({
      ...q,
      order: idx + 1,
      elementConfig: q.id === sourceQuestion.id && isSystemDrag
        ? { ...q.elementConfig, system: undefined }
        : q.elementConfig,
    }));

    setQuestions(reordered);

    if (entityType === "program" && program && sourceQuestion.kind === "checkout") {
      const checkoutQuestions = reordered
        .filter((question) => question.kind === "checkout")
        .map(listItemToCheckoutQuestion);
      treatmentsApi.saveProgram({
        id: program.id,
        checkoutQuestions,
        checkoutQuestionCount: checkoutQuestions.length,
      } as never).then(() => {
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
        toast({ title: "Checkout Order Saved" });
      }).catch(() => {
        setQuestions(previousQuestions);
        toast({ title: "Error", description: "Failed to save checkout order.", variant: "destructive" });
      });
      return;
    }

    const persistOrder = () => {
      const reorderMutation = entityType === "section" ? reorderSectionFieldsMutation : reorderQuestionsMutation;
      reorderMutation.mutate(
        reordered.filter((q) => q.kind !== "checkout" && q.elementConfig?.system !== true).map((q) => q.id),
        {
          onSuccess: () => {
            toast({ title: "Order Saved", description: "The list order has been successfully saved." });
          },
          onError: () => {
            setQuestions(previousQuestions);
            toast({ title: "Error", description: "Failed to save the new order.", variant: "destructive" });
          },
        }
      );
    };

    if (isSystemDrag) {
      const authRow = reordered.find((q) => q.id === sourceQuestion.id)!;
      const mutation = entityType === "section" ? saveSectionFieldMutation : saveQuestionMutation;
      const payload = entityType === "section"
        ? {
            id: authRow.id,
            sectionId: entityId,
            order: authRow.order,
            label: authRow.text,
            kind: authRow.kind,
            required: authRow.required,
            configuration: authRow.elementConfig || {},
          }
        : authRow;
      mutation.mutate(payload as never, {
        onSuccess: persistOrder,
        onError: () => {
          setQuestions(previousQuestions);
          toast({ title: "Error", description: "Failed to save the new order.", variant: "destructive" });
        },
      });
      return;
    }

    persistOrder();
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

  const attachSection = (section: { id: string; name: string; fieldCount: number }) => {
    const sectionQuestion: ProgramQuestion = {
      id: createMockId("q-section"),
      order: Math.max(0, ...questions.map((question) => question.order || 0)) + 1,
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

    if (entityType !== "program") {
      saveElement(sectionQuestion, "Common Section Attached");
      return;
    }

    const existingSection = questions.some((question) =>
      question.kind === "section" &&
      String(question.elementConfig?.sourceSectionId || question.elementConfig?.sourceId || "") === section.id
    );
    if (existingSection) {
      toast({ title: "Section already attached", description: "This section is already part of the program." });
      return;
    }

    const checkoutQuestions = questions.filter((question) => question.kind === "checkout");
    const screeningQuestions = questions.filter((question) =>
      question.kind !== "checkout" && question.elementConfig?.system !== true
    );
    const nextQuestions = [...screeningQuestions, sectionQuestion];

    treatmentsApi.saveProgramQuestions(entityId, nextQuestions).then((savedQuestions) => {
      setQuestions([...savedQuestions, ...checkoutQuestions]);
      queryClient.setQueryData(treatmentQueryKeys.programQuestions(entityId), savedQuestions);
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(entityId) });
      // The `program` prop (screeningQuestions/questionCount) lives in a
      // separate cache — without this it stays stale until something else
      // happens to refetch it, and any full-`program` save downstream can
      // silently resurrect the pre-section state.
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs(), exact: true });
      toast({
        title: "Common Section Attached",
        description: `${section.fieldCount} fields · Reusable from library`,
      });
    }).catch((error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to attach the section.",
        variant: "destructive",
      });
    });
  };

  // Deleting confirmation
  const handleDeleteClick = (id: string) => {
    setQuestionToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!questionToDeleteId) {
      setIsDeleteDialogOpen(false);
      return;
    }

    const questionToDelete = questions.find((q) => q.id === questionToDeleteId);

    // Checkout questions aren't stored in the screening-question list the
    // generic delete mutation targets — they live on Program.checkoutQuestions.
    // Route their removal through the same save path handleAddCheckoutSave
    // uses, or the delete silently no-ops and the item reappears on reload.
    if (questionToDelete?.kind === "checkout" && entityType === "program" && program) {
      const updatedCheckout = questions
        .filter((question) => question.kind === "checkout" && question.id !== questionToDeleteId)
        .map(listItemToCheckoutQuestion);

      treatmentsApi.saveProgram({
        id: program.id,
        checkoutQuestions: updatedCheckout,
        checkoutQuestionCount: updatedCheckout.length,
      } as never).then((savedProgram) => {
        setQuestions((prev) => prev.filter((q) => q.id !== questionToDeleteId));
        queryClient.setQueryData<Program[]>(treatmentQueryKeys.programs(), (current) =>
          current?.map((item) => item.id === savedProgram.id ? savedProgram : item)
        );
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
        toast({ title: "Element Removed", description: "The element has been removed successfully." });
      }).catch((error) => {
        toast({
          title: "Error",
          description: getApiErrorMessage(error, "Failed to remove the checkout question."),
          variant: "destructive",
        });
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    const deleteMutation = entityType === "section" ? deleteSectionFieldMutation : deleteQuestionMutation;
    deleteMutation.mutate(questionToDeleteId, {
      onSuccess: () => {
        setQuestions((prev) => prev.filter((q) => q.id !== questionToDeleteId));
        toast({ title: "Element Removed", description: "The element has been removed successfully." });
      },
    });
    setIsDeleteDialogOpen(false);
  };

  // Add handlers
  // Returns a Promise so the editor modal can drive an accurate
  // saving/saved button state and knows whether to show a success flash
  // (only on a real, awaited success) instead of firing-and-forgetting.
  const handleAddQuestionSave = async (updatedQuestion: ProgramQuestion): Promise<void> => {
    // Checkout questions aren't stored in the screening-question list — same
    // reason the delete path had to special-case them (see confirmDelete).
    // Route through the checkout-specific save path or the edit silently
    // writes to the wrong field and reverts on reload.
    if (updatedQuestion.kind === "checkout" && entityType === "program" && program) {
      await handleAddCheckoutSave(
        {
          text: updatedQuestion.text,
          products: updatedQuestion.checkoutProducts || [],
          visibilityRules: updatedQuestion.visibilityRuleGroup || { mode: "simple", rules: [] },
        },
        { keepEditorOpen: true }
      );
      return;
    }

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

    try {
      await mutation.mutateAsync(payload as never);
      setQuestions((prev) => {
        if (isEditing) {
          return prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));
        }
        return [...prev, updatedQuestion];
      });
      toast({ title: isEditing ? "Question Updated" : "Question Added" });
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "The question could not be saved."),
        variant: "destructive",
      });
      throw error;
    }
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
    required: isCheckoutQuestionRequired(checkout.products),
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

  const handleAddCheckoutSave = async (
    data: Omit<ProgramCheckoutQuestion, "id">,
    options?: { keepEditorOpen?: boolean }
  ) => {
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
        id: program.id,
        checkoutQuestions: updatedCheckout,
        checkoutQuestionCount: updatedCheckout.length,
      } as never);

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
      if (!options?.keepEditorOpen) setActiveEditingQuestion(null);
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
    if (!options?.keepEditorOpen) setActiveEditingQuestion(null);
  };

  // The Flow view always renders through ProgramFlowBuilder — the same
  // React Flow canvas Programs use — matching the prototype, where Sections
  // and Programs share one flow-view implementation. Sections have no
  // backing Program record, so we synthesize a minimal one; auth/consent
  // settings edited from a Section's canvas are canvas-local only (there's
  // nowhere to persist them yet), everything else (questions, checkout)
  // already saves through the normal section-field mutations.
  if (viewMode === "flow") {
    const effectiveProgram = program ?? syntheticProgram;

    return (
      <div className="flex min-h-screen w-full flex-col gap-6 bg-slate-50 p-6">
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
          onAddAuth={() => {
            setActiveEditingQuestion(null);
            setIsAuthOpen(true);
          }}
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
          program={effectiveProgram}
          questions={questions}
          allConsents={effectiveConsents}
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
              required: isCheckoutQuestionRequired(checkoutQuestion.products),
              checkoutProducts: checkoutQuestion.products,
              visibilityRuleGroup: checkoutQuestion.visibilityRules,
            });
            setIsCheckoutOpen(true);
          }}
          onSaveProgram={(updatedProgram) => {
            if (program) {
              saveProgramMutation.mutate(updatedProgram);
            } else {
              setSectionFlowOverrides((current) => ({
                ...current,
                authConfig: updatedProgram.authConfig,
                consentIds: updatedProgram.consentIds,
              }));
            }
          }}
        />

        <QuestionEditorDialog
          open={isQuestionOpen}
          onOpenChange={setIsQuestionOpen}
          onSave={handleAddQuestionSave}
          initialQuestionId={activeEditingQuestion?.id || null}
          questions={displayQuestions}
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
          programTreatmentTypeKey={effectiveProgram.treatmentTypeKey}
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
          onSelect={attachSection}
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
    <div className="flex min-h-screen w-full flex-col bg-slate-50 p-6">
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
        questions={displayQuestions}
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
          onSelect={attachSection}
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
