import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ArrowDownAZ,
  Clock,
  List as ListIcon,
  LayoutGrid,
  Users,
  History,
  Filter,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { TreatmentPageHeader } from "@/features/treatments/common/components";
import { ProgramCard } from "@/features/treatments/programs/components/ProgramCard";
import { ProgramListTable } from "@/features/treatments/programs/components/ProgramListTable";
import {
  useArchiveProgram,
  useConsents,
  useDuplicateProgram,
  usePrograms,
  useSaveProgram,
  useUpdateProgramSlug,
  useTreatmentTypes,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { createMockId, currentDateStamp } from "@/features/treatments/common/data/factories";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import type { Program, ProgramStage, TreatmentType } from "@/features/treatments/types";
import { CreateProgramModal } from "@/features/treatments/programs/components/CreateProgramModal";
import { PatientFlowTestModal } from "@/features/treatments/flow-builder/components/modals/PatientFlowTestModal";
import type { PreviewContext } from "@/features/treatments/types";
import { AssignToClientsModal } from "@/components/shared/AssignToClientsModal";
import { programAssignmentApi } from "@/api/programAssignmentApi";
import { useClients } from "@/hooks/useClients";

type ProgramsViewMode = "cards" | "list";
type TabFilter = "all" | "intake" | "follow_up";

type ApiErrorData = {
  detail?: string;
  error?: string;
  message?: string;
  blockers?: Array<{ message?: string }>;
};

type ApiErrorLike = {
  response?: {
    data?: ApiErrorData;
  };
  message?: string;
};

const getApiErrorData = (error: unknown) => (error as ApiErrorLike).response?.data;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorLike;
  return apiError.response?.data?.error || apiError.response?.data?.detail || apiError.response?.data?.message || apiError.message || fallback;
};

export default function ProgramsPage() {
  const navigate = useNavigate();
  const { data: programs = [] } = usePrograms();
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { data: allConsents = [] } = useConsents();
  const { clients } = useClients("");
  const saveProgramMutation = useSaveProgram();
  const duplicateProgramMutation = useDuplicateProgram();
  const archiveProgramMutation = useArchiveProgram();
  const updateProgramSlugMutation = useUpdateProgramSlug();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "recent">("recent");
  const [viewMode, setViewMode] = useState<ProgramsViewMode>("cards");

  // Tab filter (reference layout)
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  // Filter dropdown state (reference layout)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "draft" | "published">("all");
  const [selectedTreatment, setSelectedTreatment] = useState<string>("all");

  // Create Program Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [prefillTreatmentTypeKey, setPrefillTreatmentTypeKey] = useState<string | undefined>(undefined);
  const [prefillStage, setPrefillStage] = useState<ProgramStage | undefined>(undefined);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [previewContext, setPreviewContext] = useState<PreviewContext | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [duplicatingProgramId, setDuplicatingProgramId] = useState<string | null>(null);
  const [archivingProgramId, setArchivingProgramId] = useState<string | null>(null);
  const activePrograms = useMemo(
    () => programs.filter((program) => program.status !== "archived"),
    [programs]
  );

  // Assign to Clients state
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Build treatment type lookup map
  const treatmentTypeMap = useMemo(() => {
    const map = new Map<string, TreatmentType>();
    for (const tt of treatmentTypes) {
      map.set(tt.key, tt);
    }
    return map;
  }, [treatmentTypes]);

  // Compute consent count per program based on scope + visit type
  const consentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    const activeConsents = allConsents.filter(c => !c.isArchived);
    const globalCount = activeConsents.filter(c => c.scope === "global" || c.scope === "shared").length;

    for (const program of activePrograms) {
      const treatmentSpecific = activeConsents.filter(
        c => c.scope === "treatment" && c.visitTypeKeys.includes(program.visitType)
      ).length;
      map.set(program.id, globalCount + treatmentSpecific);
    }

    return map;
  }, [allConsents, activePrograms]);

  // Usage counts per program (from backend fields)
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const program of activePrograms) {
      map.set(program.id, program.assignedClientsCount ?? 0);
    }
    return map;
  }, [activePrograms]);

  // Metrics calculation
  const totalTreatments = treatmentTypes.length;
  const missingFollowUp = useMemo(() => {
    return treatmentTypes.filter(t => !activePrograms.some(p => p.treatmentTypeKey === t.key && p.stage === "follow_up")).length;
  }, [treatmentTypes, activePrograms]);

  // Handlers for mocked functional rules
  const handleAddFollowUp = (treatmentKey: string) => {
    setPrefillTreatmentTypeKey(treatmentKey);
    setPrefillStage("follow_up");
    setIsCreateOpen(true);
  };

  const handleAddIntake = (treatmentKey: string) => {
    setPrefillTreatmentTypeKey(treatmentKey);
    setPrefillStage("intake");
    setIsCreateOpen(true);
  };

  const handleSaveProgram = (programData: Omit<Program, "id" | "questionCount" | "checkoutQuestionCount" | "status" | "updatedAt">) => {
    if (editingProgram) {
      const updatedProgram: Program = {
        ...editingProgram,
        ...programData,
        updatedAt: currentDateStamp(),
      };

      saveProgramMutation.mutate(updatedProgram, {
        onSuccess: () => {
          toast({
            title: "Program Updated",
            description: `Saved changes to ${programData.name}`,
          });
          setEditingProgram(null);
          setIsCreateOpen(false);
        },
        onError: (error: unknown) => {
          if (isDuplicateSlugError(error)) {
            showDuplicateSlugToast();
            return;
          }

          toast({
            title: "Error",
            description: getApiErrorMessage(error, "Failed to update program"),
            variant: "destructive",
          });
        },
      });
      return;
    }

    const newProg: Program = {
      id: createMockId("program"),
      questionCount: 0,
      checkoutQuestionCount: 0,
      status: "draft",
      updatedAt: currentDateStamp(),
      authConfig: {
        email: true,
        phone: false,
        identity: false,
        account: true,
      },
      checkoutQuestions: [],
      consentIds: [],
      ...programData,
    };

    saveProgramMutation.mutate(newProg, {
      onSuccess: () => {
        toast({
          title: "Program Created",
          description: `Successfully created program: ${programData.name}`,
        });
      },
      onError: (error: unknown) => {
        if (isDuplicateSlugError(error)) {
          showDuplicateSlugToast();
          return;
        }

        toast({
          title: "Error",
          description: getApiErrorMessage(error, "Failed to create program"),
          variant: "destructive",
        });
      },
    });
  };

  const handleSaveSlug = async (programId: string, newSlug: string) => {
    try {
      await updateProgramSlugMutation.mutateAsync({ programId, slug: newSlug });
      toast({
        title: "Slug Updated",
        description: `Program slug updated to: ${newSlug}`,
      });
    } catch (error) {
      if (isDuplicateSlugError(error)) {
        showDuplicateSlugToast();
        return;
      }

      toast({
        title: "Error Updating Slug",
        description: getApiErrorMessage(error, "Slug could not be updated"),
        variant: "destructive",
      });
    }
  };

  const openCreateProgram = () => {
    setEditingProgram(null);
    setPrefillTreatmentTypeKey(undefined);
    setPrefillStage(undefined);
    setIsCreateOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setPrefillTreatmentTypeKey(undefined);
    setPrefillStage(undefined);
    setIsCreateOpen(true);
  };

  const handlePreviewProgram = (program: Program) => {
    setPreviewContext({
      type: "program",
      id: program.id,
      slug: program.slug,
      visitType: program.visitType,
      templateId: program.sourceQuestionnaireTemplateId,
    });
    setIsPreviewOpen(true);
  };

  const handleDuplicateProgram = (program: Program) => {
    setDuplicatingProgramId(program.id);
    duplicateProgramMutation.mutate(program.id, {
      onSuccess: (duplicated) => {
        toast({
          title: "Program Duplicated",
          description: `Created ${duplicated.name}`,
        });
      },
      onError: (error: unknown) => {
        toast({
          title: "Error",
          description: getApiErrorMessage(error, "Failed to duplicate program"),
          variant: "destructive",
        });
      },
      onSettled: () => setDuplicatingProgramId(null),
    });
  };

  const handleArchiveProgram = (program: Program) => {
    if (program.status === "archived") return;
    const confirmed = window.confirm(`Archive "${program.name}"?`);
    if (!confirmed) return;

    setArchivingProgramId(program.id);
    archiveProgramMutation.mutate(program.id, {
      onSuccess: () => {
        toast({
          title: "Program Archived",
          description: `${program.name} has been archived.`,
        });
      },
      onError: (error: unknown) => {
        const responseData = getApiErrorData(error);
        const blockerMessage = Array.isArray(responseData?.blockers)
          ? responseData.blockers.map((blocker: { message?: string }) => blocker.message).filter(Boolean).join(" ")
          : "";
        toast({
          title: "Error",
          description:
            blockerMessage ||
            responseData?.detail ||
            responseData?.error ||
            (error as ApiErrorLike).message ||
            "Failed to archive program",
          variant: "destructive",
        });
      },
      onSettled: () => setArchivingProgramId(null),
    });
  };

  // Filtered & sorted programs for program-level card view
  const filteredPrograms = useMemo(() => {
    let result = [...activePrograms];

    if (activeTab === "intake") {
      result = result.filter(p => p.stage === "intake");
    } else if (activeTab === "follow_up") {
      result = result.filter(p => p.stage === "follow_up");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.treatmentTypeKey.toLowerCase().includes(q)
      );
    }

    if (selectedStatus !== "all") {
      result = result.filter(p => p.status === selectedStatus);
    }

    if (selectedTreatment !== "all") {
      result = result.filter(p => p.treatmentTypeKey === selectedTreatment);
    }

    if (sortBy === "alpha") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    return result;
  }, [activePrograms, activeTab, searchQuery, selectedStatus, selectedTreatment, sortBy]);

  // Derived filtered & sorted data for list view
  const processedTreatments = useMemo(() => {
    let result = [...treatmentTypes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.key.toLowerCase().includes(q)
      );
    }

    if (sortBy === "alpha") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => {
        const aProgs = activePrograms.filter(p => p.treatmentTypeKey === a.key);
        const bProgs = activePrograms.filter(p => p.treatmentTypeKey === b.key);
        const aMax = aProgs.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, "");
        const bMax = bProgs.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, "");
        return bMax.localeCompare(aMax);
      });
    }

    return result;
  }, [treatmentTypes, activePrograms, searchQuery, sortBy]);

  // Flat program list for the list view (search-filtered, sorted)
  const listViewPrograms = useMemo(() => {
    let result = [...activePrograms];

    if (activeTab === "intake") {
      result = result.filter(p => p.stage === "intake");
    } else if (activeTab === "follow_up") {
      result = result.filter(p => p.stage === "follow_up");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.treatmentTypeKey.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (selectedStatus !== "all") {
      result = result.filter(p => p.status === selectedStatus);
    }

    if (selectedTreatment !== "all") {
      result = result.filter(p => p.treatmentTypeKey === selectedTreatment);
    }

    if (sortBy === "alpha") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    return result;
  }, [activePrograms, activeTab, searchQuery, selectedStatus, selectedTreatment, sortBy]);

  const assignItems = useMemo(() => {
    return programs.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.treatmentTypeKey || undefined,
    }));
  }, [programs]);

  const handleAssignPrograms = async (selectedProgramIds: string[], clientIds: string[]) => {
    const res = await programAssignmentApi.bulkAssignPrograms({
      program_ids: selectedProgramIds,
      client_ids: clientIds,
    });

    const alreadyAssignedPairs = res.results.filter((r) => r.success && r.already_assigned);
    for (const pair of alreadyAssignedPairs) {
      const programName = programs.find((p) => p.id === pair.program_id)?.name || "This program";
      const clientName = clients.find((c) => c.id === pair.client_id)?.name || "this client";
      toast({
        title: "Already Assigned",
        description: `${programName} is already assigned to ${clientName}.`,
      });
    }

    toast({
      title: res.failure_count === 0 ? "Assignment Complete" : "Assignment Partially Complete",
      description: res.message,
      variant: res.failure_count > 0 ? "destructive" : "default",
    });
    return res;
  };

  const hasActiveFilters = selectedStatus !== "all" || selectedTreatment !== "all";
  const activeFilterCount = (selectedStatus !== "all" ? 1 : 0) + (selectedTreatment !== "all" ? 1 : 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <TreatmentPageHeader
        title="Programs"
        subtitle="Clinical questionnaires linked to specific treatments. Each treatment has an intake module and (optionally) a follow-up module."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/treatments/programs/assignment-history")}
              className="h-9 px-4 text-xs font-semibold rounded-lg shadow-sm"
            >
              <History className="mr-1.5 h-4 w-4" />
              Assignment History
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAssignOpen(true)}
              disabled={filteredPrograms.length === 0}
              className="h-9 px-4 text-xs font-semibold rounded-lg shadow-sm"
              data-testid="assign-programs-client"
            >
              <Users className="mr-1.5 h-4 w-4" />
              Assign to Clients
            </Button>
            <Button
              onClick={() => {
                setPrefillTreatmentTypeKey(undefined);
                setPrefillStage(undefined);
                setIsCreateOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs rounded-lg shadow-sm"
            >
              <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" />
              Create Program
            </Button>
          </div>
        }
      />

      {/* Metric Cards Row (existing content kept) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            TOTAL TREATMENTS
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {totalTreatments}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-center relative">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              MISSING FOLLOW-UP
            </span>
          </div>
          <span className="text-2xl font-bold text-slate-900">
            {missingFollowUp}
          </span>
        </div>
      </div>

      {/* Tab Bar (matching reference layout) */}
      <div className="flex bg-slate-100/70 p-1 rounded-xl self-start mb-4 border border-slate-100">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All Programs
        </button>
        <button
          onClick={() => setActiveTab("intake")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "intake"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Intake Programs
        </button>
        <button
          onClick={() => setActiveTab("follow_up")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "follow_up"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Follow-up Programs
        </button>
      </div>

      {/* Filter Toolbar Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[260px] h-9 text-xs bg-white border-slate-200 rounded-lg shadow-sm"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setSortBy("alpha")}
            className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${
              sortBy === "alpha"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowDownAZ className="mr-1.5 h-4 w-4" />
            Sort A&rarr;Z
          </Button>

          <Button
            variant="outline"
            onClick={() => setSortBy("recent")}
            className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${
              sortBy === "recent"
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Clock className="mr-1.5 h-4 w-4" />
            Recently updated
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters Dropdown (matching reference layout) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${
                  hasActiveFilters
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Filter className="mr-1.5 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3">
              <div className="mb-2">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 px-1">
                  STATUS
                </div>
                <div className="space-y-0.5">
                  {[
                    { value: "all" as const, label: "All Statuses" },
                    { value: "published" as const, label: "Published" },
                    { value: "draft" as const, label: "Draft" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedStatus(opt.value)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                        selectedStatus === opt.value
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedStatus === opt.value && (
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 px-1">
                  TREATMENT TYPE
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedTreatment("all")}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                      selectedTreatment === "all"
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Treatment Types</span>
                    {selectedTreatment === "all" && (
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </button>
                  {treatmentTypes.map((tt) => (
                    <button
                      key={tt.key}
                      onClick={() => setSelectedTreatment(tt.key)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                        selectedTreatment === tt.key
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{tt.name}</span>
                      {selectedTreatment === tt.key && (
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <>
                  <div className="h-px bg-slate-100 my-2" />
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedStatus("all");
                        setSelectedTreatment("all");
                      }}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => setViewMode((mode) => (mode === "cards" ? "list" : "cards"))}
            className="h-9 px-3 text-xs font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"
            data-testid="programs-view-toggle"
            aria-pressed={viewMode === "list"}
          >
            {viewMode === "cards" ? (
              <>
                <ListIcon className="mr-1.5 h-4 w-4" />
                List view
              </>
            ) : (
              <>
                <LayoutGrid className="mr-1.5 h-4 w-4" />
                Card view
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content: Card view or List view */}
      {viewMode === "list" ? (
        listViewPrograms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">No programs found matching your criteria.</p>
          </div>
        ) : (
          <ProgramListTable
            programs={listViewPrograms}
            onEdit={handleEditProgram}
            onPreview={handlePreviewProgram}
            onDuplicate={handleDuplicateProgram}
            onArchive={handleArchiveProgram}
            duplicatingProgramId={duplicatingProgramId}
            archivingProgramId={archivingProgramId}
          />
        )
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">No programs found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              treatmentType={treatmentTypeMap.get(program.treatmentTypeKey)}
              consentCount={consentCountMap.get(program.id) ?? 0}
              assignedClientsCount={usageMap.get(program.id) ?? 0}
              onSaveSlug={handleSaveSlug}
              onPreview={handlePreviewProgram}
              onEdit={handleEditProgram}
              onDuplicate={handleDuplicateProgram}
              onArchive={handleArchiveProgram}
              duplicatingProgramId={duplicatingProgramId}
              archivingProgramId={archivingProgramId}
            />
          ))}
        </div>
      )}

      {/* CREATE PROGRAM DIALOG */}
      <CreateProgramModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingProgram(null);
          }
        }}
        treatmentTypes={treatmentTypes}
        onSave={handleSaveProgram}
        prefillTreatmentTypeKey={prefillTreatmentTypeKey}
        prefillStage={prefillStage}
        initialProgram={editingProgram}
        mode={editingProgram ? "edit" : "create"}
      />

      {previewContext && (
        <PatientFlowTestModal
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          previewContext={previewContext}
        />
      )}
      {/* ASSIGN TO CLIENTS MODAL */}
      <AssignToClientsModal
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        items={assignItems}
        itemLabel="program"
        subtitle="Pick programs and the client brands that can offer them to their patients."
        onAssign={handleAssignPrograms}
      />
    </div>
  );
}
