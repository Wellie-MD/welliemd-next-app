import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog, TreatmentPageHeader } from "@/features/treatments/common/components";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { SectionFieldsView } from "@/features/treatments/libraries/sections/components/SectionFieldsView";
import { SectionListTable } from "@/features/treatments/libraries/sections/components/SectionListTable";
import { SectionModal } from "@/features/treatments/libraries/sections/components/SectionModal";
import {
  SectionToolbar,
  type SectionScopeFilter,
} from "@/features/treatments/libraries/sections/components/SectionToolbar";
import { useSections, useDeleteSection } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { CommonSection } from "@/features/treatments/types";
import { formatScope } from "@/features/treatments/utils/labels";

export default function SectionsPage() {
  const { data: sections = [] } = useSections();
  const { mutate: deleteSection } = useDeleteSection();

  const [searchParams, setSearchParams] = useSearchParams();
  const sectionIdFromUrl = searchParams.get("sectionId");

  const [scopeFilter, setScopeFilter] = useState<SectionScopeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSection, setEditingSection] = useState<CommonSection | null>(null);
  const [previewSection, setPreviewSection] = useState<CommonSection | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openSection = useMemo(() => {
    if (!sectionIdFromUrl) return null;
    return sections.find(s => s.id === sectionIdFromUrl) || null;
  }, [sectionIdFromUrl, sections]);

  const setOpenSection = (section: CommonSection | null) => {
    if (section) {
      searchParams.set("sectionId", section.id);
      if (!searchParams.has("view")) {
        searchParams.set("view", "list");
      }
    } else {
      searchParams.delete("sectionId");
      searchParams.delete("view");
    }
    setSearchParams(searchParams);
  };

  const filteredSections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sections.filter((section) => {
      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "global" && section.scope === "global") ||
        (scopeFilter === "visit_type" && section.scope === "visit_type");

      const visitTypeText = section.visitTypeKeys.join(" ");
      const matchesSearch =
        !normalizedQuery ||
        section.name.toLowerCase().includes(normalizedQuery) ||
        formatScope(section.scope).toLowerCase().includes(normalizedQuery) ||
        visitTypeText.toLowerCase().includes(normalizedQuery);

      return matchesScope && matchesSearch;
    });
  }, [scopeFilter, searchQuery, sections]);

  const handleCreate = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleEdit = (section: CommonSection) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setScopeFilter("all");
    setSearchQuery("");
  };

  const handleExport = () => {
    const csvRows = [
      ["Name", "Scope", "Visit Type", "Fields", "Last Updated"],
      ...filteredSections.map((section) => [
        section.name,
        formatScope(section.scope),
        section.visitTypeKeys.length > 0 ? section.visitTypeKeys.join(", ") : "All",
        String(section.fieldCount),
        section.updatedAt,
      ]),
    ];

    const csv = csvRows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "common-sections.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const confirmDeleteSection = () => {
    if (!deleteSectionId) return;

    deleteSection(deleteSectionId, {
      onSuccess: () => {
        toast({
          title: "Section Deleted",
          description: "Section has been successfully deleted.",
        });
        setDeleteSectionId(null);
      },
      onError: () => {
        toast({
          title: "Delete Failed",
          description: "The section could not be deleted.",
          variant: "destructive",
        });
      },
    });
  };

  if (openSection) {
    return (
      <div className="p-6">
        <SectionFieldsView section={openSection} onBack={() => setOpenSection(null)} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Common Sections"
        subtitle="Reusable patient data sections referenced across custom forms."
        actions={
          <Button
            type="button"
            onClick={handleCreate}
            data-testid="sections-create-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Section
          </Button>
        }
      />

      <SectionToolbar
        scopeFilter={scopeFilter}
        searchQuery={searchQuery}
        onScopeFilterChange={setScopeFilter}
        onSearchQueryChange={setSearchQuery}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
      />

      <SectionListTable
        sections={filteredSections}
        onOpen={setOpenSection}
        onPreview={setPreviewSection}
        onEdit={handleEdit}
        onDelete={setDeleteSectionId}
      />

      {filteredSections.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          No common sections match the current filters.
        </div>
      ) : null}

      <SectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        section={editingSection}
      />

      {previewSection && (
        <QuestionnairePreviewDialog
          open={Boolean(previewSection)}
          onOpenChange={(open) => {
            if (!open) setPreviewSection(null);
          }}
          previewContext={{ type: "section", id: previewSection.id, slug: previewSection.id }}
          subtitle={`Preview of reusable section "${previewSection.name}"`}
        />
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteSectionId)}
        onOpenChange={(open) => {
          if (!open) setDeleteSectionId(null);
        }}
        title="Delete section?"
        description="This removes the common section from the library. Custom programs using it may need review."
        onConfirm={confirmDeleteSection}
      />
    </div>
  );
}
