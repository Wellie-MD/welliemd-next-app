import { AlignLeft, CheckSquare, List, Hash, Calendar, Mail, Phone, MapPin, Upload, HeartPulse, Scale, Stethoscope, Lock, LayoutGrid, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionFlowItem } from "../types";

interface QuestionFlowChipProps {
  item: QuestionFlowItem;
  index: number;
  onDragStart: (event: React.DragEvent, index: number) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDelete: (id: string) => void;
}

function getElementType(item: QuestionFlowItem) {
  if (item.kind === "personal_details") return "auth";
  if (item.kind === "consent") return "consent";
  if (item.kind === "checkout") return "checkout";
  if (item.kind === "multiple_choice" && item.text.endsWith(" Section")) return "section";
  return "question";
}

function getIconForItem(item: QuestionFlowItem) {
  const type = getElementType(item);
  if (type === "auth") return <Lock className="h-3 w-3 text-indigo-400" />;
  if (type === "consent") return <FileText className="h-3 w-3 text-purple-400" />;
  if (type === "checkout") return <CheckCircle2 className="h-3 w-3 text-amber-500" />;
  if (type === "section") return <LayoutGrid className="h-3 w-3 text-blue-400" />;
  
  const kind = item.kind;
  switch (kind) {
    case "text":
    case "textarea":
      return <AlignLeft className="h-3 w-3 text-slate-400" />;
    case "single_choice":
      return <List className="h-3 w-3 text-slate-400" />;
    case "multiple_choice":
    case "yes_no":
      return <CheckSquare className="h-3 w-3 text-slate-400" />;
    case "number":
      return <Hash className="h-3 w-3 text-slate-400" />;
    case "date":
      return <Calendar className="h-3 w-3 text-slate-400" />;
    case "email":
      return <Mail className="h-3 w-3 text-slate-400" />;
    case "phone":
      return <Phone className="h-3 w-3 text-slate-400" />;
    case "zip":
      return <MapPin className="h-3 w-3 text-slate-400" />;
    case "file_upload":
      return <Upload className="h-3 w-3 text-slate-400" />;
    case "medical_conditions":
      return <HeartPulse className="h-3 w-3 text-emerald-400" />;
    case "allergies":
    case "self_reported_meds":
      return <Stethoscope className="h-3 w-3 text-emerald-400" />;
    case "height_weight":
      return <Scale className="h-3 w-3 text-emerald-400" />;
    default:
      return <List className="h-3 w-3 text-slate-400" />;
  }
}

function getStyleForItem(item: QuestionFlowItem) {
  const type = getElementType(item);
  if (type === "auth") return "bg-indigo-50 border-indigo-200 text-indigo-900";
  if (type === "consent") return "bg-purple-50 border-purple-200 text-purple-900";
  if (type === "checkout") return "bg-amber-50 border-amber-200 text-amber-900";
  if (type === "section") return "bg-blue-50 border-blue-200 text-blue-900";

  const isMedical = ["medical_conditions", "allergies", "self_reported_meds", "height_weight"].includes(item.kind);
  if (isMedical) {
    return "bg-emerald-50 border-emerald-200 text-emerald-900";
  }
  return "bg-slate-50 border-slate-200 text-slate-900";
}

export function QuestionFlowChip({ item, index, onDragStart, onDragEnd, onDelete }: QuestionFlowChipProps) {
  return (
    <div
      className={cn(
        "flex min-h-[76px] w-[160px] shrink-0 flex-col justify-between gap-1.5 rounded-xl border p-3 shadow-sm transition-all duration-150 cursor-grab select-none hover:border-slate-400 hover:shadow-md active:cursor-grabbing",
        getStyleForItem(item)
      )}
      draggable
      onDragStart={(event) => onDragStart(event, index)}
      onDragEnd={onDragEnd}
      data-testid={`question-canvas-chip-${item.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider opacity-85 overflow-hidden">
          {getIconForItem(item)}
          <span className="truncate">{getElementType(item) === "question" ? item.kind.replace(/_/g, " ") : getElementType(item)}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="text-slate-400 hover:text-red-500 transition-colors ml-1"
        >
          &times;
        </button>
      </div>
      <div className="line-clamp-2 text-[11.5px] font-bold leading-snug">{item.text || "Untitled Question"}</div>
      <div className="truncate text-[9.5px] leading-none opacity-65">
        {item.required ? "Required" : "Optional"}
      </div>
    </div>
  );
}
