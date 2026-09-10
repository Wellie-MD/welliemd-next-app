import type { ProgramLabRequirement } from "@/features/treatments/types";
import { requirementPolicyLabel } from "./programLabRequirementCatalog";

interface Props {
  requirement: ProgramLabRequirement;
  disabled?: boolean;
  onChange: (updates: Pick<ProgramLabRequirement, "isRequired" | "isReleaseRequired">) => void;
}

export function ProgramLabRequirementPolicy({ requirement, disabled = false, onChange }: Props) {
  const name = `patient-requirement-${requirement.requirementKind}-${requirement.panelId || requirement.combinedPanelId}`;
  return (
    <fieldset disabled={disabled} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <legend className="px-1 text-[11.5px] font-bold text-slate-700">Lab requirement policy</legend>
      <div>
        <div className="text-[11.5px] font-bold text-slate-600">Patient requirement</div>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="radio"
              name={name}
              checked={requirement.isRequired}
              onChange={() => onChange({
                isRequired: true,
                isReleaseRequired: requirement.isReleaseRequired,
              })}
            />
            Required
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="radio"
              name={name}
              checked={!requirement.isRequired}
              onChange={() => onChange({
                isRequired: false,
                isReleaseRequired: requirement.isReleaseRequired,
              })}
            />
            Optional
          </label>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {requirement.isRequired
            ? "The patient must complete this Lab before this Program can proceed."
            : "The patient may add this Lab when available and may continue without it."}
        </p>
      </div>
      <label className="flex items-start gap-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={requirement.isReleaseRequired}
          onChange={(event) => onChange({
            isRequired: requirement.isRequired,
            isReleaseRequired: event.target.checked,
          })}
        />
        <span>
          Hold treatment until final Lab results
          <span className="mt-1 block text-[11px] font-normal text-slate-500">
            If this Lab is ordered, the treatment waits for qualifying final results before clinical dispatch.
          </span>
        </span>
      </label>
      <div className="text-[11px] font-semibold text-emerald-700">
        {requirementPolicyLabel(requirement)}
      </div>
    </fieldset>
  );
}
