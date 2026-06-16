import { useState } from "react";
import { Plus, Users, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomProgramCard } from "../components/custom-programs/CustomProgramCard";
import { CustomProgramTable } from "../components/custom-programs/CustomProgramTable";
import { CustomProgramModal, type CustomProgramFormData } from "../components/custom-programs/CustomProgramModal";
import { EmptyStateCard, FilterToolbar, TreatmentPageHeader } from "../components/common";
import { useCustomPrograms, useSaveCustomProgram, useDeleteCustomProgram } from "../hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { CustomProgram } from "../types";

export default function CustomProgramsPage() {
  const { data: customPrograms = [] } = useCustomPrograms();
  const { mutate: saveCustomProgram } = useSaveCustomProgram();
  const { mutate: deleteCustomProgram } = useDeleteCustomProgram();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<CustomProgram | null>(null);

  const handleCreateOrEditSubmit = (data: CustomProgramFormData) => {
    if (selectedProgram) {
      // Editing
      saveCustomProgram(
        {
          ...selectedProgram,
          ...data,
        },
        {
          onSuccess: () => {
            toast({
              title: "Program Updated",
              description: `Successfully updated ${data.name}.`,
            });
            setIsModalOpen(false);
            setSelectedProgram(null);
          },
        }
      );
    } else {
      // Creating
      const newProgram: CustomProgram = {
        id: `custom-${Math.random().toString(36).substr(2, 9)}`,
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
      };

      saveCustomProgram(newProgram, {
        onSuccess: () => {
          toast({
            title: "Program Created",
            description: `Successfully created ${data.name}.`,
          });
          setIsModalOpen(false);
        },
      });
    }
  };

  const handleEdit = (program: CustomProgram) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this custom program?")) {
      deleteCustomProgram(id, {
        onSuccess: () => {
          toast({
            title: "Program Deleted",
            description: "Custom program was successfully deleted.",
          });
        },
      });
    }
  };

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Custom Programs"
        subtitle={
          <>
            Customized intake programs for clients — compose programs, sections, consents, and checkout into a tailored patient experience.
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "card"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Cards
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </button>
            </div>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Assign to Client
            </Button>
            <Button
              onClick={() => {
                setSelectedProgram(null);
                setIsModalOpen(true);
              }}
              className="bg-[#12517A] text-white hover:bg-[#12517A]/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Program
            </Button>
          </div>
        }
      />

      <FilterToolbar placeholder="Search custom forms by name or type" />

      {customPrograms.length > 0 ? (
        viewMode === "card" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customPrograms.map((customProgram) => (
              <CustomProgramCard
                key={customProgram.id}
                customProgram={customProgram}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <CustomProgramTable
            customPrograms={customPrograms}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )
      ) : (
        <EmptyStateCard
          title="No custom programs yet"
          description="Create one to compose programs, sections, consents, and checkout."
        />
      )}

      <CustomProgramModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateOrEditSubmit}
        program={selectedProgram}
      />
    </div>
  );
}
