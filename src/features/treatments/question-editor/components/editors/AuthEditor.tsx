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
        title={`Personal Details · Step ${questionOrder}`}
        subtitle={programName}
        isEditMode={isEditMode}
        activeQuestion={activeQuestion}
        hideSave={true}
        onClose={onClose}
        onSave={() => {}}
        onTestFlow={onTestFlow}
      />

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_380px]">
        {sidebar}

        <main className="relative overflow-y-auto border-r border-slate-200 bg-white px-7 py-5">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <LockKeyhole className="h-3 w-3" />
              </span>
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-800">Personal Details</h2>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-4">
              <div className="text-[12px] font-bold text-slate-900">Name, email, phone, consent — login if existing, create account if new</div>
              <p className="mt-1 text-[11px] leading-5 text-slate-600">
                This locked step collects the patient&apos;s personal details, validates the US phone number, captures required consent, and routes existing patients to login or new patients to account creation. No email/SMS verification or photo-ID configuration is used here.
              </p>
            </div>

            <div className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400">How it works</div>
            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">1</span>
                <div><div className="text-[11px] font-semibold text-slate-900">Patient enters email</div><div className="mt-0.5 text-[10px] text-slate-500">Single field. We use the email as the lookup key against the patient database.</div></div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">2a</span>
                <div><div className="text-[11px] font-semibold text-slate-900">Existing account → Log in</div><div className="mt-0.5 text-[10px] text-slate-500">If the email matches an existing patient, they're prompted to log in with their password.</div></div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">2b</span>
                <div><div className="text-[11px] font-semibold text-slate-900">New email → Create account</div><div className="mt-0.5 text-[10px] text-slate-500">If the email isn't recognized, the patient is routed to a quick account creation step.</div></div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2.5 text-[10px] leading-4 text-blue-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>This step appears at position #{questionOrder} of the patient's intake flow. Use Reorder on the Program page to move it.</span>
            </div>
          </div>
        </main>

        <AuthPatientPreview />
      </div>
    </div>
  );
}
