import { Link } from "react-router-dom";
import { Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgramQuestion } from "../../types";

interface QuestionEditorShellProps {
  programId: string;
  programName: string;
  questions: ProgramQuestion[];
  activeQuestion?: ProgramQuestion;
}

export function QuestionEditorShell({
  programId,
  programName,
  questions,
  activeQuestion,
}: QuestionEditorShellProps) {
  const currentQuestion = activeQuestion ?? questions[0];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-100">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to={`/dashboard/treatments/programs/${programId}`}>Back</Link>
            </Button>
            <div>
              <div className="text-lg font-semibold text-slate-950">{programName}</div>
              <div className="text-sm text-slate-500">Question {currentQuestion?.order ?? 1} of {questions.length} · Draft</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Play className="mr-2 h-4 w-4" />
              Test Patient Flow
            </Button>
            <Button size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
      <div className="grid min-h-[calc(100vh-152px)] grid-cols-1 lg:grid-cols-[260px,1fr,320px]">
        <aside className="border-r border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flow</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{questions.length}</span>
          </div>
          <div className="space-y-2">
            {questions.map((question) => (
              <Link
                key={question.id}
                to={`/dashboard/treatments/programs/${programId}/questions/${question.id}`}
                className={`block rounded-lg border px-3 py-2 text-sm ${
                  question.id === currentQuestion?.id
                    ? "border-blue-200 bg-blue-50 text-blue-950"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <div className="font-semibold">#{question.order}</div>
                <div className="line-clamp-2">{question.text}</div>
              </Link>
            ))}
          </div>
        </aside>
        <main className="overflow-y-auto bg-white p-6">
          <section className="mb-6 rounded-xl border border-slate-200 p-5">
            <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Question Setup</div>
            <label className="text-sm font-semibold text-slate-800">Question Text</label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm"
              defaultValue={currentQuestion?.text}
            />
            <label className="mt-4 block text-sm font-semibold text-slate-800">Question Type</label>
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {currentQuestion?.kind}
            </div>
          </section>
          <section className="mb-6 rounded-xl border border-slate-200 p-5">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Content</div>
            <p className="text-sm text-slate-500">
              The frontend agent must implement answer choices, checkout product config, rich consent text, and type-specific controls here.
            </p>
          </section>
          <section className="mb-6 rounded-xl border border-slate-200 p-5">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Visibility</div>
            <p className="text-sm text-slate-500">
              Add simple and advanced nested rule builders here. Do not place rule logic directly in page files.
            </p>
          </section>
          <section className="rounded-xl border border-slate-200 p-5">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Behavior</div>
            <p className="text-sm text-slate-500">Required, include in QA, hidden, and prefill controls live here.</p>
          </section>
        </main>
        <aside className="bg-slate-950 p-5 text-white">
          <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
            <span>Patient Preview</span>
            <span className="text-green-300">Updates live</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-white text-slate-950">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs text-slate-500">
              welliemd.com/intake
            </div>
            <div className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Question Preview</div>
              <div className="mt-3 text-base font-semibold">{currentQuestion?.text}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
