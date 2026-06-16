import { useParams } from "react-router-dom";
import { QuestionEditorShell } from "../components/question-editor/QuestionEditorShell";
import { useProgramQuestions, usePrograms } from "../hooks/useTreatmentLibraries";

export default function ProgramQuestionEditorPage() {
  const { programId = "program-glp-intake", questionId } = useParams();
  const { data: programs = [] } = usePrograms();
  const { data: questions = [] } = useProgramQuestions(programId);
  const program = programs.find((item) => item.id === programId) ?? programs[0];
  const activeQuestion = questions.find((question) => question.id === questionId);

  if (!program) {
    return <div className="p-6">Program not found.</div>;
  }

  return (
    <QuestionEditorShell
      programId={program.id}
      programName={program.name}
      questions={questions}
      activeQuestion={activeQuestion}
    />
  );
}
