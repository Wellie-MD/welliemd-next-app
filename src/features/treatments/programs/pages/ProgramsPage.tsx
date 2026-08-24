import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { TreatmentPageHeader } from "@/features/treatments/common/components";
import { ProgramCard } from "@/features/treatments/programs/components/ProgramCard";
import { ProgramListTable } from "@/features/treatments/programs/components/ProgramListTable";
import {
  useArchiveProgram,
  useDuplicateProgram,
  usePrograms,
  useSaveProgram,
  useUpdateProgramStatus,
  useTreatmentTypes,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { createMockId, currentDateStamp } from "@/features/treatments/common/data/factories";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import type { Program, ProgramStage, ProgramStatus, TreatmentType } from "@/features/treatments/types";
import { CreateProgramModal } from "@/features/treatments/programs/components/CreateProgramModal";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import type { PreviewContext } from "@/features/treatments/types";
import { ProgramsFilters, type ProgramsViewMode, type ProgramTabFilter } from "@/features/treatments/programs/components/ProgramsFilters";
import { TreatmentAssignmentModal } from "@/features/treatments/assignment/components/TreatmentAssignmentModal";
import { ASSIGNMENT_SOURCE } from "@/features/treatments/assignment/constants";
import { countExplicitProgramConsents } from "@/features/treatments/programs/utils/programConsentPlacement";


type ApiErrorData = {
  detail?: string;
  error?: string;
  message?: string;
  blockers?: Array<{ message?: string }>;
  checkout_issues?: Array<{
    message?: string;
    action?: string;
    action_route?: string;
    context?: { product_name?: string };
  }>;
  checkout_summary?: {
    headline?: string;
    first_action_route?: string;
  };
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
  const data = apiError.response?.data;
  const checkoutMessage = data?.checkout_issues
    ?.map((issue) => issue.message)
    .filter(Boolean)
    .join(" ");
  return checkoutMessage
    || data?.checkout_summary?.headline
    || data?.error
    || data?.detail
    || data?.message
    || apiError.message
    || fallback;
};

export default function ProgramsPage() {
  const navigate = useNavigate();
  const { data: programs = [], refetch: refetchPrograms, isLoading: isProgramsLoading } = usePrograms();
  const { data: treatmentTypes = [], isLoading: isTreatmentTypesLoading } = useTreatmentTypes();
  const saveProgramMutation = useSaveProgram();
  const duplicateProgramMutation = useDuplicateProgram();
  const archiveProgramMutation = useArchiveProgram();
  const updateProgramStatusMutation = useUpdateProgramStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "recent">("recent");
  const [viewMode, setViewMode] = useState<ProgramsViewMode>("cards");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Tab filter (reference layout)
  const [activeTab, setActiveTab] = useState<ProgramTabFilter>("all");

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
  const handleAssignmentsCompleted = useCallback(() => {
    void refetchPrograms();
  }, [refetchPrograms]);

  // Build treatment type lookup map
  const treatmentTypeMap = useMemo(() => {
    const map = new Map<string, TreatmentType>();
    for (const tt of treatmentTypes) {
      map.set(tt.key, tt);
    }
    return map;
  }, [treatmentTypes]);

  // A Program contains only content explicitly attached by an author. Scope
  // validates placement compatibility; it never auto-populates the Program.
  const consentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const program of activePrograms) {
      map.set(program.id, countExplicitProgramConsents(program.consentIds));
    }
    return map;
  }, [activePrograms]);

  // Usage counts per program (from backend fields)
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const program of activePrograms) {
      map.set(program.id, program.assignedClientsCount ?? 0);
    }
    return map;
  }, [activePrograms]);

  // Metrics calculation
  const totalPrograms = activePrograms.length;
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

  const handleSaveProgram = async (
    programData: Omit<Program, "id" | "questionCount" | "checkoutQuestionCount" | "status" | "updatedAt">
  ): Promise<Program | boolean> => {
    if (editingProgram) {
      const updatedProgram: Program = {
        ...editingProgram,
        ...programData,
      };

      try {
        const saved = await saveProgramMutation.mutateAsync(updatedProgram);
        toast({
          title: "Program Updated",
          description: `Saved changes to ${programData.name}`,
        });
        setEditingProgram(null);
        setIsCreateOpen(false);
        return saved || updatedProgram;
      } catch (error) {
        if (isDuplicateSlugError(error)) {
          showDuplicateSlugToast();
        } else {
          toast({
            title: "Error",
            description: getApiErrorMessage(error, "Failed to update program"),
            variant: "destructive",
          });
        }
        return false;
      }
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

    try {
      const created = await saveProgramMutation.mutateAsync(newProg);
      toast({
        title: "Program Created",
        description: `Successfully created program: ${programData.name}`,
      });
      setIsCreateOpen(false);
      return created || newProg;
    } catch (error) {
      if (isDuplicateSlugError(error)) {
        showDuplicateSlugToast();
      } else {
        toast({
          title: "Error",
          description: getApiErrorMessage(error, "Failed to create program"),
          variant: "destructive",
        });
      }

      return false;
    }
  };

  const handleToggleStatus = async (program: Program, status: ProgramStatus) => {
    if (program.status === status) return;
    try {
      await updateProgramStatusMutation.mutateAsync({ programId: program.id, status });
      toast({
        title: status === "published" ? "Program Published" : "Program Reverted to Draft",
      });
    } catch (error) {
      toast({
        title: status === "published" ? "Unable to publish Program" : "Unable to update Program status",
        description: getApiErrorMessage(error, "The Program could not be updated."),
        variant: "destructive",
      });
    }
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
      name: program.name,
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
        const responseData = getApiErrorData(error);
        const repairRoute = responseData?.checkout_issues?.[0]?.action_route
          || responseData?.checkout_summary?.first_action_route;
        toast({
          title: "Program needs configuration",
          description: `${getApiErrorMessage(error, "Failed to duplicate program")}${
            repairRoute ? ` Open ${repairRoute} to correct it.` : ""
          }`,
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

  // Filtered & sorted programs for both card view and list view
  const missingFollowUpTreatmentKeys = useMemo(() => {
    return new Set(
      treatmentTypes
        .filter(t => !activePrograms.some(p => p.treatmentTypeKey === t.key && p.stage === "follow_up"))
        .map(t => t.key)
    );
  }, [treatmentTypes, activePrograms]);

  const filteredPrograms = useMemo(() => {
    let result = [...activePrograms];

    if (activeTab === "intake") {
      result = result.filter(p => p.stage === "intake");
    } else if (activeTab === "follow_up") {
      result = result.filter(p => p.stage === "follow_up");
    } else if (activeTab === "missing_follow_up") {
      result = result.filter(p => missingFollowUpTreatmentKeys.has(p.treatmentTypeKey));
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
  }, [activePrograms, activeTab, missingFollowUpTreatmentKeys, searchQuery, selectedStatus, selectedTreatment, sortBy]);

  const displayedPrograms = filteredPrograms;
  const totalPages = Math.max(1, Math.ceil(displayedPrograms.length / pageSize));
  const pagedPrograms = useMemo(
    () => displayedPrograms.slice((page - 1) * pageSize, page * pageSize),
    [displayedPrograms, page],
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, selectedStatus, selectedTreatment, sortBy, viewMode]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const assignItems = useMemo(() => {
    return activePrograms.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.treatmentTypeKey || undefined,
    }));
  }, [activePrograms]);

  if ((isProgramsLoading || isTreatmentTypesLoading) && programs.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading programs and page data...</p>
        </div>
      </div>
    );
  }

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
            >
              <History className="mr-2 h-4 w-4" />
              Assignment History
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAssignOpen(true)}
              disabled={filteredPrograms.length === 0}
              data-testid="assign-programs-client"
            >
              <Users className="mr-2 h-4 w-4" />
              Assign to Clients
            </Button>
            <Button
              onClick={() => {
                setPrefillTreatmentTypeKey(undefined);
                setPrefillStage(undefined);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </div>
        }
      />

      {/* Metric / Stat Summary Strip (Matching Prototype tx-summary) */}
      <div className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 mb-5 shadow-sm">
        <div
          onClick={() => {
            setActiveTab("all");
            setSelectedStatus("all");
            setSelectedTreatment("all");
          }}
          className={`flex-1 px-4 py-3.5 cursor-pointer border-b sm:border-b-0 sm:border-r border-slate-100 transition-colors hover:bg-slate-50/80 ${
            activeTab === "all" ? "bg-blue-50/70" : ""
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setActiveTab("all");
              setSelectedStatus("all");
              setSelectedTreatment("all");
            }
          }}
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            Total treatments
          </div>
          <div className={`text-2xl font-semibold leading-none ${activeTab === "all" ? "text-blue-600" : "text-slate-900"}`}>
            {totalPrograms}
          </div>
        </div>
        <div
          onClick={() => {
            setActiveTab("missing_follow_up");
            setSelectedStatus("all");
            setSelectedTreatment("all");
          }}
          className={`flex-1 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50/80 ${
            activeTab === "missing_follow_up" ? "bg-blue-50/70" : ""
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setActiveTab("missing_follow_up");
              setSelectedStatus("all");
              setSelectedTreatment("all");
            }
          }}
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300 inline-block"></span>
            Missing follow-up
          </div>
          <div className={`text-2xl font-semibold leading-none ${activeTab === "missing_follow_up" ? "text-blue-600" : "text-slate-900"}`}>
            {missingFollowUp}
          </div>
        </div>
      </div>

      <ProgramsFilters
        activeTab={activeTab}
        searchQuery={searchQuery}
        sortBy={sortBy}
        selectedStatus={selectedStatus}
        selectedTreatment={selectedTreatment}
        treatmentTypes={treatmentTypes}
        viewMode={viewMode}
        onActiveTabChange={setActiveTab}
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
        onStatusChange={setSelectedStatus}
        onTreatmentChange={setSelectedTreatment}
        onViewModeChange={setViewMode}
      />

      {activeTab === "missing_follow_up" && (
        <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-800">Filter Info:</span>
            <span>
              Showing programs for the <strong>{missingFollowUp} treatment type{missingFollowUp === 1 ? "" : "s"}</strong> that lack a Follow-up stage program.
            </span>
          </div>
        </div>
      )}

      {/* Content: Card view or List view */}
      {viewMode === "list" ? (
        displayedPrograms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">No programs found matching your criteria.</p>
          </div>
        ) : (
          <ProgramListTable
            programs={pagedPrograms}
            onEdit={handleEditProgram}
            onPreview={handlePreviewProgram}
            onDuplicate={handleDuplicateProgram}
            onArchive={handleArchiveProgram}
            onToggleStatus={handleToggleStatus}
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
          {pagedPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              treatmentType={treatmentTypeMap.get(program.treatmentTypeKey)}
              consentCount={consentCountMap.get(program.id) ?? 0}
              assignedClientsCount={usageMap.get(program.id) ?? 0}
              onPreview={handlePreviewProgram}
              onEdit={handleEditProgram}
              onDuplicate={handleDuplicateProgram}
              onArchive={handleArchiveProgram}
              onToggleStatus={handleToggleStatus}
              duplicatingProgramId={duplicatingProgramId}
              archivingProgramId={archivingProgramId}
            />
          ))}
        </div>
      )}

      {displayedPrograms.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, displayedPrograms.length)} of{" "}
            {displayedPrograms.length} programs
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="min-w-24 text-center text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
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
        <QuestionnairePreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          previewContext={previewContext}
          subtitle={`Patient view of "${previewContext.name || previewContext.slug}"`}
        />
      )}
      {/* ASSIGN TO CLIENTS MODAL */}
      <TreatmentAssignmentModal
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        items={assignItems}
        itemLabel="program"
        sourceKind={ASSIGNMENT_SOURCE.program}
        onAssignmentsCompleted={handleAssignmentsCompleted}
      />
    </div>
  );
}
