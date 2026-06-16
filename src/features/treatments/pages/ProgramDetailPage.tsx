import { Link, useParams } from "react-router-dom";
import { ArrowLeft, GitBranch, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgramQuestionList } from "../components/programs/ProgramQuestionList";
import { PrototypeNotice, StatusPill } from "../components/common";
import { useProgramQuestions, usePrograms } from "../hooks/useTreatmentLibraries";
import { formatProgramStage } from "../utils/labels";

export default function ProgramDetailPage() {
  const { programId = "program-glp-intake" } = useParams();
  const { data: programs = [] } = usePrograms();
  const { data: questions = [] } = useProgramQuestions(programId);
  const program = programs.find((item) => item.id === programId) ?? programs[0];

  if (!program) {
    return <div className="p-6">Program not found.</div>;
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/treatments/programs"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Program</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{program.name}</h1>
              <StatusPill tone={program.status === "published" ? "green" : "yellow"}>{program.status}</StatusPill>
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {formatProgramStage(program.stage)} · {program.treatmentTypeKey} · Beluga visit type:{" "}
              <code className="rounded bg-slate-100 px-2 py-1 text-xs">{program.visitType}</code>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reorder
          </Button>
          <Button variant="outline">
            <GitBranch className="mr-2 h-4 w-4" />
            Flow Builder
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Element
          </Button>
        </div>
      </div>
      <PrototypeNotice>
        This page must support list view, flow view, type chips, Add Element dropdown, reorder mode, checkout questions,
        screening questions, patient consents, authentication settings, and simulate patient flow.
      </PrototypeNotice>
      <ProgramQuestionList programId={program.id} questions={questions} />
    </div>
  );
}
