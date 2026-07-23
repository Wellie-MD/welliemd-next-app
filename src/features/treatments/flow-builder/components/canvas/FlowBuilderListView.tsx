import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  GripVertical,
  HelpCircle,
  Layout,
  Lock,
  Settings2,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CommonSection,
  ConsentForm,
  CustomProgram,
  CustomProgramFlowItem,
  Program,
} from "@/features/treatments/types";
import {
  buildAdminCustomProgramStages,
  moveCustomProgramItemWithinStage,
  reorderCustomProgramItemWithinStage,
  type AdminCustomProgramStage,
  type AdminCustomProgramStageItem,
} from "@/features/treatments/flow-builder/utils/customProgramStages";

interface FlowBuilderListViewProps {
  customProgram: CustomProgram;
  programs: Program[];
  sections: CommonSection[];
  consents: ConsentForm[];
  onUpdateFlow?: (items: CustomProgramFlowItem[]) => void;
  onEditQuestion: (item: CustomProgramFlowItem) => void;
  onOpenPreview: () => void;
  onConfigureMatching: () => void;
  onEditCheckoutOverride: (item: CustomProgramFlowItem) => void;
  onDeleteCheckoutOverride: (item: CustomProgramFlowItem) => void;
}

const stageToneClass: Record<AdminCustomProgramStage["tone"], string> = {
  question: "border-violet-200 bg-violet-50 text-violet-700",
  program: "border-teal-200 bg-teal-50 text-teal-700",
  consent: "border-purple-200 bg-purple-50 text-purple-700",
};

const rowMeta = {
  routing_question: {
    label: "QUESTION",
    icon: HelpCircle,
    iconClass: "bg-orange-50 text-orange-600",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-600",
  },
  section: {
    label: "SECTION",
    icon: Layout,
    iconClass: "bg-violet-50 text-violet-600",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-600",
  },
  section_field: {
    label: "SECTION FIELD",
    icon: Layout,
    iconClass: "bg-sky-50 text-sky-600",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-600",
  },
  program: {
    label: "PROGRAM",
    icon: CheckCircle2,
    iconClass: "bg-teal-50 text-teal-600",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-600",
  },
  consent: {
    label: "CONSENT",
    icon: FileCheck,
    iconClass: "bg-purple-50 text-purple-600",
    badgeClass: "border-purple-200 bg-purple-50 text-purple-600",
  },
} as const;

const formatQuestionKind = (value?: string) =>
  String(value || "text")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

function getItemSubtitle(item: AdminCustomProgramStageItem) {
  if (item.kind === "routing_question") {
    const question = item.persistedItem;
    const choices = question?.choices || question?.answerOptions || [];
    return `${formatQuestionKind(question?.questionKind)}${choices.length ? ` · ${choices.length} option${choices.length === 1 ? "" : "s"}` : ""}`;
  }
  if (item.kind === "section") {
    return item.section
      ? `${item.section.fieldCount} field${item.section.fieldCount === 1 ? "" : "s"}, asked as one block`
      : item.subtitle || "Reusable section";
  }
  if (item.kind === "section_field") {
    return item.section
      ? `${item.section.name} · selected reusable field`
      : item.subtitle || "Reusable section field";
  }
  if (item.kind === "program") {
    if (!item.program) return item.subtitle || "Program record unavailable";
    return `${item.program.questionCount} question${item.program.questionCount === 1 ? "" : "s"} · ${item.program.visitType || item.program.treatmentTypeKey} · Onboarding`;
  }
  if (item.derived) {
    return `Auto · for ${item.matchedProgramNames?.join(", ") || "attached Program"}`;
  }
  if (item.consent) return item.consent.scope === "global" ? "Universal" : "Treatment-specific";
  return item.subtitle || "Consent form capture";
}

function LockedSystemRow({
  item,
  itemNumber,
}: {
  item: CustomProgramFlowItem;
  itemNumber: number;
}) {
  const isAuthentication = item.kind === "authentication";
  const Icon = isAuthentication ? User : CreditCard;
  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <GripVertical className="h-4 w-4 shrink-0 text-slate-200" />
      <div className="w-5 shrink-0 text-right text-[11px] font-medium text-slate-400">{itemNumber}</div>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isAuthentication ? "bg-violet-50 text-violet-700" : "bg-slate-950 text-white")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[3px] border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {isAuthentication ? "PATIENT AUTHENTICATION" : "CHECKOUT"}
          </span>
          <span className="text-sm font-semibold text-slate-950">{item.title}</span>
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            <Lock className="h-3 w-3" /> Locked
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500">{item.subtitle}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3 text-slate-400">
        {isAuthentication && <span className="text-[11px] italic">required</span>}
        <Lock className="h-4 w-4" />
      </div>
    </div>
  );
}

function StageRow({
  item,
  itemNumber,
  isFirst,
  isLast,
  onMove,
  onDelete,
  onDropItem,
  onEditQuestion,
  onOpenPreview,
  onConfigureMatching,
}: {
  item: AdminCustomProgramStageItem;
  itemNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
  onDropItem: (sourceId: string, targetId: string) => void;
  onEditQuestion: (item: CustomProgramFlowItem) => void;
  onOpenPreview: () => void;
  onConfigureMatching: () => void;
}) {
  const meta = rowMeta[item.kind];
  const Icon = meta.icon;
  const editable = Boolean(item.persistedItem) && !item.derived;
  const checkoutCount = item.program?.checkoutQuestionCount || 0;

  return (
    <div
      draggable={editable}
      onDragStart={(event) => {
        if (!editable) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-welliemd-stage-item", item.id);
      }}
      onDragOver={(event) => {
        if (editable) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!editable) return;
        event.preventDefault();
        const sourceId = event.dataTransfer.getData("application/x-welliemd-stage-item");
        if (sourceId) onDropItem(sourceId, item.id);
      }}
      className={cn(
        "group flex min-h-[58px] items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm transition-all duration-150",
        item.derived
          ? "border-dashed border-purple-200 bg-purple-50/30"
          : "border-slate-200 hover:border-[#4f00ff] hover:shadow-[0_0_0_1px_rgba(79,0,255,0.12),0_8px_24px_-18px_rgba(79,0,255,0.65)]",
        editable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <GripVertical className={cn("h-4 w-4 shrink-0", editable ? "text-slate-300" : "text-slate-200")} />
      <div className="w-7 shrink-0 text-right text-[11px] font-medium text-slate-400">
        {item.derived ? "AUTO" : itemNumber}
      </div>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.iconClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold", meta.badgeClass)}>
            {meta.label}
          </span>
          <span className="text-sm font-semibold text-slate-950">{item.title}</span>
          {item.kind === "routing_question" && item.persistedItem?.required && (
            <span className="text-[10px] italic text-slate-400">required</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
          <span>{getItemSubtitle(item)}</span>
          {item.kind === "program" && (
            checkoutCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> {checkoutCount} Checkout question{checkoutCount === 1 ? "" : "s"} inherited
              </span>
            ) : (
              <span className="text-[10px] italic text-rose-600">No Checkout questions configured</span>
            )
          )}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 text-slate-400">
        {item.kind === "routing_question" && item.persistedItem && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#4f00ff]" title="Edit question" onClick={() => onEditQuestion(item.persistedItem!)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" title="Preview patient flow" onClick={onOpenPreview}>
              <Eye className="h-4 w-4" />
            </Button>
          </>
        )}
        {item.kind === "program" && item.persistedItem && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#4f00ff]" title="Configure matching rules" onClick={onConfigureMatching}>
              <Settings2 className="h-4 w-4" />
            </Button>
            {item.persistedItem.sourceId && (
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" title="Open Program" asChild>
                <Link to={`/dashboard/treatments/programs/${item.persistedItem.sourceId}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </>
        )}
        {(item.kind === "section" || item.kind === "consent") && (
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" title={`Open ${item.kind} library`} asChild>
            <Link to={`/dashboard/treatments/${item.kind === "section" ? "sections" : "consents"}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {editable ? (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isFirst} title="Move up within stage" onClick={() => onMove("up")}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLast} title="Move down within stage" onClick={() => onMove("down")}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600" title={`Remove ${item.title}`} onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Lock className="mx-2 h-4 w-4" />
        )}
      </div>
    </div>
  );
}

function CheckoutOverrideRow({
  item,
  itemNumber,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDelete,
}: {
  item: CustomProgramFlowItem;
  itemNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/40 px-4 py-3 shadow-sm">
      <GripVertical className="h-4 w-4 text-amber-300" />
      <div className="w-5 text-right text-[11px] text-slate-400">{itemNumber}</div>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><CreditCard className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-[3px] border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">CHECKOUT OVERRIDE</span><span className="text-sm font-semibold text-slate-950">{item.title}</span></div>
        <p className="mt-1 text-xs font-medium text-slate-500">{item.subtitle}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#4f00ff]" title="Edit checkout override" onClick={onEdit}><Edit3 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isFirst} onClick={() => onMove("up")}><ArrowUp className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLast} onClick={() => onMove("down")}><ArrowDown className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

export function FlowBuilderListView({
  customProgram,
  programs,
  sections,
  consents,
  onUpdateFlow,
  onEditQuestion,
  onOpenPreview,
  onConfigureMatching,
  onEditCheckoutOverride,
  onDeleteCheckoutOverride,
}: FlowBuilderListViewProps) {
  const builderList = buildAdminCustomProgramStages(customProgram, { programs, sections, consents });
  let nextItemNumber = 2;

  const update = (items: CustomProgramFlowItem[]) => onUpdateFlow?.(items);
  const remove = (itemId: string) => update(customProgram.flowItems.filter((item) => item.id !== itemId));
  const move = (itemId: string, direction: "up" | "down") =>
    update(moveCustomProgramItemWithinStage(customProgram.flowItems, itemId, direction));
  const drop = (sourceId: string, targetId: string) =>
    update(reorderCustomProgramItemWithinStage(customProgram.flowItems, sourceId, targetId));

  return (
    <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="mx-auto max-w-[880px] space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Patient flow</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{builderList.totalItemCount} items</div>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <LockedSystemRow item={builderList.authenticationItem} itemNumber={1} />
          <div className="mt-6 space-y-6">
            {builderList.stages.map((stage) => {
              const startIndex = nextItemNumber;
              nextItemNumber += stage.items.length;
              const persistedItems = stage.items.filter((item) => !item.derived);
              return (
                <section key={stage.id} className="space-y-2">
                  <div className="flex items-center gap-3 px-2">
                    <span className={cn("rounded-md border px-2 py-1 text-[11px] font-bold uppercase", stageToneClass[stage.tone])}>Stage {stage.stageNumber}</span>
                    <h2 className="text-sm font-bold text-slate-950">{stage.title}</h2>
                    <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-400">{stage.items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stage.items.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-400">No items in this stage yet. Use Add to flow to add one.</div>
                    )}
                    {stage.items.map((item, index) => {
                      const persistedIndex = persistedItems.findIndex((candidate) => candidate.id === item.id);
                      return (
                        <StageRow
                          key={item.id}
                          item={item}
                          itemNumber={startIndex + index}
                          isFirst={persistedIndex <= 0}
                          isLast={persistedIndex === persistedItems.length - 1}
                          onMove={(direction) => move(item.id, direction)}
                          onDelete={() => remove(item.id)}
                          onDropItem={drop}
                          onEditQuestion={onEditQuestion}
                          onOpenPreview={onOpenPreview}
                          onConfigureMatching={onConfigureMatching}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">End of flow</div>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {builderList.checkoutOverrides.map((item, index) => (
          <CheckoutOverrideRow
            key={item.id}
            item={item}
            itemNumber={nextItemNumber + index}
            isFirst={index === 0}
            isLast={index === builderList.checkoutOverrides.length - 1}
            onMove={(direction) => move(item.id, direction)}
            onEdit={() => onEditCheckoutOverride(item)}
            onDelete={() => onDeleteCheckoutOverride(item)}
          />
        ))}
        <LockedSystemRow item={builderList.checkoutItem} itemNumber={builderList.totalItemCount} />
      </div>
    </div>
  );
}
