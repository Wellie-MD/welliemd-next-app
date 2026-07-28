import { Link } from "react-router-dom";
import { Droplets, FlaskConical, HeartPulse, Pencil, Scale, Shield, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Program } from "@/features/treatments/types";
import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

export interface ProgramTreatmentGroup {
  treatmentTypeKey: string;
  treatmentName: string;
  visitType: string;
  intake?: Program;
  followUp?: Program;
  latestUpdatedAt: string;
}

interface ProgramTreatmentCardProps {
  group: ProgramTreatmentGroup;
  onEditSlug?: (program: Program) => void;
  onPreviewProgram?: (program: Program) => void;
  onToggleLive?: (group: ProgramTreatmentGroup, live: boolean) => void | Promise<void>;
  liveOverride?: boolean;
  isUpdatingLive?: boolean;
}

type ProgramStageKey = "intake" | "follow_up";

const stageTitles: Record<ProgramStageKey, string> = {
  intake: "Intake",
  follow_up: "Follow-up",
};

const stageAccentClasses: Record<ProgramStageKey, string> = {
  intake: "border-[#e2e8f0] bg-white dark:border-slate-700 dark:bg-[#171b27]",
  follow_up: "border-[#e2e8f0] bg-white dark:border-slate-700 dark:bg-[#171b27]",
};

const stageStatusToneClasses: Record<Program["status"], string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  draft: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200",
  archived: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const stageButtonClasses = "h-8 rounded-lg px-3.5 text-xs font-semibold shadow-sm transition-colors";

const treatmentIconMap: Array<{ match: RegExp; icon: LucideIcon; frame: string }> = [
  {
    match: /glp/i,
    icon: Droplets,
    frame: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  {
    match: /trt|testosterone|enclomiphene/i,
    icon: Scale,
    frame: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  },
  {
    match: /hrt|menopause/i,
    icon: HeartPulse,
    frame: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-300",
  },
  {
    match: /ed|pe/i,
    icon: Shield,
    frame: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  },
  {
    match: /nad/i,
    icon: FlaskConical,
    frame: "bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
  },
];

const defaultTreatmentIcon = {
  icon: Stethoscope,
  frame: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
};

const formatRelativeUpdatedAt = (value: string) => {
  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return value;

  const diffDays = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 86400000));
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated 1 day ago";
  return `Updated ${diffDays} days ago`;
};

const getTreatmentIcon = (key: string) => treatmentIconMap.find((entry) => entry.match.test(key)) ?? defaultTreatmentIcon;

export const getTreatmentGroupPrograms = (group: ProgramTreatmentGroup) =>
  [group.intake, group.followUp].filter((program): program is Program => Boolean(program));

export const getTreatmentGroupProgramIds = (group: ProgramTreatmentGroup) =>
  getTreatmentGroupPrograms(group).map((program) => program.id);

export const isTreatmentGroupLive = (group: ProgramTreatmentGroup) => {
  const groupPrograms = getTreatmentGroupPrograms(group);
  return groupPrograms.length > 0 && groupPrograms.every((program) => program.status === "published");
};

function StagePanel({
  stage,
  program,
  treatmentName,
  onEditSlug,
  onPreviewProgram,
}: {
  stage: ProgramStageKey;
  program?: Program;
  treatmentName: string;
  onEditSlug?: (program: Program) => void;
  onPreviewProgram?: (program: Program) => void;
}) {
  if (!program) {
    return (
      <div className={cn("flex min-h-[252px] flex-1 items-center justify-center px-6 py-5 text-center", stageAccentClasses[stage])}>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {stageTitles[stage]}
          </div>
          <p className="text-sm italic text-slate-500 dark:text-slate-400">
            {stage === "intake" ? "No intake module." : "No follow-up module."}
          </p>
        </div>
      </div>
    );
  }

  const isPublished = program.status === "published";
  const detailUrl = CLIENT_TREATMENT_ROUTES.programQuestions(program.id);

  return (
    <div
      className={cn(
        "flex min-h-[252px] flex-1 flex-col px-5 py-4",
        stage === "intake" && "md:border-r",
        stageAccentClasses[stage]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {stageTitles[stage]}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                stageStatusToneClasses[program.status]
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-emerald-500" : "bg-amber-500")} />
              {program.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Slug
          </span>
          <code className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-[#0f1117] dark:text-slate-200">
            {program.slug}
          </code>
          {onEditSlug ? (
            <button
              type="button"
              onClick={() => onEditSlug(program)}
              className="inline-flex text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-300"
              aria-label={`Edit ${program.name} slug`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            {program.questionCount} question{program.questionCount === 1 ? "" : "s"}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatRelativeUpdatedAt(program.updatedAt)}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-5">
        <Button asChild className={cn(stageButtonClasses, "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600")}>
          <Link to={detailUrl}>Open</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onPreviewProgram?.(program)}
          className={cn(
            stageButtonClasses,
            "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
          )}
        >
          Preview
        </Button>
      </div>

      <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
        {treatmentName} · {program.visitType}
      </div>
    </div>
  );
}

export function ProgramTreatmentCard({
  group,
  onEditSlug,
  onPreviewProgram,
  onToggleLive,
  liveOverride,
  isUpdatingLive,
}: ProgramTreatmentCardProps) {
  const treatmentIcon = getTreatmentIcon(group.treatmentTypeKey);
  const Icon = treatmentIcon.icon;
  const hasFollowUp = Boolean(group.followUp);
  const canToggleLive = getTreatmentGroupProgramIds(group).length > 0;
  const isLive = liveOverride ?? isTreatmentGroupLive(group);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-600 hover:shadow-md dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none dark:hover:border-blue-600">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", treatmentIcon.frame)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
              {group.treatmentName}
            </h2>
            <p className="mt-1 truncate text-[12px] text-slate-500 dark:text-slate-400">
              Treatment type: {group.treatmentTypeKey}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Live
            </div>
          </div>
          <Switch
            checked={isLive}
            disabled={!canToggleLive || isUpdatingLive}
            onCheckedChange={(checked) => {
              if (!canToggleLive) return;
              void onToggleLive?.(group, checked);
            }}
            aria-label={`${group.treatmentName} live status`}
            className="disabled:opacity-100 data-[state=checked]:bg-[#5b4dff] dark:data-[state=checked]:bg-[#7b83ff] data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700" />

      <div className="grid md:grid-cols-2">
        <StagePanel
          stage="intake"
          program={group.intake}
          treatmentName={group.treatmentName}
          onEditSlug={onEditSlug}
          onPreviewProgram={onPreviewProgram}
        />
        <StagePanel
          stage="follow_up"
          program={group.followUp}
          treatmentName={group.treatmentName}
          onEditSlug={onEditSlug}
          onPreviewProgram={onPreviewProgram}
        />
      </div>

      {!hasFollowUp ? <div className="border-t border-slate-200/70 dark:border-slate-700" /> : null}
    </article>
  );
}
