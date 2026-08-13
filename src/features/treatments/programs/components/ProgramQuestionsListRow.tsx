import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { GripVertical, Check, FileCheck, Layers3, LockKeyhole, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import type { ProgramQuestion } from "@/features/treatments/types";
import { Button } from "@/components/ui/button";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import {
  PROGRAM_AUTHORING_COPY,
  PROGRAM_ELEMENT_TONES,
  PROGRAM_QUESTION_KIND_LABELS,
} from "@/features/treatments/programs/programAuthoringConstants";
import { formatCheckoutQuestionText } from "@/features/treatments/programs/checkout-question/utils/checkoutTitleUtils";

interface ProgramQuestionsListRowProps {
  question: ProgramQuestion;
  index: number;
  isReorderActive: boolean;
  onEdit: (question: ProgramQuestion) => void;
  onDelete: (questionId: string) => void;
}

export function ProgramQuestionsListRow({
  question,
  index,
  isReorderActive,
  onEdit,
  onDelete,
}: ProgramQuestionsListRowProps) {
  const navigate = useNavigate();
  const isAuth = question.kind === "patient_authentication";
  const isCheckout = question.kind === "checkout";
  const isConsent = question.kind === "consent";
  const isSection = question.kind === "section";
  const isSystem = question.elementConfig?.system === true;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled: !isReorderActive || isAuth || isSystem,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };
  const tone = isAuth
    ? PROGRAM_ELEMENT_TONES.auth
    : isCheckout
      ? PROGRAM_ELEMENT_TONES.checkout
      : isConsent
        ? PROGRAM_ELEMENT_TONES.consent
        : isSection
          ? PROGRAM_ELEMENT_TONES.section
          : PROGRAM_ELEMENT_TONES.question;
  const ElementIcon = isAuth ? LockKeyhole : isCheckout ? ShoppingCart : isConsent ? FileCheck : isSection ? Layers3 : null;
  const primaryText = isCheckout
    ? formatCheckoutQuestionText(question.checkoutProducts, question.text)
    : question.text;
  const secondaryText = isAuth
    ? PROGRAM_AUTHORING_COPY.authDescription
    : isCheckout
      ? question.checkoutProducts?.map((product) => [product.regimen ? `${product.regimen}` : "", product.rxDaysSupply ? `${product.rxDaysSupply}-day supply` : ""].filter(Boolean).join(" · ")).filter(Boolean).join(", ")
      : question.elementConfig?.description;

  const consentLibraryId = question.elementConfig?.sourceId;

  const navigateToSection = () => {
    const sectionId = question.elementConfig?.sourceSectionId || question.elementConfig?.sourceId;
    if (sectionId) {
      navigate(`${ADMIN_TREATMENT_ROUTES.sections}?sectionId=${sectionId}&view=list`);
    }
  };

  const navigateToConsent = () => {
    if (consentLibraryId) {
      navigate(`${ADMIN_TREATMENT_ROUTES.consents}?consentId=${consentLibraryId}`);
    }
  };

  // Linked consents are edited in the shared consent library. Inline consents
  // are owned by the program and must use the normal question editor.
  const hasLinkedConsent = isConsent && Boolean(question.elementConfig?.sourceId);
  const handleEdit = () => {
    if (isSection) {
      navigateToSection();
    } else if (hasLinkedConsent) {
      navigateToConsent();
    } else {
      onEdit(question);
    }
  };

  const handleRowClick = () => {
    if (isReorderActive) return;
    handleEdit();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleRowClick}
      className={`group grid min-h-[46px] grid-cols-[44px_minmax(0,1fr)_100px_120px_72px] items-center gap-4 border-b border-slate-100 px-7 py-2 transition-colors ${isReorderActive ? "cursor-default" : "cursor-pointer"} ${
        isDragging ? "bg-slate-100/50 shadow-md" : "bg-white hover:bg-slate-50/80"
      }`}
    >
      {/* 1. Drag & Index */}
      <div className="flex items-center gap-2">
        {isReorderActive ? (
          <div
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
            className="p-1 -ml-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        ) : (
          null
        )}
        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold ${index === 0 ? "border-slate-500 bg-slate-600 text-white" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
          {index + 1}
        </div>
      </div>

      {/* 2. Text */}
      <div className="flex min-w-0 items-start gap-2 pr-4">
        {ElementIcon && (
          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${tone.icon}`}>
            <ElementIcon className="h-2.5 w-2.5" />
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-[11.5px] font-semibold leading-4 text-slate-900">{primaryText}</div>
          {typeof secondaryText === "string" && secondaryText && (
            <div className="truncate text-[9.5px] leading-3.5 text-slate-500">{secondaryText}</div>
          )}
        </div>
      </div>

      {/* 3. Required */}
      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-700">
        {question.required ? (
          <>
            <Check className="h-3 w-3 text-slate-600 stroke-[3]" />
            Required
          </>
        ) : (
          <span className="text-slate-300 font-normal">Optional</span>
        )}
      </div>

      {/* 4. Type & Tags */}
      <div className="flex items-start">
        <div className={`inline-flex items-center rounded border px-2 py-1 text-[9px] font-medium ${tone.badge}`}>
          {PROGRAM_QUESTION_KIND_LABELS[question.kind]}
        </div>
      </div>

      {/* 5. Actions (Hover Only) */}
      <div className="flex justify-end gap-1 text-right">
        {/* The author added Patient Authentication, so they can configure and
            remove it. It still cannot be dragged — it is pinned first — and
            publication requires it, so removing it blocks publish. */}
        {isSystem && !isAuth ? (
          <span className="pr-1 text-[9px] italic text-slate-300">System</span>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                handleEdit();
              }}
              className="h-6 w-6 rounded text-slate-300 hover:bg-blue-50 hover:text-blue-600"
              title={isSection ? "Go to Section" : hasLinkedConsent ? "Go to Consent" : "Edit Element"}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => { event.stopPropagation(); onDelete(question.id); }}
              className="h-6 w-6 rounded text-slate-300 hover:bg-red-50 hover:text-red-600"
              title="Delete Element"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
