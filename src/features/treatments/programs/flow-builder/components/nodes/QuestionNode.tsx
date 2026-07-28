import { Handle, Position } from "reactflow";
import { CircleDot } from "lucide-react";
import type { ProgramQuestion } from "../../../../types";
import { choiceHandleId, MAX_VISIBLE_CHOICES } from "../../utils/flowLayoutHelpers";

interface ChoicePillProps {
  choice: string;
  isDq: boolean;
  isBranch: boolean;
  isProduct: boolean;
  isReturn: boolean;
  isFocused: boolean;
  focusedKind?: string;
  isMultiple: boolean;
  nodeId: string;
}

function ChoicePill({
  choice,
  isDq,
  isBranch,
  isProduct,
  isReturn,
  isFocused,
  focusedKind,
  isMultiple,
  nodeId,
}: ChoicePillProps) {
  let pillClass = "bg-[#f7f9fc] border-slate-200 text-slate-700";
  let dotClass = "border-slate-400 bg-slate-400 shadow-[0_0_0_2px_#fff,0_0_0_3px_#94a3b8]";
  let handleColorClass = "!bg-slate-400";
  const activeKind = focusedKind || (isFocused ? (isProduct ? "product" : isBranch ? "conditional" : isReturn ? "return" : "") : "");

  if (isDq) {
    pillClass = "bg-red-55/80 border-red-200 text-red-900";
    dotClass = "bg-red-600 shadow-[0_0_0_2px_#fff,0_0_0_3px_#dc2626]";
  } else if (isProduct) {
    pillClass = isFocused
      ? "bg-emerald-100/80 border-emerald-400 text-emerald-900 font-semibold shadow-sm"
      : "bg-emerald-50/70 border-emerald-200 text-slate-700 hover:border-emerald-300";
    dotClass = "border-emerald-500 bg-emerald-500 shadow-[0_0_0_2px_#fff,0_0_0_3px_#10b981]";
    handleColorClass = "!bg-emerald-500";
  } else if (isBranch) {
    pillClass = isFocused
      ? "bg-blue-100/80 border-blue-400 text-blue-900 font-semibold shadow-sm"
      : "bg-blue-50/70 border-blue-200 text-slate-700 hover:border-blue-300";
    dotClass = "border-blue-500 bg-blue-500 shadow-[0_0_0_2px_#fff,0_0_0_3px_#3b82f6]";
    handleColorClass = "!bg-blue-500";
  } else if (isReturn) {
    pillClass = isFocused
      ? "bg-slate-100 border-slate-400 text-slate-900 font-semibold shadow-sm"
      : "bg-slate-50 border-slate-300 text-slate-700";
    dotClass = "border-slate-500 bg-slate-500 shadow-[0_0_0_2px_#fff,0_0_0_3px_#64748b]";
    handleColorClass = "!bg-slate-500";
  }

  if (activeKind === "product") {
    pillClass = "bg-emerald-100 border-emerald-500 text-emerald-950 font-bold shadow-[0_0_0_2px_rgba(16,185,129,0.16)]";
    dotClass = "border-emerald-600 bg-emerald-600 shadow-[0_0_0_2px_#fff,0_0_0_4px_#10b981]";
    handleColorClass = "!bg-emerald-600";
  } else if (activeKind === "conditional") {
    pillClass = "bg-blue-100 border-blue-500 text-blue-950 font-bold shadow-[0_0_0_2px_rgba(59,130,246,0.16)]";
    dotClass = "border-blue-600 bg-blue-600 shadow-[0_0_0_2px_#fff,0_0_0_4px_#3b82f6]";
    handleColorClass = "!bg-blue-600";
  } else if (activeKind === "return") {
    pillClass = "bg-slate-100 border-slate-500 text-slate-950 font-bold shadow-[0_0_0_2px_rgba(100,116,139,0.14)]";
    dotClass = "border-slate-600 bg-slate-600 shadow-[0_0_0_2px_#fff,0_0_0_4px_#64748b]";
    handleColorClass = "!bg-slate-600";
  }

  let dotElement = <span className={`h-2 w-2 rounded-full border ${dotClass}`} />;
  if (isMultiple) {
    dotElement = (
      <span
        className={`h-2 w-2 rounded-[3px] border ${
            isProduct
              ? "border-emerald-500 bg-emerald-500 shadow-[0_0_0_2px_#fff,0_0_0_3px_#10b981] flex items-center justify-center"
              : isBranch
                ? "border-blue-500 bg-blue-500 shadow-[0_0_0_2px_#fff,0_0_0_3px_#3b82f6] flex items-center justify-center"
                : isReturn
                  ? "border-slate-500 bg-slate-500 shadow-[0_0_0_2px_#fff,0_0_0_3px_#64748b] flex items-center justify-center"
              : "border-slate-400 bg-slate-400 shadow-[0_0_0_2px_#fff,0_0_0_3px_#94a3b8] flex items-center justify-center"
        }`}
      >
        {(isBranch || isProduct || isReturn) && <span className="h-0.5 w-0.5 bg-white rounded-sm" />}
      </span>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-all duration-150 ${pillClass}`}
      onMouseEnter={(event) => {
        event.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("program-flow-choice-focus", {
            detail: { nodeId, value: choice },
          })
        );
      }}
      onMouseLeave={(event) => {
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent("program-flow-choice-focus", { detail: null }));
      }}
    >
      <span className="truncate pr-4">{choice}</span>
      <div className="flex items-center gap-1.5 shrink-0">{dotElement}</div>

      <Handle
        type="source"
        position={Position.Right}
        id={choiceHandleId(choice)}
        className={`!w-2 !h-2 !border !border-white !right-[-4px] ${
          isBranch || isProduct || isReturn ? handleColorClass : "!bg-slate-300"
        }`}
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          opacity: isBranch || isProduct || isReturn ? 1 : 0,
        }}
      />
    </div>
  );
}

function QuestionInputPreview({
  question,
  branchChoices,
  productChoices,
  returnChoices,
  focusedChoices,
  focusedChoiceKinds,
  nodeId,
}: {
  question: ProgramQuestion;
  branchChoices: string[];
  productChoices: string[];
  returnChoices: string[];
  focusedChoices: string[];
  focusedChoiceKinds: Record<string, string>;
  nodeId: string;
}) {
  const kind = question.kind;
  const choices = question.choices || [];

  if (
    (kind === "single_choice" || kind === "yes_no" || kind === "multiple_choice" || kind === "sex") &&
    choices.length > 0
  ) {
    const shown = choices.slice(0, MAX_VISIBLE_CHOICES);
    return (
      <div className="mt-1.5 space-y-[5px]">
        {shown.map((choice, idx) => (
          <ChoicePill
            key={idx}
            choice={choice}
            isDq={(question.dqChoices || []).includes(choice)}
            isBranch={branchChoices.includes(choice)}
            isProduct={productChoices.includes(choice)}
            isReturn={returnChoices.includes(choice)}
            isFocused={focusedChoices.includes(choice)}
            focusedKind={focusedChoiceKinds[choice]}
            isMultiple={kind === "multiple_choice"}
            nodeId={nodeId}
          />
        ))}
        {choices.length > MAX_VISIBLE_CHOICES && (
          <div className="pl-0.5 text-[9.5px] italic font-medium text-slate-400">
            + {choices.length - MAX_VISIBLE_CHOICES} more options
          </div>
        )}
      </div>
    );
  }

  const placeholderMap: Record<string, string> = {
    text: "Free text answer",
    textarea: "Free text answer",
    number: "Enter a number",
    date: "Select a date",
    email: "Enter email address",
    phone: "Enter phone number",
    zip: "Enter ZIP code",
    height_weight: "Height / Weight",
    medical_conditions: "Free text answer",
    allergies: "Free text answer",
    self_reported_meds: "Free text answer",
    file_upload: "Upload file",
    state_routing: "Select state",
    medication_dose: "Select dose",
    pharmacy: "Search pharmacy",
    personal_details: "Patient details",
    shipping_address: "Shipping address",
    labs_preference: "Lab preference",
    consent: "Consent agreement",
    checkout: "Product selection",
  };

  return (
    <div className="mt-1">
      <div className="rounded-md border border-slate-200 bg-[#f7f9fc] px-2.5 py-2 text-[11px] italic text-slate-400">
        {placeholderMap[kind] || "Enter answer"}
      </div>
    </div>
  );
}

type QuestionNodeData = {
  question: ProgramQuestion;
  isConditional?: boolean;
  hasActiveFocus?: boolean;
  isFocusedPath?: boolean;
  isFocused?: boolean;
  branchChoices?: string[];
  productChoices?: string[];
  returnChoices?: string[];
  focusedChoices?: string[];
  focusedChoiceKinds?: Record<string, string>;
};

export default function QuestionNode({ data }: { data: QuestionNodeData }) {
  const q = data.question as ProgramQuestion;
  const isConditional = data.isConditional === true;
  const isDimmed = data.hasActiveFocus && !data.isFocusedPath;

  const branchChoices = data.branchChoices || [];
  const productChoices = data.productChoices || [];
  const returnChoices = data.returnChoices || [];
  const focusedChoices = data.focusedChoices || [];
  const focusedChoiceKinds = data.focusedChoiceKinds || {};

  return (
    <div
      className={`w-[300px] overflow-hidden rounded-[10px] text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ${
        isDimmed ? "opacity-35" : ""
      } ${
        data.isFocused
          ? "border-2 border-blue-500 ring-[3px] ring-blue-100 shadow-lg bg-white"
          : isConditional
            ? "border border-amber-200 bg-white hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
            : "border border-slate-200 bg-white hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white !top-[28px]"
      />

      <div className="flex items-center justify-between border-b border-slate-200 bg-[#fffbeb] px-3 py-[5px]">
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.05em] text-[#b45309]">
          <CircleDot className="h-2.5 w-2.5" />
          QUESTION
        </span>
        {isConditional && (
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-orange-600">
            Conditional
          </span>
        )}
      </div>

      <div className="px-3 pt-2.5 h-[46px] overflow-hidden">
        <h4 className="line-clamp-2 break-words text-[12.5px] font-semibold leading-[1.35] text-slate-900">
          {q.text || "(no text)"}
        </h4>
      </div>

      <div className="px-2.5 pb-2.5">
        <QuestionInputPreview
          question={q}
          branchChoices={branchChoices}
          productChoices={productChoices}
          returnChoices={returnChoices}
          focusedChoices={focusedChoices}
          focusedChoiceKinds={focusedChoiceKinds}
          nodeId={q.id}
        />
      </div>

      <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
        {q.required !== false && (
          <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            Required
          </span>
        )}
        {q.dqChoices && q.dqChoices.length > 0 && (
          <span className="text-[7px] font-bold uppercase tracking-wider text-red-600 bg-red-55 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-0.5">
            <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
            Disqualifying
          </span>
        )}
        {q.hiddenFromPatient && (
          <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            Hidden
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}
