import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDialog, TreatmentPageHeader } from "@/features/treatments/common/components";
import { TreatmentTypeTable } from "@/features/treatments/libraries/treatment-types/components/TreatmentTypeTable";
import {
  usePrograms,
  useTreatmentTypes,
  useDeleteTreatmentType,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { TreatmentTypeModal } from "@/features/treatments/libraries/treatment-types/components/TreatmentTypeModal";
import { exportToCSV } from "@/utils/exportUtils";
import { toast } from "@/components/ui/use-toast";

export default function TreatmentTypesPage() {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { data: programs = [] } = usePrograms();
  const { mutate: deleteTreatmentType } = useDeleteTreatmentType();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [deleteTreatmentTypeKey, setDeleteTreatmentTypeKey] = useState<string | null>(null);

  const filteredTypes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return treatmentTypes;
    return treatmentTypes.filter((type) =>
      [type.name, type.key, type.intakeVisitType, type.followupVisitType, type.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [treatmentTypes, searchQuery]);

  const handleCreate = () => {
    setSelectedKey(null);
    setIsModalOpen(true);
  };

  const handleEdit = (key: string) => {
    setSelectedKey(key);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    if (filteredTypes.length === 0) return;
    exportToCSV(
      filteredTypes.map((type) => ({
        name: type.name,
        id: type.key,
        intake: type.intakeVisitType,
        followup: type.followupVisitType ?? "No follow-up",
        usedIn: programs
          .filter((program) => program.treatmentTypeKey === type.key)
          .map((program) => program.name)
          .join(" | "),
      })),
      [
        { key: "name", label: "Name" },
        { key: "id", label: "ID" },
        { key: "intake", label: "Intake Visit Type" },
        { key: "followup", label: "Follow-up Visit Type" },
        { key: "usedIn", label: "Used In" },
      ],
      "treatment_types"
    );
    toast({
      title: "Export started",
      description: `Exporting ${filteredTypes.length} treatment type${filteredTypes.length === 1 ? "" : "s"} to CSV.`,
    });
  };

  const confirmDeleteTreatmentType = () => {
    if (!deleteTreatmentTypeKey) return;
    deleteTreatmentType(deleteTreatmentTypeKey, {
      onSuccess: () => {
        toast({
          title: "Treatment Type Deleted",
          description: "Treatment type has been successfully deleted.",
        });
        setDeleteTreatmentTypeKey(null);
      },
    });
  };

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Treatment Types"
        subtitle="The catalog of treatments your clinic offers. Each row is a specific treatment with its intake and follow-up visit-type identifiers. Multiple treatment types can share the same visit-type identifiers (e.g. Branded GLP and Compounded GLP both route under weightloss)."
        actions={
          <Button onClick={handleCreate} data-testid="create-treatment-type">
            <Plus className="mr-2 h-4 w-4" />
            Create Treatment Type
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search treatment types"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search treatment types"
            data-testid="treatment-types-search"
          />
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filteredTypes.length === 0}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="treatment-types-export"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      <TreatmentTypeTable
        treatmentTypes={filteredTypes}
        allTreatmentTypes={treatmentTypes}
        programs={programs}
        onEdit={handleEdit}
        onDelete={setDeleteTreatmentTypeKey}
      />

      <TreatmentTypeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        treatmentTypeKey={selectedKey}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteTreatmentTypeKey)}
        onOpenChange={(open) => {
          if (!open) setDeleteTreatmentTypeKey(null);
        }}
        title="Delete treatment type?"
        description="This can affect linked programs, products, and Beluga routing configuration."
        onConfirm={confirmDeleteTreatmentType}
      />
    </div>
  );
}
