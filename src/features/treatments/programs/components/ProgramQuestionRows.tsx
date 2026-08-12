import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Eye, GripVertical, LockKeyhole, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Program, ProgramQuestion, QuestionKind } from "@/features/treatments/types";
import {
  buildQuestionnairePreviewUrl,
  getQuestionnairePreviewApiBaseUrl,
} from "@/features/treatments/utils/previewUrl";
import { cn } from "@/lib/utils";

export type ProgramQuestionTypeFilter = "all" | QuestionKind | "auth";

export interface ProgramQuestionDisplayRow {
  id: string;
  kind: QuestionKind | "auth";
  text: string;
  subtitle?: string;
  required: boolean;
  source: "auth" | "question";
  question?: ProgramQuestion;
}

export const PROGRAM_QUESTION_TYPE_FILTERS: Array<{
  value: ProgramQuestionTypeFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
];

export const HIDDEN_SYSTEM_QUESTION_KINDS = new Set<QuestionKind>([
  "personal_details",
]);

export const stripTreatmentSuffix = (name: string) =>
  name.replace(/\s+(Intake|Follow-?up)$/i, "").trim() || name.trim();

export const hasEnabledAuth = (program: Program) => {
  const auth = program.authConfig;
  return Boolean(auth && (auth.email || auth.phone || auth.identity || auth.account));
};

export const isAuthQuestion = (question: ProgramQuestion) =>
  question.kind === "personal_details" || question.kind === "auth";

export const formatProgramStatus = (status: Program["status"]) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const formatQuestionKind = (kind: QuestionKind | "auth") => {
  const labels: Partial<Record<QuestionKind | "auth", string>> = {
    auth: "Auth",
    single_choice: "Single Choice",
    multiple_choice: "Multiple Choice",
    yes_no: "Yes / No",
    height_weight: "Height Weight",
    file_upload: "File Upload",
    state_routing: "State Routing",
    medication_dose: "Medication Dose",
    personal_details: "Auth",
    shipping_address: "Shipping Address",
    medical_conditions: "Medical Conditions",
    self_reported_meds: "Self Reported Meds",
    labs_preference: "Labs Preference",
  };
  return labels[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1).replace(/_/g, " ");
};

export const getProgramQuestionSearchText = (row: ProgramQuestionDisplayRow) =>
  [
    row.text,
    row.subtitle,
    formatQuestionKind(row.kind),
    row.question?.section,
    row.question?.choices?.join(" "),
    row.question?.consentText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const buildAuthSubtitle = (
  program: Program,
  authQuestion?: ProgramQuestion,
) => {
  if (authQuestion?.text && authQuestion.text !== "Patient Authentication") {
    return authQuestion.text;
  }
  const enabled = [
    program.authConfig?.email ? "Email" : null,
    program.authConfig?.phone ? "SMS" : null,
    program.authConfig?.identity ? "Identity" : null,
    program.authConfig?.account ? "Account" : null,
  ].filter(Boolean);
  return enabled.length > 0
    ? `${enabled.join(" & ")} verification - managed by WellieMD`
    : "Email & SMS verification - managed by WellieMD";
};

export const createProgramQuestionId = () => `program-question-${Date.now()}`;

export const getDefaultQuestionSection = (questions: ProgramQuestion[]) =>
  questions.find((question) => question.section)?.section ?? "Custom Questions";

export const isClientCreatedQuestion = (
  question: ProgramQuestion | null | undefined,
) =>
  Boolean(
    question &&
      (question.source === "client" ||
        question.is_client_custom === true ||
        question.id.startsWith("program-question-")),
  );

export const isLockedProgramQuestion = (
  question: ProgramQuestion | null | undefined,
) =>
  !question ||
  question.locked === true ||
  question.is_read_only === true ||
  question.can_be_modified === false ||
  !isClientCreatedQuestion(question);

export const buildQuestionPreviewUrl = (
  program: Program,
  question: ProgramQuestion,
) => {
  const previewUrl = buildQuestionnairePreviewUrl({
    type: "program",
    id: program.id,
    slug: program.slug,
    visitType: program.visitType,
    templateId: program.sourceQuestionnaireTemplateId,
    apiBaseUrl: getQuestionnairePreviewApiBaseUrl(),
  });
  try {
    const url = new URL(previewUrl);
    url.searchParams.set("question_id", question.id);
    return url.toString();
  } catch {
    const separator = previewUrl.includes("?") ? "&" : "?";
    return `${previewUrl}${separator}question_id=${encodeURIComponent(question.id)}`;
  }
};

export function SortableQuestionRow({
  row,
  index,
  isReorderActive,
  onEdit,
  onDelete,
  onPreviewLockedQuestion,
}: {
  row: ProgramQuestionDisplayRow;
  index: number;
  isReorderActive: boolean;
  onEdit: (question: ProgramQuestion) => void;
  onDelete: (questionId: string) => void;
  onPreviewLockedQuestion: (question: ProgramQuestion) => void;
}) {
  const isClientQuestion = isClientCreatedQuestion(row.question);
  const isLocked = isLockedProgramQuestion(row.question);
  const canOpenRowEditor = Boolean(row.question && isClientQuestion && !isLocked && !isReorderActive);
  const canPreviewQuestion = Boolean(row.question && !canOpenRowEditor);
  const sortable = useSortable({
    id: row.id,
    disabled: !isReorderActive || !isClientQuestion || isLocked,
  });
  const handleRowClick = () => {
    if (!row.question) return;
    if (canOpenRowEditor) onEdit(row.question);
    else onPreviewLockedQuestion(row.question);
  };

  return <div
    ref={sortable.setNodeRef}
    style={{
      transform: CSS.Transform.toString(sortable.transform),
      transition: sortable.transition,
      opacity: sortable.isDragging ? 0.55 : 1,
      zIndex: sortable.isDragging ? 20 : "auto",
    }}
    onClick={handleRowClick}
    className={cn(
      "group grid min-h-[66px] grid-cols-[52px_minmax(0,1fr)_120px_170px_92px] items-center gap-4 border-b border-slate-100 bg-white px-4 transition-colors hover:bg-slate-50/70 dark:border-slate-800 dark:bg-[#11151f] dark:hover:bg-slate-800/40 md:px-8",
      Boolean(row.question) && "cursor-pointer",
      sortable.isDragging && "shadow-lg",
    )}
  >
    <div className="flex items-center gap-2">
      {isReorderActive && isClientQuestion && !isLocked && <button
        type="button"
        {...sortable.attributes}
        {...sortable.listeners}
        className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        aria-label={`Drag ${row.text}`}
      ><GripVertical className="h-4 w-4" /></button>}
      <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-slate-50 text-xs font-semibold text-slate-500">{index + 1}</span>
    </div>
    <div className="min-w-0 text-sm font-semibold">
      <div className="flex min-w-0 items-center gap-2">
        <span className="block truncate">{row.text}</span>
        {isClientQuestion && <span className="shrink-0 rounded-[3px] border border-[#4f00ff] px-1.5 py-0.5 text-[10px] font-bold text-[#4f00ff]">ADDED BY YOU</span>}
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-xs font-semibold">
      {row.required ? <><Check className="h-3.5 w-3.5 stroke-[3]" />Required</> : <span className="text-slate-400">Optional</span>}
    </div>
    <div><span className="inline-flex rounded-md border bg-slate-50 px-2.5 py-1 text-xs font-medium">{formatQuestionKind(row.kind)}</span></div>
    <div className={cn("flex items-center justify-start gap-1.5", isClientQuestion && canOpenRowEditor ? "opacity-0 transition-opacity group-hover:opacity-100" : "text-slate-400")}>
      {row.question && canOpenRowEditor ? <>
        <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); onEdit(row.question!); }} className="h-8 w-8" title="Edit question"><Pencil className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); onDelete(row.question!.id); }} className="h-8 w-8" title="Delete question"><Trash2 className="h-4 w-4" /></Button>
      </> : row.question ? <div className="flex items-center gap-1.5">
        <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />
        <button type="button" onClick={(event) => { event.stopPropagation(); onPreviewLockedQuestion(row.question!); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label={`Preview ${row.text}`}><Eye className="h-4 w-4" /></button>
      </div> : <div className="flex h-8 w-8 items-center justify-start"><LockKeyhole className="h-3.5 w-3.5 text-slate-400" /></div>}
    </div>
  </div>;
}

export function AuthRow({ subtitle }: { subtitle: string }) {
  return <div className="grid min-h-[72px] grid-cols-[52px_minmax(0,1fr)_120px_170px_92px] items-center gap-4 border-b border-slate-100 bg-white px-4 dark:border-slate-800 dark:bg-[#11151f] md:px-8">
    <div className="flex items-center justify-center"><span className="flex h-7 w-7 items-center justify-center rounded-full border bg-slate-50 text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /></span></div>
    <div className="min-w-0">
      <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-600"><LockKeyhole className="h-3 w-3" /></span><span className="font-semibold">Patient Authentication</span></div>
      <p className="mt-1 truncate text-xs text-slate-400">{subtitle}</p>
    </div>
    <div className="text-xs font-semibold text-slate-400">System</div>
    <div><span className="inline-flex rounded-md border bg-slate-50 px-2.5 py-1 text-xs font-medium">Auth</span></div>
    <div className="flex h-8 w-8 items-center justify-start text-slate-200"><LockKeyhole className="h-3.5 w-3.5" /></div>
  </div>;
}
