import { useMemo, useState } from "react";
import { ArrowDownAZ, Clock3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showFloatingToast } from "@/components/ui/floating-toast";
import { EmptyStateCard, PatientPreviewDialog, SlugEditorModal } from "@/features/treatments/common/components";
import { useClients } from "@/hooks/useClients";
import { getTreatmentApiErrorMessage } from "@/features/treatments/common/utils/apiError";
import { normalizeTreatmentSlug } from "@/features/treatments/common/utils/slug";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import {
  usePrograms,
  useUpdateProgramSlug,
  useUpdateProgramGroupStatus,
  useUpdateProgramStatus,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { ProgramListTable } from "@/features/treatments/programs/components/ProgramListTable";
import {
  getTreatmentGroupProgramIds,
  isTreatmentGroupLive,
  ProgramTreatmentCard,
  type ProgramTreatmentGroup,
} from "@/features/treatments/programs/components/ProgramTreatmentCard";
import type { Program, ProgramStatus } from "@/features/treatments/types";
import { buildQuestionnairePreviewUrl } from "@/features/treatments/utils/previewUrl";
import { cn } from "@/lib/utils";

type ProgramsFilter = "all" | "missing_follow_up";
type ProgramsSort = "recent" | "alpha";
type ProgramsViewMode = "card" | "list";

const stripTreatmentSuffix = (name: string) => name.replace(/\s+(Intake|Follow-?up)$/i, "").trim() || name.trim();

const formatQuery = (value: string) => value.toLowerCase().trim();

const getProgramSearchText = (program?: Program) =>
  [program?.name, program?.slug, program?.visitType, program?.treatmentTypeKey]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getLatestUpdatedAt = (intake?: Program, followUp?: Program) => {
  const values = [intake?.updatedAt, followUp?.updatedAt].filter(Boolean) as string[];
  return values.sort((a, b) => b.localeCompare(a))[0] ?? "";
};

const buildTreatmentGroups = (programs: Program[]): ProgramTreatmentGroup[] => {
  const map = new Map<string, { intake?: Program; followUp?: Program }>();

  programs.forEach((program) => {
    const entry = map.get(program.treatmentTypeKey) ?? {};
    if (program.stage === "intake") entry.intake = program;
    if (program.stage === "follow_up") entry.followUp = program;
    map.set(program.treatmentTypeKey, entry);
  });

  return Array.from(map.entries()).map(([treatmentTypeKey, value]) => {
    const primaryProgram = value.intake ?? value.followUp;

    return {
      treatmentTypeKey,
      treatmentName: stripTreatmentSuffix(primaryProgram?.name ?? treatmentTypeKey),
      visitType: primaryProgram?.visitType ?? value.intake?.visitType ?? value.followUp?.visitType ?? "—",
      intake: value.intake,
      followUp: value.followUp,
      latestUpdatedAt: getLatestUpdatedAt(value.intake, value.followUp),
    };
  });
};

const sortButtonClassName = (active: boolean) =>
  cn(
    "h-10 rounded-lg px-4 text-xs font-semibold shadow-sm transition-colors",
    active
      ? "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-600 dark:bg-blue-100 dark:text-blue-600 dark:hover:bg-blue-300"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#151924] dark:text-slate-300 dark:hover:bg-[#1b2030]"
  );

const statusSegmentClassName = (active: boolean) =>
  cn(
    "flex min-h-[82px] flex-col justify-center px-5 py-4 text-left transition-colors",
    active
      ? "bg-[#eef1ff] text-slate-950 dark:bg-[#202547] dark:text-slate-50"
      : "bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#1b2030]"
  );

const clientApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://knysysapi.welliemd.com/api/v1";

export default function ProgramsPage() {
  const { data: programs = [] } = usePrograms();
  const { currentClient } = useClients();
  const updateProgramSlug = useUpdateProgramSlug();
  const updateProgramGroupStatus = useUpdateProgramGroupStatus();
  const updateProgramStatus = useUpdateProgramStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProgramsSort>("recent");
  const [filter, setFilter] = useState<ProgramsFilter>("all");
  const [viewMode, setViewMode] = useState<ProgramsViewMode>("card");
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);
  const [updatingLiveProgramId, setUpdatingLiveProgramId] = useState<string | null>(null);

  const questionnaireBaseUrl = useMemo(() => {
    const base = currentClient?.resolved_questionnaire_url || currentClient?.questionnaire_url;
    return base ? base.replace(/\/+$/, "") : "";
  }, [currentClient]);

  const groupedTreatments = useMemo(() => buildTreatmentGroups(programs), [programs]);
  const treatmentNameByKey = useMemo(
    () =>
      groupedTreatments.reduce<Record<string, string>>((acc, group) => {
        acc[group.treatmentTypeKey] = group.treatmentName;
        return acc;
      }, {}),
    [groupedTreatments]
  );

  const totalTreatmentsCount = groupedTreatments.length;
  const missingFollowUpCount = groupedTreatments.filter((group) => !group.followUp && Boolean(group.intake)).length;

  const filteredTreatments = useMemo(() => {
    const query = formatQuery(searchQuery);

    let result = groupedTreatments.filter((group) => {
      if (filter === "missing_follow_up" && group.followUp) return false;
      if (!query) return true;

      const searchableText = [
        group.treatmentName,
        group.treatmentTypeKey,
        getProgramSearchText(group.intake),
        getProgramSearchText(group.followUp),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "alpha") return a.treatmentName.localeCompare(b.treatmentName);
      return b.latestUpdatedAt.localeCompare(a.latestUpdatedAt);
    });

    return result;
  }, [filter, groupedTreatments, searchQuery, sortBy]);

  const filteredPrograms = useMemo(() => {
    const query = formatQuery(searchQuery);

    let result = programs.filter((program) => {
      if (!query) return true;

      const searchableText = [
        program.name,
        program.slug,
        program.visitType,
        program.treatmentTypeKey,
        treatmentNameByKey[program.treatmentTypeKey],
        program.stage,
        program.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "alpha") return a.name.localeCompare(b.name);
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return result;
  }, [programs, searchQuery, sortBy, treatmentNameByKey]);

  const handleOpenSlugEditor = (program: Program) => {
    setEditingProgram(program);
  };

  const handleCloseSlugEditor = (open: boolean) => {
    if (!open) setEditingProgram(null);
  };

  const handleSaveSlug = async (slug: string) => {
    if (!editingProgram) return;
    const nextSlug = normalizeTreatmentSlug(slug || editingProgram.slug);

    try {
      await updateProgramSlug.mutateAsync({
        programId: editingProgram.id,
        slug: nextSlug,
      });
      showFloatingToast({ title: "Slug Updated" });
    } catch (error) {
      if (isDuplicateSlugError(error)) {
        showDuplicateSlugToast();
      } else {
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Slug could not be updated"),
        });
      }
      throw error;
    }
  };

  const handleOpenPreview = (program: Program) => {
    setPreviewProgram(program);
  };

  const handlePreviewOpenChange = (open: boolean) => {
    if (!open) setPreviewProgram(null);
  };

  const handleToggleLive = async (group: ProgramTreatmentGroup, live: boolean) => {
    const nextStatus = live ? "published" : "draft";
    const currentLive = isTreatmentGroupLive(group);
    if (currentLive === live) return;

    const programIds = getTreatmentGroupProgramIds(group);
    if (programIds.length === 0) return;

    const updateKey = group.intake?.id ?? group.followUp?.id ?? group.treatmentTypeKey;
    setUpdatingLiveProgramId(updateKey);

    try {
      await updateProgramGroupStatus.mutateAsync({
        programIds,
        status: nextStatus,
      });
    } catch {
      showFloatingToast({
        title: "Cannot update the Status of your program",
      });
    } finally {
      setUpdatingLiveProgramId((current) => (current === updateKey ? null : current));
    }
  };

  const handleProgramStatusChange = async (program: Program, status: ProgramStatus) => {
    if (program.status === status) return;
    await updateProgramStatus.mutateAsync({
      programId: program.id,
      status,
    });
  };

  const handleCopyProgramUrl = async (program: Program) => {
    if (!questionnaireBaseUrl) {
      showFloatingToast({ title: "Questionnaire URL is not configured for this client" });
      return;
    }
    const intakeUrl = `${questionnaireBaseUrl}/visit/${program.slug}`;
    try {
      await navigator.clipboard?.writeText(intakeUrl);
      showFloatingToast({ title: "Intake URL Copied" });
    } catch {
      // Keep copy failures quiet; the toast should only show after a confirmed write.
    }
  };

  return (
    <div className="min-h-full bg-[#f5f7fb] p-6 text-slate-950 dark:bg-[#0f1117] dark:text-slate-50 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <section className="space-y-5">
          <div className="max-w-5xl">
            <h1 className="text-[30px] font-extrabold tracking-tight text-slate-950 dark:text-slate-50">Programs</h1>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Clinical questionnaires linked to specific treatments. Each treatment has an intake module and
              (optionally) a follow-up module. Set a program to <span className="font-semibold">Published</span> to use
              it in your intake flows.
            </p>
          </div>

          {viewMode === "card" ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none">
              <div className="grid md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={statusSegmentClassName(filter === "all")}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    Total Treatments
                  </span>
                  <span className="mt-1 text-[30px] font-extrabold leading-none text-[#5b4dff] dark:text-[#7b83ff]">
                    {totalTreatmentsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("missing_follow_up")}
                  className={cn(
                    statusSegmentClassName(filter === "missing_follow_up"),
                    "border-t border-slate-200 md:border-l md:border-t-0 dark:border-slate-700"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-500" />
                    Missing Follow-Up
                  </span>
                  <span className="mt-1 text-[30px] font-extrabold leading-none text-slate-950 dark:text-slate-50">
                    {missingFollowUpCount}
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search treatments..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 rounded-lg border-slate-200 bg-white pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-[#151924] dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <Button type="button" variant="outline" onClick={() => setSortBy("alpha")} className={sortButtonClassName(sortBy === "alpha")}>
              <ArrowDownAZ className="h-4 w-4" />
              Sort A-Z
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setSortBy("recent")}
              className={sortButtonClassName(sortBy === "recent")}
            >
              <Clock3 className="h-4 w-4" />
              Recently updated
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setViewMode((current) => (current === "card" ? "list" : "card"))}
            className="h-10 rounded-lg border-[#5b4dff] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-[#151924] dark:text-slate-300 dark:hover:bg-[#1b2030]"
          >
            {viewMode === "card" ? "List view" : "Card view"}
          </Button>
        </section>

        {viewMode === "list" ? (
          filteredPrograms.length === 0 ? (
            <EmptyStateCard title="No programs found" description="No program rows match your search." />
          ) : (
            <ProgramListTable
              programs={filteredPrograms}
              treatmentNameByKey={treatmentNameByKey}
              onEditSlug={handleOpenSlugEditor}
              onPreviewProgram={handleOpenPreview}
              onStatusChange={handleProgramStatusChange}
              onCopyUrl={handleCopyProgramUrl}
            />
          )
        ) : filteredTreatments.length === 0 ? (
          <EmptyStateCard
            title="No treatments found"
            description={
              filter === "missing_follow_up"
                ? "No intake programs are missing a follow-up module for the current search."
                : "No treatment groups match your search."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {filteredTreatments.map((group) => (
              <ProgramTreatmentCard
                key={group.treatmentTypeKey}
                group={group}
                onEditSlug={handleOpenSlugEditor}
                onPreviewProgram={handleOpenPreview}
                onToggleLive={handleToggleLive}
                isUpdatingLive={updatingLiveProgramId === (group.intake?.id ?? group.followUp?.id ?? group.treatmentTypeKey)}
              />
            ))}
          </div>
        )}
      </div>

      <SlugEditorModal
        open={Boolean(editingProgram)}
        onOpenChange={handleCloseSlugEditor}
        title="Edit Slug"
        description={
          <>
            Set a unique URL slug for this treatment. Use lowercase letters, numbers, and hyphens only.
          </>
        }
        previewUrlPrefix={`${questionnaireBaseUrl}/visit/`}
        currentSlug={editingProgram?.slug ?? ""}
        onSave={handleSaveSlug}
        allowEmpty={false}
      />

      {previewProgram ? (
        <PatientPreviewDialog
          open={Boolean(previewProgram)}
          onOpenChange={handlePreviewOpenChange}
          previewUrl={buildQuestionnairePreviewUrl({
            type: "program",
            id: previewProgram.id,
            slug: previewProgram.slug,
            visitType: previewProgram.visitType,
            templateId: previewProgram.sourceQuestionnaireTemplateId,
            apiBaseUrl: clientApiBaseUrl,
          })}
          subtitle={`${previewProgram.name} · how patients see this ${previewProgram.stage === "follow_up" ? "follow-up" : "intake"}`}
          iframeTitle={`${previewProgram.name} questionnaire preview`}
        />
      ) : null}
    </div>
  );
}
