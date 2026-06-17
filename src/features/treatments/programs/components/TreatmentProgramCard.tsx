import { Link } from "react-router-dom";
import { Pill, Scale, Syringe, FlaskConical, Beaker, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreatmentType, Program } from "@/features/treatments/types";

interface TreatmentProgramCardProps {
  treatment: TreatmentType;
  intakeProgram?: Program;
  followUpProgram?: Program;
  onAddFollowUp: (treatmentKey: string) => void;
}

const getIconForTreatment = (key: string) => {
  switch (key) {
    case "ed": return <Pill className="h-5 w-5 text-indigo-500" />;
    case "compounded-glp": return <Scale className="h-5 w-5 text-emerald-500" />;
    case "branded-glp": return <Scale className="h-5 w-5 text-amber-600" />;
    case "trt": return <Syringe className="h-5 w-5 text-amber-500" />;
    case "nad": return <FlaskConical className="h-5 w-5 text-purple-500" />;
    case "hrt": return <Beaker className="h-5 w-5 text-rose-500" />;
    default: return <Pill className="h-5 w-5 text-blue-500" />;
  }
};

const getIconBg = (key: string) => {
  switch (key) {
    case "ed": return "bg-indigo-50";
    case "compounded-glp": return "bg-emerald-50";
    case "branded-glp": return "bg-amber-50";
    case "trt": return "bg-amber-50";
    case "nad": return "bg-purple-50";
    case "hrt": return "bg-rose-50";
    default: return "bg-blue-50";
  }
};

const formatTimeAgo = (isoDateString: string) => {
  const date = new Date(isoDateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0 || diffDays === 1) return "Updated today";
  return `Updated ${diffDays} days ago`;
};

export function TreatmentProgramCard({ treatment, intakeProgram, followUpProgram, onAddFollowUp }: TreatmentProgramCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
      
      {/* Top Section */}
      <div className="p-5 border-b border-slate-100 flex items-start gap-4">
        <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${getIconBg(treatment.key)}`}>
          {getIconForTreatment(treatment.key)}
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
            {treatment.name}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {treatment.description}
          </p>
          <div className="mt-2.5 inline-flex bg-blue-50/50 border border-blue-100 text-blue-600 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
            {treatment.key}
          </div>
        </div>
      </div>

      {/* Bottom Section (Columns) */}
      <div className="flex flex-1 divide-x divide-slate-100">
        
        {/* INTAKE Column */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Intake
            </span>
            {intakeProgram && (
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                intakeProgram.status === "published"
                  ? "bg-[#eefcf3] text-[#1e8a4a] border-[#d1f4e0]"
                  : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]"
              }`}>
                <span className={`h-1 w-1 rounded-full ${intakeProgram.status === "published" ? "bg-[#1e8a4a]" : "bg-[#94a3b8]"}`}></span>
                {intakeProgram.status}
              </span>
            )}
          </div>

          {intakeProgram ? (
            <div className="flex-1 flex flex-col">
              <div className="inline-flex items-center justify-center border border-slate-200 rounded px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white mb-3 self-start">
                {intakeProgram.visitType}
              </div>
              <div className="text-[13px] font-bold text-slate-900 leading-none">
                {intakeProgram.questionCount} questions
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {formatTimeAgo(intakeProgram.updatedAt)}
              </div>
              
              <div className="mt-4 flex items-center gap-2 pt-1">
                <Button asChild className="h-7 px-4 text-[11px] font-bold bg-[#1d4ed8] hover:bg-blue-700 text-white rounded">
                  <Link to={`/dashboard/treatments/programs/${intakeProgram.slug}`}>
                    Open
                  </Link>
                </Button>
                <Button variant="outline" className="h-7 px-4 text-[11px] font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded">
                  Preview
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-4">
              <span className="text-[11px] italic text-slate-400 mb-3 text-center">
                No intake module yet.
              </span>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-slate-500 border-dashed border-slate-300 w-full rounded">
                <Plus className="h-3 w-3 mr-1" />
                Add intake
              </Button>
            </div>
          )}
        </div>

        {/* FOLLOW-UP Column */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Follow-up
            </span>
            {followUpProgram && (
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                followUpProgram.status === "published"
                  ? "bg-[#eefcf3] text-[#1e8a4a] border-[#d1f4e0]"
                  : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]"
              }`}>
                <span className={`h-1 w-1 rounded-full ${followUpProgram.status === "published" ? "bg-[#1e8a4a]" : "bg-[#94a3b8]"}`}></span>
                {followUpProgram.status}
              </span>
            )}
          </div>

          {followUpProgram ? (
            <div className="flex-1 flex flex-col">
              <div className="inline-flex items-center justify-center border border-slate-200 rounded px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white mb-3 self-start">
                {followUpProgram.visitType}
              </div>
              <div className="text-[13px] font-bold text-slate-900 leading-none">
                {followUpProgram.questionCount} questions
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {formatTimeAgo(followUpProgram.updatedAt)}
              </div>
              
              <div className="mt-4 flex items-center gap-2 pt-1">
                <Button asChild className="h-7 px-4 text-[11px] font-bold bg-[#1d4ed8] hover:bg-blue-700 text-white rounded">
                  <Link to={`/dashboard/treatments/programs/${followUpProgram.slug}`}>
                    Open
                  </Link>
                </Button>
                <Button variant="outline" className="h-7 px-4 text-[11px] font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded">
                  Preview
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-4">
              <span className="text-[11px] italic text-slate-400 mb-3 text-center px-2">
                No follow-up module yet.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onAddFollowUp(treatment.key)}
                className="h-7 text-[10px] font-bold text-slate-500 border-dashed border-slate-300 w-full rounded hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add follow-up
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
