import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { ProgramQuestionsList } from "@/features/treatments/programs/components/ProgramQuestionsList";
import { useProgramEffectiveContent, useProgramQuestions, usePrograms } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { Loader2 } from "lucide-react";
import { getApiErrorMessage } from "@/features/treatments/programs/utils/programDetailErrors";
import { safeAssignmentMessage } from "@/features/treatments/assignment/constants";

export default function ProgramQuestionsListPage() {
  const { programId = "" } = useParams();

  // Fetch the program metadata
  const { data: programs = [], isLoading: isLoadingPrograms } = usePrograms();

  // Fetch the questions for this program
  const { data: questions = [], isLoading: isLoadingQuestions } = useProgramQuestions(programId);

  const program = programs.find((item) => item.id === programId || item.slug === programId);
  const effectiveContentQuery = useProgramEffectiveContent(
    program?.id || "",
    program?.stage === "follow_up" ? "follow_up" : "onboarding",
  );
  const effectiveContent = effectiveContentQuery.data;

  useEffect(() => {
    const blockers = effectiveContent?.blockers || [];
    if (blockers.length > 0) {
      toast({
        title: "Program configuration needs attention",
        description: safeAssignmentMessage(blockers.map((blocker) => blocker.message).filter(Boolean).join(" ")),
        variant: "destructive",
      });
      return;
    }

    if (effectiveContentQuery.isError) {
      toast({
        title: "Unable to load Program flow",
        description: getApiErrorMessage(
          effectiveContentQuery.error,
          "The complete Program flow could not be loaded.",
        ),
        variant: "destructive",
      });
    }
  }, [effectiveContent, effectiveContentQuery.error, effectiveContentQuery.isError]);

  // Loading state handling to prevent false-positives on first render
  if (isLoadingPrograms || isLoadingQuestions || (Boolean(program) && effectiveContentQuery.isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Find program by ID or Slug
  if (!program) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-md mx-auto mt-20 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Program not found</h3>
        <p className="text-sm text-slate-500 mb-4">
          We couldn't find a program matching "{programId}".
        </p>
      </div>
    );
  }

  if (effectiveContentQuery.isError) {
    return (
      <div className="mx-auto mt-20 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h3 className="mb-2 text-lg font-bold text-slate-900">Unable to load the complete Program flow</h3>
        <p className="mb-4 text-sm text-slate-600">
          Inherited Section fields and Consents are unavailable, so this page will not show a misleading partial list.
        </p>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => effectiveContentQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ProgramQuestionsList
      program={program}
      initialQuestions={questions}
      effectiveContent={effectiveContent}
    />
  );
}
