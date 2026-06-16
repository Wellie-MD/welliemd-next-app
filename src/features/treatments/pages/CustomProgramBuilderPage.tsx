import { useState } from "react";
import { useParams } from "react-router-dom";
import { AddToFlowDrawer } from "../components/builder/AddToFlowDrawer";
import { CustomProgramFlowBuilder } from "../components/builder/CustomProgramFlowBuilder";
import { PrototypeNotice } from "../components/common";
import { toast } from "@/components/ui/use-toast";
import {
  useConsents,
  useCustomProgram,
  usePrograms,
  useSections,
  useSaveCustomProgram,
} from "../hooks/useTreatmentLibraries";
import type { CustomProgram, CustomProgramBuilderAddItem, CustomProgramFlowItem } from "../types";

export default function CustomProgramBuilderPage() {
  const { customProgramId = "custom-universal" } = useParams();
  const { data: customProgram } = useCustomProgram(customProgramId);
  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();

  const { mutate: saveCustomProgram } = useSaveCustomProgram();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!customProgram) {
    return <div className="p-6">Custom program not found.</div>;
  }

  const handleUpdateFlow = (updatedItems: CustomProgramFlowItem[]) => {
    saveCustomProgram(
      {
        ...customProgram,
        flowItems: updatedItems,
      },
      {
        onSuccess: () => {
          toast({
            title: "Flow Updated",
            description: "Intake flow sequence updated successfully.",
          });
        },
      }
    );
  };

  const handleAddItem = (item: CustomProgramBuilderAddItem) => {
    // We insert before the locked checkout item, which is usually the last item.
    const items = [...customProgram.flowItems];
    const insertIdx = items.length; // Appends at end

    const newItem: CustomProgramFlowItem = {
      id: `${item.kind}-${Math.random().toString(36).substr(2, 9)}`,
      kind: item.kind,
      title: item.title,
      subtitle: item.subtitle,
      treatmentTypeKey: item.treatmentTypeKey,
    };

    items.splice(insertIdx, 0, newItem);

    // If it's a checkout option, we also add it to checkoutOptions
    const updatedCheckoutOptions = [...customProgram.checkoutOptions];
    if (item.kind === "checkout" && item.checkoutOption) {
      updatedCheckoutOptions.push({
        ...item.checkoutOption,
        id: `co-${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    saveCustomProgram(
      {
        ...customProgram,
        flowItems: items,
        checkoutOptions: updatedCheckoutOptions,
      },
      {
        onSuccess: () => {
          toast({
            title: "Item Added",
            description: `Successfully added ${item.title} to flow.`,
          });
          setIsDrawerOpen(false);
        },
      }
    );
  };

  const handleSavePlan = (updated: CustomProgram) => {
    saveCustomProgram(updated, {
      onSuccess: () => {
        toast({
          title: "Plan Saved",
          description: "All changes saved successfully.",
        });
      },
      onError: (err) => {
        toast({
          title: "Error Saving Plan",
          description: "An error occurred while saving. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="h-full max-h-screen flex flex-col p-6 space-y-4">
      <PrototypeNotice>
        Builder matches the prototype list view, flow view, add-to-flow drawer, slug editing, preview, and save controls.
      </PrototypeNotice>

      <div className="flex-1 overflow-hidden">
        <CustomProgramFlowBuilder
          customProgram={customProgram}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onUpdateFlow={handleUpdateFlow}
          onSave={handleSavePlan}
        />
      </div>

      <AddToFlowDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        programs={programs}
        sections={sections}
        consents={consents}
        onAddItem={handleAddItem}
      />
    </div>
  );
}
