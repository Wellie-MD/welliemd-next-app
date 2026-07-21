import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, ArrowUpDown, GitBranch, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showFloatingToast } from "@/components/ui/floating-toast";
import { PatientPreviewDialog, SharedQuestionDialog, type SharedQuestionInput } from "@/features/treatments/common/components";
import { getTreatmentApiErrorMessage } from "@/features/treatments/common/utils/apiError";
import { normalizeSharedQuestionDraft } from "@/features/treatments/common/utils/sharedQuestionDraft";
import {
  useDeleteProgramQuestion,
  useProgramQuestions,
  usePrograms,
  useReorderProgramQuestions,
  useSaveProgramQuestion,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import type { ProgramQuestion } from "@/features/treatments/types";
import { formatProgramStage } from "@/features/treatments/utils/labels";
import { cn } from "@/lib/utils";
import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import { ProgramConfigurationAccess } from "@/features/treatments/programs/components/ProgramConfigurationAccess";
import {
  AuthRow,
  HIDDEN_SYSTEM_QUESTION_KINDS,
  PROGRAM_QUESTION_TYPE_FILTERS,
  SortableQuestionRow,
  buildAuthSubtitle,
  buildQuestionPreviewUrl,
  createProgramQuestionId,
  formatProgramStatus,
  getDefaultQuestionSection,
  getProgramQuestionSearchText,
  hasEnabledAuth,
  isAuthQuestion,
  isClientCreatedQuestion,
  isLockedProgramQuestion,
  stripTreatmentSuffix,
  type ProgramQuestionDisplayRow,
  type ProgramQuestionTypeFilter,
} from "@/features/treatments/programs/components/ProgramQuestionRows";

export default function ProgramDetailPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const activeProgramId = programId || "program-glp-microdose";

  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms();
  const foundProgram = programs.find((program) => program.id === activeProgramId || program.slug === activeProgramId);
  const { data: storedQuestions = [], isLoading: isQuestionsLoading } = useProgramQuestions(foundProgram?.id || "");

  const saveQuestionMutation = useSaveProgramQuestion(foundProgram?.id || "");
  const deleteQuestionMutation = useDeleteProgramQuestion(foundProgram?.id || "");
  const reorderQuestionsMutation = useReorderProgramQuestions(foundProgram?.id || "");

  const [questions, setQuestions] = useState<ProgramQuestion[]>([]);
  const [typeFilter, setTypeFilter] = useState<ProgramQuestionTypeFilter>("all");
  const [showMoreTypes, setShowMoreTypes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReorderActive, setIsReorderActive] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<ProgramQuestion | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setQuestions(storedQuestions);
  }, [storedQuestions]);

  const authQuestion = useMemo(() => questions.find(isAuthQuestion), [questions]);
  const shouldShowAuth = Boolean(foundProgram && (hasEnabledAuth(foundProgram) || authQuestion));
  const normalQuestions = useMemo(
    () =>
      questions
        .filter((question) => !HIDDEN_SYSTEM_QUESTION_KINDS.has(question.kind) && !isAuthQuestion(question))
        .sort((a, b) => a.order - b.order),
    [questions]
  );

  const allRows = useMemo<ProgramQuestionDisplayRow[]>(() => {
    const authRows: ProgramQuestionDisplayRow[] =
      foundProgram && shouldShowAuth
        ? [
            {
              id: authQuestion?.id ?? "system-authentication",
              kind: "auth",
              text: "Patient Authentication",
              subtitle: buildAuthSubtitle(foundProgram, authQuestion),
              required: true,
              source: "auth",
              question: authQuestion,
            },
          ]
        : [];

    return [
      ...authRows,
      ...normalQuestions.map((question) => ({
        id: question.id,
        kind: question.kind,
        text: question.text,
        required: question.required,
        source: "question" as const,
        question,
      })),
    ];
  }, [authQuestion, foundProgram, normalQuestions, shouldShowAuth]);

  const typeCounts = useMemo(() => {
    return allRows.reduce<Record<string, number>>(
      (acc, row) => {
        acc.all += 1;
        acc[row.kind] = (acc[row.kind] ?? 0) + 1;
        return acc;
      },
      { all: 0 }
    );
  }, [allRows]);

  const collapsedTypeFilters = useMemo(
    () =>
      PROGRAM_QUESTION_TYPE_FILTERS.filter((filter) => {
        if (filter.value === "all") return true;
        return (typeCounts[filter.value] ?? 0) > 0;
      }),
    [typeCounts]
  );

  const hiddenTypeFilters = useMemo(
    () =>
      PROGRAM_QUESTION_TYPE_FILTERS.filter((filter) => {
        if (filter.value === "all") return false;
        return (typeCounts[filter.value] ?? 0) === 0;
      }),
    [typeCounts]
  );

  const visibleTypeFilters = showMoreTypes
    ? [...collapsedTypeFilters, ...hiddenTypeFilters]
    : collapsedTypeFilters;
  const hiddenTypeCount = hiddenTypeFilters.length;

  useEffect(() => {
    if (showMoreTypes || typeFilter === "all") return;

    const visibleValues = new Set(collapsedTypeFilters.map((filter) => filter.value));
    if (!visibleValues.has(typeFilter)) {
      setTypeFilter("all");
    }
  }, [collapsedTypeFilters, showMoreTypes, typeFilter]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allRows.filter((row) => {
      if (typeFilter !== "all" && row.kind !== typeFilter) return false;
      if (!query) return true;
      return getProgramQuestionSearchText(row).includes(query);
    });
  }, [allRows, searchQuery, typeFilter]);

  const filteredNormalRows = filteredRows.filter((row) => row.source === "question" && row.question);
  const filteredAuthRow = filteredRows.find((row) => row.source === "auth");
  const clientQuestions = useMemo(
    () => normalQuestions.filter(isClientCreatedQuestion),
    [normalQuestions]
  );
  const editingQuestion = useMemo(
    () => normalQuestions.find((question) => question.id === editingQuestionId) ?? null,
    [editingQuestionId, normalQuestions]
  );
  const previewQuestionUrl = useMemo(
    () => (foundProgram && previewQuestion ? buildQuestionPreviewUrl(foundProgram, previewQuestion) : ""),
    [foundProgram, previewQuestion]
  );

  useEffect(() => {
    if (isReorderActive && clientQuestions.length < 2) {
      setIsReorderActive(false);
    }
  }, [clientQuestions.length, isReorderActive]);

  const headerQuestionCount = allRows.length;
  const treatmentName = foundProgram ? (foundProgram.treatmentTypeName || stripTreatmentSuffix(foundProgram.name)) : "";

  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setIsQuestionDialogOpen(true);
  };

  const handleOpenEditQuestion = (question: ProgramQuestion) => {
    if (isLockedProgramQuestion(question)) return;
    setEditingQuestionId(question.id);
    setIsQuestionDialogOpen(true);
  };

  const handlePreviewLockedQuestion = (question: ProgramQuestion) => {
    if (!isLockedProgramQuestion(question) || isClientCreatedQuestion(question)) return;
    setPreviewQuestion(question);
  };

  const handleToggleReorder = () => {
    if (isReorderActive) {
      setIsReorderActive(false);
      return;
    }

    if (clientQuestions.length < 2) {
      showFloatingToast({ title: "At least two of your own questions to reorder" });
      return;
    }

    setIsReorderActive(true);
  };

  const handleSaveQuestion = (input: SharedQuestionInput) => {
    const normalizedInput = normalizeSharedQuestionDraft(input);
    const question: ProgramQuestion = editingQuestion
      ? {
          ...editingQuestion,
          text: normalizedInput.questionText,
          kind: normalizedInput.questionType,
          required: normalizedInput.required,
          choices: normalizedInput.answerOptions,
          answerCount: normalizedInput.answerOptions.length,
          source: "client",
          locked: false,
        }
      : {
          id: createProgramQuestionId(),
          order: normalQuestions.length + 1,
          text: normalizedInput.questionText,
          kind: normalizedInput.questionType,
          section: getDefaultQuestionSection(normalQuestions),
          required: normalizedInput.required,
          choices: normalizedInput.answerOptions,
          answerCount: normalizedInput.answerOptions.length,
          source: "client",
          locked: false,
        };

    saveQuestionMutation.mutate(question, {
      onSuccess: () => {
        setQuestions((current) => {
          const exists = current.some((item) => item.id === question.id);
          if (exists) return current.map((item) => (item.id === question.id ? question : item));
          return [...current, question].map((item, index) => ({ ...item, order: index + 1 }));
        });
        showFloatingToast({ title: editingQuestionId ? "Question Updated" : "Question Added" });
      },
      onError: (error) => {
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Question could not be saved"),
        });
      },
    });
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const questionToDelete = normalQuestions.find((question) => question.id === questionId);
    if (isLockedProgramQuestion(questionToDelete)) {
      return;
    }

    const confirmed = window.confirm("Delete this question? This only removes the question your team added.");
    if (!confirmed) return;

    deleteQuestionMutation.mutate(questionId, {
      onSuccess: () => {
        setQuestions((current) =>
          current
            .filter((question) => question.id !== questionId)
            .map((question, index) => ({ ...question, order: index + 1 }))
        );
        showFloatingToast({ title: "Question Removed" });
      },
      onError: (error) => {
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Question could not be removed"),
        });
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !foundProgram) return;

    const visibleClientIds = filteredNormalRows
      .filter((row) => isClientCreatedQuestion(row.question) && !isLockedProgramQuestion(row.question))
      .map((row) => row.id);
    const oldIndex = visibleClientIds.indexOf(String(active.id));
    const newIndex = visibleClientIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedVisibleIds = arrayMove(visibleClientIds, oldIndex, newIndex);
    const normalById = new Map(normalQuestions.map((question) => [question.id, question]));
    let visibleCursor = 0;

    const nextNormalQuestions = normalQuestions.map((question) => {
      if (!visibleClientIds.includes(question.id)) return question;
      const nextId = reorderedVisibleIds[visibleCursor++];
      return normalById.get(nextId) ?? question;
    });

    const nextQuestions = [
      ...(authQuestion ? [authQuestion] : []),
      ...nextNormalQuestions,
    ].map((question, index) => ({ ...question, order: index + 1 }));

    setQuestions(nextQuestions);
    reorderQuestionsMutation.mutate(nextQuestions.map((question) => question.id), {
      onSuccess: () => showFloatingToast({ title: "Order Saved" }),
      onError: (error) => {
        setQuestions(storedQuestions);
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Question order could not be saved"),
        });
      },
    });
  };

  if (isProgramsLoading || isQuestionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] dark:bg-[#0f1117]">
        <div className="animate-pulse text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Program Details...</div>
      </div>
    );
  }

  if (!foundProgram) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] dark:bg-[#0f1117]">
        <div className="mb-2 text-base font-extrabold text-slate-950 dark:text-slate-50">Program Not Found</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          The program with ID or slug "{activeProgramId}" could not be found.
        </div>
      </div>
    );
  }

  const renderTypeButton = (filter: { value: ProgramQuestionTypeFilter; label: string }) => {
    const active = typeFilter === filter.value;
    const count = typeCounts[filter.value] ?? 0;

	    return (
	      <button
	        key={filter.value}
	        type="button"
	        onClick={() => setTypeFilter(filter.value)}
	        className={cn(
	          "inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold leading-none shadow-sm transition-colors",
	          active
	            ? "border-[#4f00ff] bg-[#4f00ff] text-white hover:bg-[#4f00ff] dark:border-[#6671ff] dark:bg-[#6671ff] dark:text-white dark:hover:bg-[#6671ff]"
	            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800/70"
	        )}
	      >
	        {filter.label}
	        <span
	          className={cn(
	            "rounded-full px-1.5 py-0.5 text-[11px] leading-none",
	            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
	          )}
	        >
	          {count}
        </span>
      </button>
    );
  };

  return (
	    <div className="min-h-screen bg-[#f5f7fb] p-6 text-slate-950 dark:bg-[#0f1117] dark:text-slate-50 lg:p-8">
	      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
	        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
	          <div className="flex min-w-0 items-start gap-3">
	            <Button
	              type="button"
	              variant="outline"
	              size="icon"
	              onClick={() => navigate(CLIENT_TREATMENT_ROUTES.programs)}
	              className="mt-0.5 h-10 w-10 shrink-0 rounded-xl border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800"
	            >
	              <ArrowLeft className="h-5 w-5" />
	            </Button>

	            <div className="min-w-0">
	              <div className="flex flex-wrap items-center gap-3">
	                <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-tight text-slate-950 dark:text-slate-50">
	                  {foundProgram.name}
	                </h1>
	                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-700 dark:bg-[#0f1117] dark:text-slate-400">
	                  Read-only
	                </span>
	              </div>
	              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
	                {treatmentName} · {formatProgramStage(foundProgram.stage)} module · {headerQuestionCount} question{headerQuestionCount === 1 ? "" : "s"} · {formatProgramStatus(foundProgram.status)}
	              </p>
	            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
	            <Button
	              type="button"
	              variant="outline"
	              onClick={() =>
	                showFloatingToast({
	                  title: "Managed By WellieMD - this part is read only in the client portal",
	                })
	              }
	              className="h-9 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800"
	            >
	              <GitBranch className="h-4 w-4" />
	              Flow Builder
            </Button>
            <Button
              type="button"
	              variant="outline"
	              onClick={handleToggleReorder}
	              className={cn(
	                "h-9 rounded-lg px-4 text-sm font-semibold shadow-sm",
	                isReorderActive
	                  ? "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
	                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <ArrowUpDown className="h-4 w-4" />
              {isReorderActive ? "Done" : "Reorder"}
            </Button>
	            <Button
	              type="button"
	              onClick={handleOpenAddQuestion}
	              className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#4f00ff] dark:bg-[#5b4dff] dark:hover:bg-[#5b4dff]"
	            >
	              <Plus className="h-4 w-4" />
	              Add Question
            </Button>
          </div>
        </header>

        <ProgramConfigurationAccess
          programId={foundProgram.id}
          treatmentTypeKey={foundProgram.treatmentTypeKey}
          serviceStatesAll={foundProgram.serviceStatesAll ?? true}
          serviceStates={foundProgram.serviceStates || []}
          consentCount={(foundProgram.consentIds || []).length}
          productLaneCount={(foundProgram.checkoutQuestions || []).length}
          labCount={(foundProgram.labRequirements || []).length}
        />

		        <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none">
		          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_325px] lg:items-start">
		            <div className="flex min-w-0 flex-wrap items-center gap-2">
		              <span className="mr-2 shrink-0 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
		                Type
		              </span>
		              {visibleTypeFilters.map(renderTypeButton)}
		              {!showMoreTypes && hiddenTypeCount > 0 ? (
		                <button
		                  type="button"
		                  onClick={() => setShowMoreTypes(true)}
		                  className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg border border-dashed border-slate-200 bg-white px-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-500 dark:hover:bg-slate-800"
		                >
		                  + {hiddenTypeCount} more type{hiddenTypeCount === 1 ? "" : "s"}
		                </button>
		              ) : null}
		              {showMoreTypes ? (
		                <button
		                  type="button"
		                  onClick={() => setShowMoreTypes(false)}
		                  className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg border border-dashed border-slate-200 bg-white px-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-500 dark:hover:bg-slate-800"
		                >
		                  Show fewer
		                </button>
		              ) : null}
		            </div>

	            <div className="relative w-full lg:w-[325px]">
	              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
	              <Input
	                value={searchQuery}
	                onChange={(event) => setSearchQuery(event.target.value)}
	                placeholder="Search questions, answers, or mapped"
	                className="h-9 rounded-lg border-slate-200 bg-white pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-100 dark:placeholder:text-slate-500"
	              />
	            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none">
          <div className="grid grid-cols-[52px_minmax(0,1fr)_120px_170px_92px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:bg-[#11151f] dark:text-slate-500 md:px-8">
            <div>#</div>
            <div>Question or Element</div>
            <div>Required</div>
            <div>Type</div>
            <div className="text-right">Actions</div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="bg-white px-6 py-14 text-center text-sm font-medium text-slate-400 dark:bg-[#11151f] dark:text-slate-500">
              No questions match your current filters.
            </div>
          ) : (
            <>
              {filteredAuthRow ? <AuthRow subtitle={filteredAuthRow.subtitle ?? ""} /> : null}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredNormalRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                  <div>
                    {filteredNormalRows.map((row, index) => (
                      <SortableQuestionRow
                        key={row.id}
                        row={row}
                        index={index}
                        isReorderActive={isReorderActive}
                        onEdit={handleOpenEditQuestion}
                        onDelete={handleDeleteQuestion}
                        onPreviewLockedQuestion={handlePreviewLockedQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </section>
      </div>

      <SharedQuestionDialog
        open={isQuestionDialogOpen}
        onOpenChange={(open) => {
          setIsQuestionDialogOpen(open);
          if (!open) setEditingQuestionId(null);
        }}
        programName={foundProgram.name}
        onSaveQuestion={handleSaveQuestion}
        editingQuestion={
          editingQuestion
            ? {
                questionText: editingQuestion.text,
                questionType: editingQuestion.kind,
                answerOptions: editingQuestion.choices ?? [],
                required: editingQuestion.required,
              }
            : null
        }
      />

      {previewQuestion && previewQuestionUrl ? (
        <PatientPreviewDialog
          open={Boolean(previewQuestion)}
          onOpenChange={(open) => {
            if (!open) setPreviewQuestion(null);
          }}
          previewUrl={previewQuestionUrl}
          previewTitle="Question Preview"
          subtitle={`${foundProgram.name} · ${previewQuestion.text}`}
          iframeTitle={`${previewQuestion.text} patient preview`}
        />
      ) : null}

    </div>
  );
}
