import { QuestionEditorHeader } from "@/features/treatments/question-editor/components/shell/QuestionEditorHeader";
import { AuthPatientPreview } from "../previews/AuthPatientPreview";
import { ShieldCheck, Info } from "lucide-react";
import type { ProgramQuestion } from "@/features/treatments/types";

interface AuthEditorProps {
  activeQuestion?: ProgramQuestion;
  questions: ProgramQuestion[];
  programName?: string;
  sidebar: React.ReactNode;
  onSave: (question: ProgramQuestion) => void;
  onClose: () => void;
  onTestFlow?: () => void;
}

export function AuthEditor({
  activeQuestion,
  questions,
  programName = "WellieMD Initial Assessment",
  sidebar,
  onSave,
  onClose,
  onTestFlow,
}: AuthEditorProps) {
  const questionOrder = activeQuestion ? activeQuestion.order : questions.length + 1;
  const isEditMode = !!activeQuestion;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <QuestionEditorHeader
        title={`Patient Authentication · Step ${questionOrder}`}
        subtitle={programName}
        isEditMode={isEditMode}
        activeQuestion={activeQuestion}
        hideSave={true}
        onClose={onClose}
        onSave={() => {}}
        onTestFlow={onTestFlow}
      />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px] overflow-hidden">
        {sidebar}
        
        <main className="overflow-y-auto p-8 bg-white border-r border-slate-150 relative">
          <div className="max-w-xl mx-auto mt-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Authentication Required</h2>
            <p className="text-[14px] text-slate-600 mb-8 leading-relaxed max-w-md mx-auto">
              This step forces the patient to log in or create an account before continuing their flow.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left flex items-start gap-3 shadow-sm">
              <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-1">Globally Managed Settings</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Authentication settings (such as requiring Phone Verification or Identity Check) are managed at the <strong>Program Level</strong> via the main program settings page. There is nothing to configure on this specific step.
                </p>
              </div>
            </div>
          </div>
        </main>

        <AuthPatientPreview />
      </div>
    </div>
  );
}
