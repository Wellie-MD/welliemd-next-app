import { useParams } from "react-router-dom";
import { ProgramQuestionsList } from "@/features/treatments/programs/components/ProgramQuestionsList";
import { useProgramEffectiveContent, useProgramQuestions, usePrograms } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { Loader2 } from "lucide-react";

export default function ProgramQuestionsListPage() {
  const { programId = "" } = useParams();

  // Fetch the program metadata
  const { data: programs = [], isLoading: isLoadingPrograms } = usePrograms();

  // Fetch the questions for this program
  const { data: questions = [], isLoading: isLoadingQuestions } = useProgramQuestions(programId);

  const program = programs.find((item) => item.id === programId || item.slug === programId);
  const { data: effectiveContent } = useProgramEffectiveContent(
    program?.id || "",
    program?.stage === "follow_up" ? "follow_up" : "onboarding",
  );

  // Loading state handling to prevent false-positives on first render
  if (isLoadingPrograms || isLoadingQuestions) {
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

  return (
    <ProgramQuestionsList
      program={program}
      initialQuestions={questions}
      effectiveContent={effectiveContent}
    />
  );
}
