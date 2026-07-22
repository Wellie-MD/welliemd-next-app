import { useState } from "react";
import { useParams } from "react-router-dom";
import { AddToFlowDrawer } from "@/features/treatments/flow-builder/components/modals/AddToFlowDrawer";
import { CheckoutOverrideEditDialog } from "@/features/treatments/flow-builder/components/modals/CheckoutOverrideEditDialog";
import { CustomProgramFlowBuilder } from "@/features/treatments/flow-builder/components/CustomProgramFlowBuilder";
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
import { synchronizeCustomProgramStructure } from "@/features/treatments/flow-builder/utils/customProgramStages";
import type { CheckoutProductOption, CustomProgram, CustomProgramBuilderAddItem, CustomProgramFlowItem } from "@/features/treatments/types";

export default function CustomProgramBuilderPage() {
  const { customProgramId = "custom-universal" } = useParams();
  const { data: customProgram } = useCustomProgram(customProgramId);
  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();

  const saveCustomProgramMutation = useSaveCustomProgram();
  const { mutate: saveCustomProgram } = saveCustomProgramMutation;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCheckoutOverride, setEditingCheckoutOverride] = useState<CustomProgramFlowItem | null>(null);

  if (!customProgram) {
    return <div className="p-6">Custom program not found.</div>;
  }

  const handleUpdateFlow = (updatedItems: CustomProgramFlowItem[]) => {
    saveCustomProgram(
      synchronizeCustomProgramStructure(customProgram, updatedItems),
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
    const updatedCheckoutOptions = [...customProgram.checkoutOptions];
    const checkoutOptionId = item.kind === "checkout" && item.checkoutOption
      ? createMockId("co")
      : undefined;

    const { checkoutOption, ...flowItemExtras } = item;
    const newItem: CustomProgramFlowItem = {
      id: createMockId(item.kind),
      ...flowItemExtras,
      ...(checkoutOptionId ? { sourceId: checkoutOptionId } : {}),
    };

    items.push(newItem);

    // If it's a checkout option, we also add it to checkoutOptions
    if (checkoutOptionId && checkoutOption) {
      updatedCheckoutOptions.push({
        ...checkoutOption,
        id: checkoutOptionId,
      });
    }

    saveCustomProgram(
      {
        ...synchronizeCustomProgramStructure(customProgram, items),
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

  const handleDeleteCheckoutOverride = (item: CustomProgramFlowItem) => {
    const productName = item.title.replace(/^Checkout\s*-\s*/i, "").trim();
    const checkoutOptions = customProgram.checkoutOptions.filter((option) => {
      if (item.sourceId) return option.id !== item.sourceId;
      return option.productName.trim() !== productName;
    });
    const updated = synchronizeCustomProgramStructure(
      customProgram,
      customProgram.flowItems.filter((candidate) => candidate.id !== item.id)
    );
    saveCustomProgram(
      { ...updated, checkoutOptions },
      {
        onSuccess: () => {
          toast({ title: "Checkout Override Removed", description: "The plan-level checkout override was removed." });
        },
      }
    );
  };

  const findCheckoutOverrideOption = (item: CustomProgramFlowItem) =>
    customProgram.checkoutOptions.find((option) => option.id === item.sourceId)
    || customProgram.checkoutOptions.find((option) => item.title.includes(option.productName));

  const handleEditCheckoutOverride = (item: CustomProgramFlowItem) => {
    if (!findCheckoutOverrideOption(item)) {
      toast({
        title: "Checkout Override Unavailable",
        description: "This legacy row has no linked checkout option. Remove it and add a replacement override.",
        variant: "destructive",
      });
      return;
    }
    setEditingCheckoutOverride(item);
  };

  const handleSaveCheckoutOverride = (item: CustomProgramFlowItem, option: CheckoutProductOption) => {
    const updated = synchronizeCustomProgramStructure(
      customProgram,
      customProgram.flowItems.map((candidate) => candidate.id === item.id ? item : candidate)
    );
    saveCustomProgram(
      {
        ...updated,
        checkoutOptions: customProgram.checkoutOptions.map((candidate) => candidate.id === option.id ? option : candidate),
      },
      {
        onSuccess: () => toast({ title: "Checkout Override Updated", description: "The plan-level checkout override was saved." }),
      }
    );
  };

  const checkoutOverrideOption = editingCheckoutOverride
    ? findCheckoutOverrideOption(editingCheckoutOverride)
    : undefined;

  const handleSavePlan = (updated: CustomProgram) => {
    saveCustomProgram(synchronizeCustomProgramStructure(updated, updated.flowItems), {
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
      <div className="flex-1 overflow-hidden">
        <CustomProgramFlowBuilder
          customProgram={customProgram}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onUpdateFlow={handleUpdateFlow}
          onSave={handleSavePlan}
          programs={programs}
          sections={sections}
          consents={consents}
          onEditCheckoutOverride={handleEditCheckoutOverride}
          onDeleteCheckoutOverride={handleDeleteCheckoutOverride}
          onSaveMatching={async (programMatchingRules) => {
            await saveCustomProgramMutation.mutateAsync(
              synchronizeCustomProgramStructure(
                { ...customProgram, programMatchingRules },
                customProgram.flowItems
              )
            );
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

      <CheckoutOverrideEditDialog
        open={Boolean(editingCheckoutOverride)}
        onOpenChange={(open) => { if (!open) setEditingCheckoutOverride(null); }}
        item={editingCheckoutOverride}
        option={checkoutOverrideOption}
        onSave={handleSaveCheckoutOverride}
      />
    </div>
  );
}
