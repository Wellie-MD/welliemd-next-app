import { useMemo, useState } from "react";
import { ArrowDownAZ, Clock3, Filter, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showFloatingToast } from "@/components/ui/floating-toast";
import { EmptyStateCard, SlugEditorModal } from "@/features/treatments/common/components";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { useBranding } from "@/contexts/BrandingContext";
import { useClients } from "@/hooks/useClients";
import { getTreatmentApiErrorMessage } from "@/features/treatments/common/utils/apiError";
import { normalizeTreatmentSlug } from "@/features/treatments/common/utils/slug";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import {
  usePrograms,
  useUpdateProgramSlug,
  useUpdateProgramStatus,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { ProgramListTable } from "@/features/treatments/programs/components/ProgramListTable";
import { ProgramCard } from "@/features/treatments/programs/components/ProgramCard";
import type { Program, ProgramStatus } from "@/features/treatments/types";
import { cn } from "@/lib/utils";
import { getQuestionnairePreviewApiBaseUrl } from "@/features/treatments/utils/previewUrl";

type ProgramsFilter = "all" | "missing_follow_up";
type ProgramsSort = "recent" | "alpha";
type ProgramsViewMode = "card" | "list";
type ActiveTab = "all" | "intake" | "follow_up";

const stripTreatmentSuffix = (name: string) => name.replace(/\s+(Intake|Follow-?up)$/i, "").trim() || name.trim();

const formatQuery = (value: string) => value.toLowerCase().trim();

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

export default function ProgramsPage() {
  const { brandSettings } = useBranding();
  const { data: programs = [] } = usePrograms();
  const { currentClient } = useClients();
  const updateProgramSlug = useUpdateProgramSlug();
  const updateProgramStatus = useUpdateProgramStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProgramsSort>("recent");
  const [filter, setFilter] = useState<ProgramsFilter>("all");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [viewMode, setViewMode] = useState<ProgramsViewMode>("card");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "draft" | "published">("all");
  const [selectedTreatment, setSelectedTreatment] = useState<string>("all");
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);


  const questionnaireBaseUrl = useMemo(() => {
    const base = currentClient?.resolved_questionnaire_url || currentClient?.questionnaire_url;
    return base ? base.replace(/\/+$/, "") : "";
  }, [currentClient]);

  const treatmentNameByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const program of programs) {
      if (!map.has(program.treatmentTypeKey)) {
        map.set(program.treatmentTypeKey, program.treatmentTypeName || stripTreatmentSuffix(program.name));
      }
    }
    return map;
  }, [programs]);

  const totalTreatmentsCount = new Set(programs.map(p => p.treatmentTypeKey)).size;
  const missingFollowUpCount = (() => {
    const keysWithIntake = new Set(programs.filter(p => p.stage === "intake").map(p => p.treatmentTypeKey));
    const keysWithFollowUp = new Set(programs.filter(p => p.stage === "follow_up").map(p => p.treatmentTypeKey));
    return [...keysWithIntake].filter(key => !keysWithFollowUp.has(key)).length;
  })();

  const treatmentTypes = useMemo(() => {
    const keys = new Set(programs.map(p => p.treatmentTypeKey));
    return Array.from(keys).map(key => ({
      key,
      name: treatmentNameByKey.get(key) || key,
    }));
  }, [programs, treatmentNameByKey]);

  const hasActiveFilters = selectedStatus !== "all" || selectedTreatment !== "all";
  const activeFilterCount = (selectedStatus !== "all" ? 1 : 0) + (selectedTreatment !== "all" ? 1 : 0);

  const filteredPrograms = useMemo(() => {
    const query = formatQuery(searchQuery);

    let result = programs.filter((program) => {
      if (activeTab === "intake" && program.stage !== "intake") return false;
      if (activeTab === "follow_up" && program.stage !== "follow_up") return false;
      if (selectedStatus !== "all" && program.status !== selectedStatus) return false;
      if (selectedTreatment !== "all" && program.treatmentTypeKey !== selectedTreatment) return false;

      if (!query) return true;

      const searchableText = [
        program.name,
        program.slug,
        program.visitType,
        program.treatmentTypeKey,
        treatmentNameByKey.get(program.treatmentTypeKey) || "",
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
  }, [programs, searchQuery, sortBy, activeTab, selectedStatus, selectedTreatment, treatmentNameByKey]);

  const handleSaveSlug = async (programId: string, newSlug: string) => {
    try {
      await updateProgramSlug.mutateAsync({ programId, slug: newSlug });
      showFloatingToast({ title: "Slug Updated" });
    } catch (error) {
      if (isDuplicateSlugError(error)) {
        showDuplicateSlugToast();
      } else {
        showFloatingToast({
          title: getTreatmentApiErrorMessage(error, "Slug could not be updated"),
        });
      }
    }
  };

  const handleOpenPreview = (program: Program) => {
    setPreviewProgram(program);
  };

  const handlePreviewOpenChange = (open: boolean) => {
    if (!open) setPreviewProgram(null);
  };

  const handleProgramStatusChange = async (program: Program, status: ProgramStatus) => {
    if (program.status === status) return;
    await updateProgramStatus.mutateAsync({ programId: program.id, status });
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
      // quiet
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
                <button type="button" onClick={() => setFilter("all")} className={statusSegmentClassName(filter === "all")}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Total Treatments</span>
                  <span className="mt-1 text-[30px] font-extrabold leading-none text-[#5b4dff] dark:text-[#7b83ff]">{totalTreatmentsCount}</span>
                </button>
                <button type="button" onClick={() => setFilter("missing_follow_up")}
                  className={cn(statusSegmentClassName(filter === "missing_follow_up"), "border-t border-slate-200 md:border-l md:border-t-0 dark:border-slate-700")}>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-500" />Missing Follow-Up
                  </span>
                  <span className="mt-1 text-[30px] font-extrabold leading-none text-slate-950 dark:text-slate-50">{missingFollowUpCount}</span>
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <div className="flex bg-slate-100/70 p-1 rounded-xl self-start border border-slate-100 dark:border-slate-700 dark:bg-slate-800/50">
            {(["all","intake","follow_up"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab === "all" ? "All Programs" : tab === "intake" ? "Intake Programs" : "Follow-up Programs"}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input placeholder="Search programs..." value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 rounded-lg border-slate-200 bg-white pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-[#151924] dark:text-slate-100 dark:placeholder:text-slate-500" />
            </div>
            <Button type="button" variant="outline" onClick={() => setSortBy("alpha")} className={sortButtonClassName(sortBy === "alpha")}>
              <ArrowDownAZ className="h-4 w-4" /> Sort A-Z
            </Button>
            <Button type="button" variant="outline" onClick={() => setSortBy("recent")} className={sortButtonClassName(sortBy === "recent")}>
              <Clock3 className="h-4 w-4" /> Recently updated
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"
                  className={`h-10 rounded-lg px-4 text-xs font-semibold shadow-sm ${
                    hasActiveFilters
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#151924] dark:text-slate-300 dark:hover:bg-[#1b2030]"
                  }`}
                >
                  <Filter className="mr-1.5 h-4 w-4" /> Filters
                  {hasActiveFilters && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">{activeFilterCount}</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3">
                <div className="mb-2">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 px-1">STATUS</div>
                  <div className="space-y-0.5">
                    {([{value:"all",label:"All Statuses"},{value:"published",label:"Published"},{value:"draft",label:"Draft"}] as const).map((opt) => (
                      <button key={opt.value} onClick={() => setSelectedStatus(opt.value)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                          selectedStatus === opt.value
                            ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedStatus === opt.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-slate-100 my-2 dark:bg-slate-700" />
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 px-1">TREATMENT TYPE</div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    <button onClick={() => setSelectedTreatment("all")}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                        selectedTreatment === "all"
                          ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>All Treatment Types</span>
                      {selectedTreatment === "all" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                    {treatmentTypes.map((tt) => (
                      <button key={tt.key} onClick={() => setSelectedTreatment(tt.key)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                          selectedTreatment === tt.key
                            ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300"
                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{tt.name}</span>
                        {selectedTreatment === tt.key && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
                {hasActiveFilters && (
                  <>
                    <div className="h-px bg-slate-100 my-2 dark:bg-slate-700" />
                    <div className="flex justify-end">
                      <button onClick={() => { setSelectedStatus("all"); setSelectedTreatment("all"); }}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer dark:text-blue-400 dark:hover:text-blue-300">Reset Filters</button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="outline" onClick={() => setViewMode((current) => (current === "card" ? "list" : "card"))}
              className="h-10 rounded-lg border-[#5b4dff] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-[#151924] dark:text-slate-300 dark:hover:bg-[#1b2030]">
              {viewMode === "card" ? "List view" : "Card view"}
            </Button>
          </div>
        </section>

        {viewMode === "list" ? (
          filteredPrograms.length === 0 ? (
            <EmptyStateCard title="No programs found" description="No program rows match your search." />
          ) : (
            <ProgramListTable programs={filteredPrograms}
              treatmentNameByKey={Object.fromEntries(treatmentNameByKey)}
              onEditSlug={(p) => setEditingProgram(p)}
              onPreviewProgram={handleOpenPreview}
              onStatusChange={handleProgramStatusChange}
              onCopyUrl={handleCopyProgramUrl} />
          )
        ) : filteredPrograms.length === 0 ? (
          <EmptyStateCard title="No programs found" description="No programs match your search." />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredPrograms.map((program) => (
              <ProgramCard key={program.id} program={program}
                treatmentName={treatmentNameByKey.get(program.treatmentTypeKey)}
                screeningQuestionCount={program.questionCount || 0}
                onSaveSlug={handleSaveSlug} onPreview={handleOpenPreview}
                onToggleStatus={handleProgramStatusChange} />
            ))}
          </div>
        )}
      </div>

      <SlugEditorModal open={Boolean(editingProgram)} onOpenChange={(open) => { if (!open) setEditingProgram(null); }}
        title="Edit Slug"
        description={
          <>
            Set a unique URL slug for this treatment. Use lowercase letters, numbers, and hyphens only.
          </>
        }
        previewUrlPrefix={`${questionnaireBaseUrl}/visit/`}
        currentSlug={editingProgram?.slug ?? ""}
        onSave={async (slug) => {
          if (!editingProgram) return;
          await handleSaveSlug(editingProgram.id, normalizeTreatmentSlug(slug || editingProgram.slug));
        }}
        allowEmpty={false}
      />

      {previewProgram ? (
        <QuestionnairePreviewDialog open={Boolean(previewProgram)} onOpenChange={handlePreviewOpenChange}
          previewContext={{ type: "program", id: previewProgram.id, slug: previewProgram.slug, visitType: previewProgram.visitType, templateId: previewProgram.sourceQuestionnaireTemplateId, apiBaseUrl: getQuestionnairePreviewApiBaseUrl(), clientId: brandSettings?.clientId, clientName: brandSettings?.clientName }}
          subtitle={`${previewProgram.name} · how patients see this ${previewProgram.stage === "follow_up" ? "follow-up" : "intake"}`}
          iframeTitle={`${previewProgram.name} questionnaire preview`} />
      ) : null}
    </div>
  );
}
