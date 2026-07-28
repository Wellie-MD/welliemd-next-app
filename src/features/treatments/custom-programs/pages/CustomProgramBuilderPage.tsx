import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Copy, GitBranch, Link as LinkIcon, List, Lock, Plus, Play } from "lucide-react";
import { showFloatingToast } from "@/components/ui/floating-toast";
import { SharedQuestionDialog } from "@/features/treatments/common/components";
import { getTreatmentApiErrorMessage } from "@/features/treatments/common/utils/apiError";
import { CustomProgramPreviewDialog } from "@/features/treatments/custom-programs/components/CustomProgramPreviewDialog";
import { CustomProgramQuestionPreviewDialog } from "@/features/treatments/custom-programs/components/CustomProgramQuestionPreviewDialog";
import { ListContentSection } from "@/features/treatments/custom-programs/components/ListContentSection";
import { getCustomProgramEffectiveSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import { buildQuestionnaireRuntimeUrl } from "@/features/treatments/utils/questionnaireRuntimeUrl";
import {
  useAddCustomProgramBuilderQuestion,
  useCustomProgram,
  useDeleteCustomProgramBuilderQuestion,
  useUpdateCustomProgramBuilderQuestion,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import type { CustomProgram, CustomProgramBuilderQuestionInput, CustomProgramBuilderStageItem } from "@/features/treatments/types";

const BUILDER_VIEW_STORAGE_KEY = "welliemd_custom_program_builder_view";
type BuilderViewMode = "list" | "flow";

const getCustomProgramStartUrl = (
  program: CustomProgram,
  baseUrl: string,
  platformClientId?: string,
) => buildQuestionnaireRuntimeUrl({
  baseUrl,
  platformClientId,
  route: "start",
  slug: getCustomProgramEffectiveSlug(program),
});

function BuilderHeader({
  customProgram,
  viewMode,
  onViewModeChange,
  onCopyUrl,
  onOpenAddQuestion,
  onOpenPreview,
  questionnaireBaseUrl,
  platformClientId,
}: {
  customProgram: CustomProgram;
  viewMode: BuilderViewMode;
  onViewModeChange: (mode: BuilderViewMode) => void;
  onCopyUrl: () => void;
  onOpenAddQuestion: () => void;
  onOpenPreview: () => void;
  questionnaireBaseUrl: string;
  platformClientId?: string;
}) {
  const startUrl = questionnaireBaseUrl
    ? getCustomProgramStartUrl(customProgram, questionnaireBaseUrl, platformClientId)
    : "";
  const effectiveSlug = getCustomProgramEffectiveSlug(customProgram);

  return (
    <div className={cn("shrink-0 bg-[#f8fafc] px-8 py-7 dark:bg-[#0f1117]", viewMode === "list" && "border-slate-200 dark:border-slate-800")}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            to="/dashboard/treatments/custom-programs"
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
            aria-label="Back to Custom Programs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[25px] font-extrabold leading-tight text-slate-950 dark:text-slate-50">{customProgram.name}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50 px-2 py-1 text-[11px] font-bold text-pink-700 dark:border-pink-400/30 dark:bg-pink-500/10 dark:text-pink-200">
                <Lock className="h-3 w-3" />
                Managed by WellieMD
              </span>
            </div>

            <div className="mt-3 flex max-w-full items-center gap-2">
              <div className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-blue-500 bg-white px-2.5 py-1.5 text-xs font-semibold text-violet-600 shadow-sm dark:border-blue-600 dark:bg-slate-900 dark:text-blue-300">
                <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate font-mono text-[12px] text-slate-500 dark:text-slate-500">{startUrl.replace(effectiveSlug, "")}</span>
                <span className="truncate font-mono text-[12px] font-extrabold text-blue-700 dark:text-blue-300">{effectiveSlug}</span>
              </div>
              <button
                type="button"
                onClick={onCopyUrl}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:text-slate-200"
                aria-label="Copy intake URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 max-w-3xl text-[13px] leading-5 text-slate-700 dark:text-slate-300">
              This is the patient flow WellieMD configured for this program. Authentication, treatment options, consents and
              checkout are read-only - questions your team adds appear in <span className="font-bold">Stage 1</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="inline-flex h-8 items-center gap-0">
            {(["list", "flow"] as BuilderViewMode[]).map((mode) => {
              const active = viewMode === mode;
              const Icon = mode === "list" ? List : GitBranch;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewModeChange(mode)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 border px-3 text-xs font-medium capitalize transition-colors first:rounded-l-md last:rounded-r-md focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:outline-none",
                    active
                      ? "relative z-10 border-[#4f00ff] bg-white font-semibold text-[#4f00ff] dark:border-blue-600 dark:bg-blue-600/10 dark:text-blue-300"
                      : "border-slate-200 bg-white text-slate-700 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {mode}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAddQuestion}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Add question
          </button>

          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-50"
          >
            <Play className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagedFlowView() {
  return (
    <div className="flex h-[164px] max-w-[880px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/20 px-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Flow view is managed by WellieMD</div>
        <p className="mt-2 text-[13px] font-medium text-slate-400 dark:text-slate-500">
          The visual node-graph layout is configured by WellieMD. Use <span className="font-bold text-slate-500 dark:text-slate-400">List</span> view to see the patient flow and add your own questions.
        </p>
      </div>
    </div>
  );
}

export default function CustomProgramBuilderPage() {
  const { customProgramId = "" } = useParams();
  const { data: customProgram } = useCustomProgram(customProgramId);
  const { currentClient } = useClients();
  const addQuestionMutation = useAddCustomProgramBuilderQuestion(customProgramId);
  const updateQuestionMutation = useUpdateCustomProgramBuilderQuestion(customProgramId);
  const deleteQuestionMutation = useDeleteCustomProgramBuilderQuestion(customProgramId);

  const questionnaireBaseUrl = useMemo(() => {
    const base = currentClient?.resolved_questionnaire_url || currentClient?.questionnaire_url;
    return base ? base.replace(/\/+$/, "") : "";
  }, [currentClient]);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomProgramBuilderStageItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<{
    question: CustomProgramBuilderStageItem;
    questionNumber: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<BuilderViewMode>(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem(BUILDER_VIEW_STORAGE_KEY) === "flow" ? "flow" : "list";
  });

  useEffect(() => {
    localStorage.setItem(BUILDER_VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const handleCopyUrl = async () => {
    if (!customProgram) return;
    if (!questionnaireBaseUrl) {
      showFloatingToast({ title: "Questionnaire URL is not configured for this client" });
      return;
    }
    const text = getCustomProgramStartUrl(
      customProgram,
      questionnaireBaseUrl,
      currentClient?.platform_client_id,
    );
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        showFloatingToast({ title: "Input URL Copied" });
      } catch {
        // Keep copy failures quiet; the success toast should only show after a confirmed write.
      }
    }
  };

  const handleOpenPreview = () => {
    if (!customProgram) return;
    setIsPreviewOpen(true);
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setIsAddQuestionOpen(true);
  };

  const handleEditClientQuestion = (question: CustomProgramBuilderStageItem) => {
    setEditingQuestion(question);
    setIsAddQuestionOpen(true);
  };

  const handlePreviewQuestion = (question: CustomProgramBuilderStageItem, questionNumber: number) => {
    setPreviewQuestion({ question, questionNumber });
  };

  const handleQuestionDialogOpenChange = (open: boolean) => {
    setIsAddQuestionOpen(open);
    if (!open) setEditingQuestion(null);
  };

  const handleSaveQuestion = (input: CustomProgramBuilderQuestionInput) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({
        questionId: editingQuestion.id,
        input,
      }, {
        onSuccess: () => showFloatingToast({ title: "Question Updated" }),
        onError: (error) => {
          showFloatingToast({
            title: getTreatmentApiErrorMessage(error, "Question could not be updated"),
          });
        },
      });
      return;
    }

    addQuestionMutation.mutate(input, {
      onSuccess: () => showFloatingToast({ title: "Question Added" }),
      onError: (error) => {
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Question could not be added"),
        });
      },
    });
  };

  const handleDeleteClientQuestion = (questionId: string) => {
    deleteQuestionMutation.mutate(questionId, {
      onSuccess: () => showFloatingToast({ title: "Question Removed" }),
      onError: (error) => {
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Question could not be removed"),
        });
      },
    });
  };

  if (!customProgram) {
    return (
      <div className="p-6 dark:bg-[#0f1117]">
        <Link
          to="/dashboard/treatments/custom-programs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Custom Programs
        </Link>
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">Custom program not found or loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc] dark:bg-[#0f1117]">
      <BuilderHeader
        customProgram={customProgram}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCopyUrl={handleCopyUrl}
        onOpenAddQuestion={handleOpenAddQuestion}
        onOpenPreview={handleOpenPreview}
        questionnaireBaseUrl={questionnaireBaseUrl}
        platformClientId={currentClient?.platform_client_id}
      />

      <div className="flex-1 p-8">
        {viewMode === "flow" ? (
          <ManagedFlowView />
        ) : (
          <ListContentSection
            customProgram={customProgram}
            onEditClientQuestion={handleEditClientQuestion}
            onDeleteClientQuestion={handleDeleteClientQuestion}
            onPreviewQuestion={handlePreviewQuestion}
          />
        )}
      </div>

      <SharedQuestionDialog
        open={isAddQuestionOpen}
        programName={customProgram.onboardingName || customProgram.name}
        onOpenChange={handleQuestionDialogOpenChange}
        onSaveQuestion={handleSaveQuestion}
        editingQuestion={
          editingQuestion
            ? {
                questionText: editingQuestion.title,
                questionType: editingQuestion.questionKind ?? "single_choice",
                answerOptions: editingQuestion.answerOptions ?? [],
                required: editingQuestion.required ?? true,
              }
            : null
        }
      />

      <CustomProgramPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        customProgram={customProgram}
      />

      {previewQuestion && (
        <CustomProgramQuestionPreviewDialog
          open={!!previewQuestion}
          onOpenChange={(open) => {
            if (!open) setPreviewQuestion(null);
          }}
          customProgram={customProgram}
          question={previewQuestion.question}
          questionNumber={previewQuestion.questionNumber}
        />
      )}
    </div>
  );
}
