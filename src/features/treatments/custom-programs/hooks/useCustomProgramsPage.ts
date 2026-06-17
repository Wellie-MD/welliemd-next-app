import { useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { createMockId, currentDateStamp } from "@/features/treatments/common/data/factories";
import type { CustomProgram } from "@/features/treatments/types";
import type { QuestionnairePreviewContext } from "@/features/treatments/utils/previewUrl";
import { useCustomPrograms, useDeleteCustomProgram, useSaveCustomProgram } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import type { CustomProgramFormData } from "@/features/treatments/custom-programs/components/CustomProgramModal";

export type CustomProgramsViewMode = "card" | "list";
export type CustomProgramsFilter = "all" | "multi" | "single";
export type CatalogTab = "medicine" | "checkout" | "labs" | "supplies" | "hub";

export function isCustomProgramMulti(program: CustomProgram) {
  return program.isMulti === true || program.includedProgramIds.length > 1 || Boolean(program.tags?.includes("Multi-treatment"));
}

function buildNewCustomProgram(data: CustomProgramFormData): CustomProgram {
  return {
    id: createMockId("custom"),
    name: data.name,
    slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: data.description,
    status: "draft",
    audience: data.audience,
    minAge: data.minAge,
    maxAge: data.maxAge,
    includedProgramIds: [],
    sectionIds: [],
    consentIds: [],
    checkoutOptions: [],
    visitType: null,
    onboardingName: data.name,
    questionCount: 0,
    icon: "sparkles",
    iconBg: "#fdf2f8",
    iconColor: "#be185d",
    tags: ["Multi-treatment"],
    isMulti: true,
    flowItems: [
      {
        id: "auth-1",
        kind: "authentication",
        title: "Authentication",
        subtitle: "Verify identity, phone number, and account details.",
        locked: true,
      },
      {
        id: "checkout-1",
        kind: "checkout",
        title: "Checkout",
        subtitle: "Review products, choose subscription terms, complete checkout.",
        locked: true,
      },
    ],
    updatedAt: currentDateStamp(),
  };
}

export function useCustomProgramsPage() {
  const { data: customPrograms = [] } = useCustomPrograms();
  const { mutate: saveCustomProgram } = useSaveCustomProgram();
  const { mutate: deleteCustomProgram } = useDeleteCustomProgram();

  const [viewMode, setViewMode] = useState<CustomProgramsViewMode>("card");
  const [filter, setFilter] = useState<CustomProgramsFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<CustomProgram | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContext, setPreviewContext] = useState<QuestionnairePreviewContext | null>(null);
  const [deleteCustomProgramId, setDeleteCustomProgramId] = useState<string | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogProgram, setCatalogProgram] = useState<CustomProgram | null>(null);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("medicine");

  const multiCount = useMemo(() => customPrograms.filter(isCustomProgramMulti).length, [customPrograms]);
  const singleCount = useMemo(() => customPrograms.filter((program) => !isCustomProgramMulti(program)).length, [customPrograms]);

  const filteredPrograms = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return customPrograms.filter((program) => {
      if (filter === "multi" && !isCustomProgramMulti(program)) return false;
      if (filter === "single" && isCustomProgramMulti(program)) return false;
      if (!query) return true;
      return (
        program.name.toLowerCase().includes(query) ||
        program.description.toLowerCase().includes(query) ||
        program.onboardingName?.toLowerCase().includes(query) ||
        program.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [customPrograms, filter, searchQuery]);

  const groupedPrograms = useMemo(() => {
    return filteredPrograms.reduce(
      (groups, program) => {
        if (isCustomProgramMulti(program)) groups.multi.push(program);
        else groups.single.push(program);
        return groups;
      },
      { multi: [] as CustomProgram[], single: [] as CustomProgram[] }
    );
  }, [filteredPrograms]);

  const handlePreview = (program: CustomProgram) => {
    setPreviewContext({ mode: "custom_program", id: program.id, slug: program.slug, title: program.name });
    setIsPreviewOpen(true);
  };

  const handleViewCatalog = (program: CustomProgram, tab: CatalogTab) => {
    setCatalogProgram(program);
    setCatalogTab(tab);
    setIsCatalogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProgram(null);
    setIsModalOpen(true);
  };

  const handleEdit = (program: CustomProgram) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleCreateOrEditSubmit = (data: CustomProgramFormData) => {
    const payload = selectedProgram ? { ...selectedProgram, ...data } : buildNewCustomProgram(data);
    saveCustomProgram(payload, {
      onSuccess: () => {
        toast({
          title: selectedProgram ? "Program Updated" : "Program Created",
          description: `Successfully ${selectedProgram ? "updated" : "created"} ${data.name}.`,
        });
        setIsModalOpen(false);
        setSelectedProgram(null);
      },
    });
  };

  const confirmDeleteCustomProgram = () => {
    if (!deleteCustomProgramId) return;
    deleteCustomProgram(deleteCustomProgramId, {
      onSuccess: () => {
        toast({ title: "Program Deleted", description: "Custom program was successfully deleted." });
        setDeleteCustomProgramId(null);
      },
    });
  };

  const handleClearFilters = () => {
    setFilter("all");
    setSearchQuery("");
  };

  return {
    customPrograms,
    filteredPrograms,
    groupedPrograms,
    multiCount,
    singleCount,
    viewMode,
    setViewMode,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    selectedProgram,
    previewContext,
    isPreviewOpen,
    setIsPreviewOpen,
    deleteCustomProgramId,
    setDeleteCustomProgramId,
    isCatalogOpen,
    setIsCatalogOpen,
    catalogProgram,
    catalogTab,
    setCatalogTab,
    handlePreview,
    handleViewCatalog,
    handleCreate,
    handleEdit,
    handleCreateOrEditSubmit,
    handleDelete: setDeleteCustomProgramId,
    confirmDeleteCustomProgram,
    handleClearFilters,
  };
}
