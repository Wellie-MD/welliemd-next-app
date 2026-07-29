import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const saveProgramMutation = useSaveProgram();
  const duplicateProgramMutation = useDuplicateProgram();
  const archiveProgramMutation = useArchiveProgram();
  const updateProgramSlugMutation = useUpdateProgramSlug();
  const updateProgramStatusMutation = useUpdateProgramStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "recent">("recent");
  const [viewMode, setViewMode] = useState<ProgramsViewMode>("cards");

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
    const globalCount = activeConsents.filter(c => c.scope === "global").length;

    for (const program of activePrograms) {
      const treatmentSpecific = activeConsents.filter(
        c => c.scope === "visit_type" && c.visitTypeKeys.includes(program.visitType)
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

  const handleSaveProgram = async (
    programData: Omit<Program, "id" | "questionCount" | "checkoutQuestionCount" | "status" | "updatedAt">
  ): Promise<boolean> => {
    if (editingProgram) {
      const updatedProgram = {
        id: editingProgram.id,
        ...programData,
      };

      try {
        await saveProgramMutation.mutateAsync(updatedProgram);
        toast({
          title: "Program Updated",
          description: `Saved changes to ${programData.name}`,
        });
        setEditingProgram(null);
        setIsCreateOpen(false);
        return true;
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
      await saveProgramMutation.mutateAsync(newProg);
      toast({
        title: "Program Created",
        description: `Successfully created program: ${programData.name}`,
      });
      setIsCreateOpen(false);
      return true;
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
    return activePrograms.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.treatmentTypeKey || undefined,
    }));
  }, [activePrograms]);

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
              onToggleStatus={handleToggleStatus}
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
      />
    </div>
  );
}
