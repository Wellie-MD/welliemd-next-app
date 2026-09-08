import { AlertTriangle, Check, Circle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { LabPanel } from "@/api/labs";
import type { CombinedLabPanel } from "@/features/labs/types";
import type { CombinedQualificationCandidate } from "@/features/labs/types";
import { getCollectionMethodLabel } from "@/features/labs/utils";

export interface CombinedValidationState {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checking: boolean;
  comparison?: {
    evidence_status: "looks_like_match" | "differences_found" | "not_enough_information";
    shared_loinc_codes: string[];
    member_only_loinc_codes: Record<string, string[]>;
  };
}

const STEPS = ["Choose labs", "Qualification client", "Understand comparison", "Confirm decision"];

export function AuthoringSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Combined panel creation steps" className="grid grid-cols-4 gap-2">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="min-w-0">
            <div className={`h-1 rounded-full ${number <= current ? "bg-blue-600" : "bg-slate-200"}`} />
            <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-semibold ${active ? "text-blue-700" : "text-slate-500"}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${number <= current ? "border-blue-600 bg-blue-50" : "border-slate-300"}`}>
                {complete ? <Check className="h-3 w-3" /> : number}
              </span>
              <span className="truncate">{label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function QualificationClientSelection({
  candidates,
  loading,
  selectedClientId,
  onSelect,
}: {
  candidates: CombinedQualificationCandidate[];
  loading: boolean;
  selectedClientId: string;
  onSelect: (clientId: string) => void;
}) {
  if (loading) {
    return <Notice tone="neutral" title="Checking client assignments…" detail="We are checking whether each selected Lab is already assigned and approved for a client." />;
  }
  if (candidates.length === 0) {
    return <Notice tone="warning" title="No clients to review" detail="Select at least two Labs first. The Combined Panel can use only existing standalone assignments." />;
  }
  return (
    <section aria-labelledby="qualification-client-heading" className="space-y-3">
      <div>
        <h3 id="qualification-client-heading" className="text-sm font-semibold text-slate-900">Choose a qualification client</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          This client is used to verify the selected standalone Labs. Every selected Lab must already be assigned to this client and approved by Junction before the Combined Panel can be created.
        </p>
      </div>
      <div className="space-y-2">
        {candidates.map(candidate => (
          <label key={candidate.client_id} className={`block rounded-xl border p-3 cursor-pointer ${selectedClientId === candidate.client_id ? "border-blue-500 bg-blue-50/60" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start gap-3">
              <input type="radio" name="combined-qualification-client" value={candidate.client_id} checked={selectedClientId === candidate.client_id} onChange={() => onSelect(candidate.client_id)} className="mt-1" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-900">{candidate.client_name}</span>
                <span className="block text-[11px] text-slate-500">{candidate.client_email}</span>
                <span className={`mt-2 inline-block text-[11px] font-semibold ${candidate.eligible ? "text-emerald-700" : "text-amber-700"}`}>{candidate.eligible ? "Eligible for Combined Panel qualification" : "Needs attention before qualification"}</span>
                <span className="mt-2 block space-y-1">{candidate.members.map(member => <span key={member.panel_id} className="block text-[11px] text-slate-600">{member.panel_name}: <span className="font-medium">{member.readiness_code.replaceAll("_", " ")}</span>{member.reason ? ` — ${member.reason}` : ""}</span>)}</span>
              </span>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}

export function ComparisonOverview({
  panels,
  validation,
  qualificationCandidate,
}: {
  panels: LabPanel[];
  validation: CombinedValidationState;
  qualificationCandidate: CombinedQualificationCandidate;
}) {
  if (validation.checking) {
    return <Notice tone="neutral" title="Comparing selected labs…" />;
  }
  const comparison = validation.comparison;
  const statusCopy = {
    looks_like_match: ["Looks like a match", "The available expected-result codes match across the selected labs."],
    differences_found: ["Differences found", "The selected labs do not report exactly the same expected results. Review the details and record your decision."],
    not_enough_information: ["Not enough information", "At least one selected lab has incomplete expected-result evidence. Manual review is required."],
  } as const;
  const evidence = comparison ? statusCopy[comparison.evidence_status] : statusCopy.not_enough_information;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900">The system explains. You decide.</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Review the available clinical and setup information. Differences do not prevent an authorized Admin from creating a Combined Panel.
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>Lab</span><span>Method</span><span>Results</span><span>Setup</span>
          </div>
          {panels.map(panel => {
            const memberReadiness = qualificationCandidate.members.find(member => member.panel_id === panel.id);
            const memberReady = memberReadiness?.readiness_code === "active_orderable";
            return (
            <div key={panel.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center border-t px-4 py-3 text-xs">
              <div><p className="font-semibold text-slate-900">{panel.name}</p><p className="text-slate-500">{panel.lab_provider || "Provider not supplied"}</p></div>
              <span>{getCollectionMethodLabel(panel.collection_method)}</span>
              <span className="text-slate-700">
                {comparison?.member_only_loinc_codes[panel.id]?.length
                  ? `${comparison.member_only_loinc_codes[panel.id].length} unique result${comparison.member_only_loinc_codes[panel.id].length === 1 ? "" : "s"}`
                  : comparison?.evidence_status === "looks_like_match" ? "Matches selected labs" : "No unique results found"}
              </span>
              <span className={memberReady ? "text-emerald-700" : "text-amber-700"}>
                {memberReady ? "Approved and orderable" : memberReadiness?.readiness_code.replaceAll("_", " ") || "Not assigned"}
              </span>
            </div>
            );
          })}
        </div>
      </div>
      <Notice
        tone={qualificationCandidate.eligible ? "success" : "warning"}
        title={`${qualificationCandidate.client_name}: ${qualificationCandidate.eligible ? "all selected Labs are approved and orderable" : "member readiness needs attention"}`}
        detail="This readiness check uses only this client's standalone Lab assignments."
      />
      {validation.errors.map(error => <Notice key={error} tone="danger" title={error} />)}
      {!validation.errors.length && <Notice tone={comparison?.evidence_status === "looks_like_match" ? "success" : "warning"} title={evidence[0]} detail={evidence[1]} />}
      {validation.warnings.map(warning => <Notice key={warning} tone="warning" title="Attention item" detail={warning} />)}
      {comparison && (
        <details className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs">
          <summary className="cursor-pointer font-semibold text-blue-700">View full comparison</summary>
          <div className="mt-3 space-y-3 text-slate-600">
            <p><span className="font-semibold text-slate-800">Shared expected results:</span> {comparison.shared_loinc_codes.length ? comparison.shared_loinc_codes.join(", ") : "None identified"}</p>
            {panels.map(panel => {
              const uniqueCodes = comparison.member_only_loinc_codes[panel.id] || [];
              return <p key={panel.id}><span className="font-semibold text-slate-800">{panel.name} only:</span> {uniqueCodes.length ? uniqueCodes.join(", ") : "None"}</p>;
            })}
          </div>
        </details>
      )}
    </div>
  );
}

export function DecisionConfirmation({
  panels,
  warnings,
  reason,
  onReasonChange,
}: {
  panels: LabPanel[];
  warnings: string[];
  reason: string;
  onReasonChange: (value: string) => void;
}) {
  const needsReason = warnings.length > 0;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Review your Combined Panel</p>
        <p className="mt-1 text-xs text-slate-500">{panels.length} labs selected. Patients will only see methods available for their location.</p>
        <div className="mt-3 space-y-2">
          {panels.map(panel => <div key={panel.id} className="flex items-center gap-2 text-xs"><Circle className="h-2 w-2 fill-blue-600 text-blue-600" /><span className="font-medium">{panel.name}</span><span className="text-slate-500">· {getCollectionMethodLabel(panel.collection_method)}</span></div>)}
        </div>
      </div>
      {needsReason ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <label htmlFor="combined-review-reason" className="text-sm font-semibold text-slate-900">Why should these labs be offered together?</label>
          <p className="text-xs leading-5 text-slate-600">Add a review reason confirming that you considered the differences. This does not change the source Lab data.</p>
          <Input id="combined-review-reason" aria-label="Admin review reason" value={reason} onChange={event => onReasonChange(event.target.value)} placeholder="Add a clear review reason…" className="bg-white" />
        </div>
      ) : <Notice tone="success" title="Ready for review" detail="The available information did not return attention items." />}
    </div>
  );
}

export function CombinedMemberMatrix({ members }: { members: CombinedLabPanel["members"] }) {
  return <section className="space-y-2 rounded-xl border border-slate-200 p-4"><div><h3 className="text-sm font-semibold">Included lab tests</h3><p className="mt-1 text-xs text-slate-500">Published members are frozen. Create a new version to change them.</p></div><div className="overflow-x-auto rounded-lg border"><div className="min-w-[560px] divide-y text-xs"><div className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr] gap-3 bg-slate-50 px-3 py-2 font-semibold text-slate-600"><span>Method</span><span>Lab test</span><span>Provider</span><span>Setup</span></div>{members.map(member => <div key={member.id} className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr] gap-3 px-3 py-2.5"><span>{getCollectionMethodLabel(member.collection_method)}</span><span>{member.panel_name}</span><span>{member.lab_provider || "—"}</span><span className={member.is_orderable ? "text-emerald-700" : "text-amber-700"}>{member.is_orderable ? "Ready" : "Attention"}</span></div>)}</div></div></section>;
}

function Notice({ tone, title, detail }: { tone: "neutral" | "success" | "warning" | "danger"; title: string; detail?: string }) {
  const styles = { neutral: "border-slate-200 bg-slate-50 text-slate-700", success: "border-emerald-200 bg-emerald-50 text-emerald-800", warning: "border-amber-200 bg-amber-50 text-amber-800", danger: "border-red-200 bg-red-50 text-red-700" };
  const Icon = tone === "success" ? Check : tone === "warning" || tone === "danger" ? AlertTriangle : Info;
  return <div role={tone === "danger" ? "alert" : undefined} className={`flex gap-2 rounded-lg border px-3 py-2.5 text-xs ${styles[tone]}`}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">{title}</p>{detail ? <p className="mt-1 leading-5 opacity-90">{detail}</p> : null}</div></div>;
}
