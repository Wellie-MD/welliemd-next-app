import { useState } from "react";
import { useParams } from "react-router-dom";
import { AddToFlowDrawer } from "@/features/treatments/flow-builder/components/modals/AddToFlowDrawer";
import { CustomProgramFlowBuilder } from "@/features/treatments/flow-builder/components/CustomProgramFlowBuilder";
import { PrototypeNotice } from "@/features/treatments/common/components";
import { toast } from "@/components/ui/use-toast";
import {
  useConsents,
  useCustomProgram,
  usePrograms,
  useSections,
  useSaveCustomProgram,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { createMockId } from "@/features/treatments/common/data/factories";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import type { CustomProgram, CustomProgramBuilderAddItem, CustomProgramFlowItem } from "@/features/treatments/types";

export default function CustomProgramBuilderPage() {
  const { customProgramId = "custom-universal" } = useParams();
  const { data: customProgram } = useCustomProgram(customProgramId);
  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();

  const saveCustomProgramMutation = useSaveCustomProgram();
  const { mutate: saveCustomProgram } = saveCustomProgramMutation;

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
    const items = [...customProgram.flowItems];
    // Find the first terminal step (consent or checkout) from the end to insert before it.
    let insertIdx = items.length;
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].kind === "checkout" || items[i].kind === "consent") {
        insertIdx = i;
      } else {
        break;
      }
    }

    const { checkoutOption, ...flowItemExtras } = item;
    const newItem: CustomProgramFlowItem = {
      id: createMockId(item.kind),
      ...flowItemExtras,
    };

    items.splice(insertIdx, 0, newItem);

    // If it's a checkout option, we also add it to checkoutOptions
    const updatedCheckoutOptions = [...customProgram.checkoutOptions];
    if (item.kind === "checkout" && checkoutOption) {
      updatedCheckoutOptions.push({
        ...checkoutOption,
        id: createMockId("co"),
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
      onError: (error) => {
        if (isDuplicateSlugError(error)) {
          showDuplicateSlugToast();
          return;
        }

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
          programs={programs}
          onSaveMatching={async (programMatchingRules) => {
            await saveCustomProgramMutation.mutateAsync({ ...customProgram, programMatchingRules });
            toast({ title: "Matching Rules Saved", description: "Program matching rules are ready for preview and publishing." });
          }}
        />
      </div>

      <AddToFlowDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        programs={programs}
        sections={sections}
        consents={consents}
        onAddItem={handleAddItem}
        flowItems={customProgram.flowItems}
      />
    </div>
  );
}
