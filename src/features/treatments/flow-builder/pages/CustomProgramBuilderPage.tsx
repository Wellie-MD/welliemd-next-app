import { useState } from "react";
import { useParams } from "react-router-dom";
import { AddToFlowDrawer } from "@/features/treatments/flow-builder/components/modals/AddToFlowDrawer";
import { CustomProgramFlowBuilder } from "@/features/treatments/flow-builder/components/CustomProgramFlowBuilder";
import { toast } from "@/components/ui/use-toast";
import {
  useConsents,
  useCustomProgram,
  useCustomProgramValidation,
  usePrograms,
  usePublishCustomProgram,
  useSections,
  useSaveCustomProgram,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { createMockId } from "@/features/treatments/common/data/factories";
import { RUNTIME_STATE } from "@/features/treatments/assignment/constants";
import { isDuplicateSlugError, showDuplicateSlugToast } from "@/features/treatments/common/utils/slugError";
import {
  customProgramMutationErrorMessage,
  isCustomProgramRevisionConflict,
} from "@/features/treatments/api/customProgramsApi";
import { synchronizeCustomProgramStructure } from "@/features/treatments/flow-builder/utils/customProgramStages";
import type { CustomProgram, CustomProgramBuilderAddItem, CustomProgramFlowItem } from "@/features/treatments/types";

const blockerMessage = (message: string | Record<string, unknown>) => {
  if (typeof message === "string") return message;
  return Object.entries(message)
    .flatMap(([field, value]) => Array.isArray(value) ? value.map((item) => `${field}: ${String(item)}`) : [`${field}: ${String(value)}`])
    .join("; ");
};

const staleBuilderRevisionMessage = (error: unknown): string | null => {
  if (isCustomProgramRevisionConflict(error)) {
    return "This draft changed in another Admin window. Refresh it, review the latest changes, and save again.";
  }
  return null;
};

export default function CustomProgramBuilderPage() {
  const { customProgramId = "custom-universal" } = useParams();
  const { data: customProgram } = useCustomProgram(customProgramId);
  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();
  const { data: validation } = useCustomProgramValidation(customProgramId);

  const saveCustomProgramMutation = useSaveCustomProgram();
  const publishCustomProgramMutation = usePublishCustomProgram();
  const { mutate: saveCustomProgram } = saveCustomProgramMutation;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!customProgram) {
    return <div className="p-6">Custom program not found.</div>;
  }

  const validationBlockers = validation?.blockers || [];
  const programNames = new Map(programs.map((program) => [String(program.id), program.name]));
  const attachedProgramBlockers = customProgram.includedProgramIds.map((programId) => ({
    programId: String(programId),
    name: programNames.get(String(programId)) || `Program ${programId}`,
    blockers: validationBlockers.filter((blocker) => String(blocker.source_id || "") === String(programId)),
  })).filter((entry) => entry.blockers.length > 0);
  const generalBlockers = validationBlockers.filter((blocker) => !blocker.source_id);

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
        onError: (error) => {
          toast({
            title: "Unable to update flow",
            description: customProgramMutationErrorMessage(error, "The flow could not be saved. Please try again."),
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleAddItem = (item: CustomProgramBuilderAddItem) => {
    const items = [...customProgram.flowItems];

    const flowItemExtras = Object.fromEntries(
      Object.entries(item).filter(([key]) => key !== "checkoutOption"),
    ) as Omit<CustomProgramBuilderAddItem, "checkoutOption">;
    const newItem: CustomProgramFlowItem = {
      id: createMockId(item.kind),
      ...flowItemExtras,
    };

    items.push(newItem);

    saveCustomProgram(
      {
        ...synchronizeCustomProgramStructure(customProgram, items),
      },
      {
        onSuccess: () => {
          toast({
            title: "Item Added",
            description: `Successfully added ${item.title} to flow.`,
          });
          setIsDrawerOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Unable to add item",
            description: customProgramMutationErrorMessage(error, "The item could not be added to the flow. Please try again."),
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSavePlan = (updated: CustomProgram) => {
    saveCustomProgram(synchronizeCustomProgramStructure(updated, updated.flowItems), {
      onSuccess: () => {
        toast({
          title: "Plan Saved",
          description: "All changes saved successfully.",
        });
      },
      onError: (error) => {
        const staleMessage = staleBuilderRevisionMessage(error);
        if (staleMessage) {
          toast({
            title: "Draft changed elsewhere",
            description: staleMessage,
            variant: "destructive",
          });
          return;
        }
        if (isDuplicateSlugError(error)) {
          showDuplicateSlugToast();
          return;
        }

        toast({
          title: "Error Saving Plan",
          description: customProgramMutationErrorMessage(error, "An error occurred while saving. Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  const handlePublish = async () => {
    try {
      const saved = await saveCustomProgramMutation.mutateAsync(
        synchronizeCustomProgramStructure(customProgram, customProgram.flowItems)
      );
      await publishCustomProgramMutation.mutateAsync(saved.id);
      toast({
        title: "New Version Published",
        description: "Preview and future assignments now use the latest immutable release.",
      });
    } catch (error) {
      const staleMessage = staleBuilderRevisionMessage(error);
      toast({
        title: staleMessage ? "Draft changed elsewhere" : "Unable to Publish",
        description: staleMessage || customProgramMutationErrorMessage(error, "Resolve the reported configuration dependencies and try again."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full max-h-screen flex flex-col p-6 space-y-4">
      {validationBlockers.length > 0 && (
        <section className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950" role="alert">
          <div className="font-bold">Resolve Custom Program validation issues before publishing</div>
          <div className="mt-2 space-y-2">
            {attachedProgramBlockers.map(({ programId, name, blockers }) => (
              <div key={programId}>
                <div className="font-semibold">{name}</div>
                <ul className="ml-4 list-disc text-amber-800">
                  {blockers.map((blocker, index) => (
                    <li key={`${blocker.code}-${index}`}>{blockerMessage(blocker.message)}</li>
                  ))}
                </ul>
              </div>
            ))}
            {generalBlockers.length > 0 && (
              <ul className="ml-4 list-disc text-amber-800">
                {generalBlockers.map((blocker, index) => (
                  <li key={`${blocker.code}-${index}`}>{blockerMessage(blocker.message)}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <div className="flex-1 overflow-hidden">
        <CustomProgramFlowBuilder
          customProgram={customProgram}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onUpdateFlow={handleUpdateFlow}
          onSave={handleSavePlan}
          onPublish={handlePublish}
          isPublishing={saveCustomProgramMutation.isPending || publishCustomProgramMutation.isPending}
          programs={programs}
          sections={sections}
          consents={consents}
          onSaveMatching={async (programMatchingRules) => {
            try {
              await saveCustomProgramMutation.mutateAsync(
                synchronizeCustomProgramStructure(
                  { ...customProgram, programMatchingRules },
                  customProgram.flowItems
                )
              );
              toast({ title: "Matching Rules Saved", description: "Program matching rules are ready for preview and publishing." });
            } catch (error) {
              toast({
                title: "Unable to save matching rules",
                description: customProgramMutationErrorMessage(error, "The matching rules could not be saved. Please try again."),
                variant: "destructive",
              });
              throw error;
            }
          }}
        />
      </div>

      <AddToFlowDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        programs={programs.filter((program) => program.assignmentRuntimeState === RUNTIME_STATE.ready)}
        sections={sections}
        consents={consents}
        onAddItem={handleAddItem}
        flowItems={customProgram.flowItems}
      />
    </div>
  );
}
