import type { LabPanel } from "@/api/labs";
import type { CombinedLabPanel } from "@/features/labs/types";
import type { ProgramLabRequirement } from "@/features/treatments/types";

export type ProgramLabTarget =
  | { kind: "single"; panel: LabPanel }
  | { kind: "combined"; panel: CombinedLabPanel };

export interface CombinedPanelEditForm {
  name: string;
  description: string;
  cost_to_client: string;
  cost_to_welliemd: string;
  service_states: string[];
  is_active: boolean;
}

export const combinedPanelEditForm = (
  panel: CombinedLabPanel,
): CombinedPanelEditForm => ({
  name: panel.name,
  description: panel.description || "",
  cost_to_client: panel.cost_to_client?.amount || "0.00",
  cost_to_welliemd: panel.cost_to_welliemd?.amount || "0.00",
  service_states: [...(panel.service_states || [])],
  is_active: panel.is_active,
});

export const requirementTargetKey = (requirement: ProgramLabRequirement): string => (
  `${requirement.requirementKind}:${requirement.requirementKind === "single"
    ? requirement.panelId || ""
    : requirement.combinedPanelId || ""}`
);

export const targetKey = (target: ProgramLabTarget): string => (
  `${target.kind}:${target.panel.id}`
);

export const formatCollectionMethod = (method: string): string => method
  .replaceAll("_", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const targetName = (target: ProgramLabTarget): string => target.panel.name;

export const targetMethods = (target: ProgramLabTarget): string[] => (
  target.kind === "combined"
    ? target.panel.members
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((member) => formatCollectionMethod(member.collection_method))
    : [formatCollectionMethod(target.panel.collection_method)]
);

export const targetCostToClient = (target: ProgramLabTarget): number => (
  target.kind === "combined"
    ? Number.parseFloat(target.panel.cost_to_client?.amount || "0")
    : Number(target.panel.cost_to_client || 0)
);

export const isSelectableTarget = (target: ProgramLabTarget): boolean => (
  target.kind === "single"
    ? target.panel.is_active && target.panel.is_assignable !== false
    : target.panel.is_active
      && !target.panel.is_archived
      && target.panel.is_assignable !== false
      && target.panel.members.length >= 2
);

export const requirementForTarget = (
  target: ProgramLabTarget,
  displayOrder: number,
): ProgramLabRequirement => ({
  requirementKind: target.kind,
  panelId: target.kind === "single" ? target.panel.id : undefined,
  panelName: target.kind === "single" ? target.panel.name : undefined,
  combinedPanelId: target.kind === "combined" ? target.panel.id : undefined,
  combinedPanelName: target.kind === "combined" ? target.panel.name : undefined,
  displayOrder,
  isRequired: true,
  isReleaseRequired: true,
  sharingPolicy: "never",
  sharingGroupKey: "",
  isActive: true,
  instructions: "",
});

export const requirementPolicyLabel = (
  requirement: Pick<ProgramLabRequirement, "isRequired" | "isReleaseRequired">,
): string => {
  if (requirement.isRequired) {
    return requirement.isReleaseRequired
      ? "Required · Holds treatment"
      : "Required · Does not hold treatment";
  }
  return requirement.isReleaseRequired
    ? "Optional · Holds treatment if selected"
    : "Optional · Does not hold treatment";
};
