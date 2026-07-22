import { QuestionEditorHeader } from "@/features/treatments/question-editor/components/shell/QuestionEditorHeader";
import { AuthPatientPreview } from "../previews/AuthPatientPreview";
import { Info, LockKeyhole } from "lucide-react";
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
        hideSave={true}
        onClose={onClose}
        onSave={() => {}}
        onTestFlow={onTestFlow}
      />

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_380px]">
        {sidebar}

        <main className="overflow-y-auto p-8 bg-white border-r border-slate-150 relative">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-amber-700">
                <LockKeyhole className="h-3 w-3" />
              </div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">Patient Authentication</h3>
            </div>

            {/* Hero summary */}
            <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4">
              <div className="mb-1 text-[15px] font-semibold text-slate-900">
                Email — login if existing, create account if new
              </div>
              <div className="text-[12.5px] leading-relaxed text-slate-600">
                The patient enters their email address. The system checks for an existing account
                and routes accordingly — no further configuration is required.
              </div>
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">How it works</div>
            <div className="grid gap-2.5">
              <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[12px] font-bold text-blue-700">1</div>
                <div>
                  <div className="mb-0.5 text-[13px] font-semibold text-slate-900">Patient enters email</div>
                  <div className="text-[11.5px] leading-relaxed text-slate-600">Single field. We use the email as the lookup key against the patient database.</div>
                </div>
              </div>
              <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-[12px] font-bold text-green-700">2a</div>
                <div>
                  <div className="mb-0.5 text-[13px] font-semibold text-slate-900">Existing account → Login</div>
                  <div className="text-[11.5px] leading-relaxed text-slate-600">If the email matches an existing patient, they're prompted to log in with their password.</div>
                </div>
              </div>
              <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[12px] font-bold text-purple-700">2b</div>
                <div>
                  <div className="mb-0.5 text-[13px] font-semibold text-slate-900">New email → Create account</div>
                  <div className="text-[11.5px] leading-relaxed text-slate-600">If the email isn't recognized, the patient is routed to a quick account creation step (password + basic profile).</div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-blue-200 bg-blue-50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <div className="text-[12px] leading-relaxed text-blue-800">
                This step appears at position <strong>{questionOrder}</strong> of the patient's intake flow.
                Drag the card in the list to move it earlier or later.
              </div>
            </div>
          </div>
        </main>

        <AuthPatientPreview />
      </div>
    </div>
  );
}
