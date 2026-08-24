import { ExternalLink, Shield, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EffectiveConsentItem {
  id: string;
  source_id?: string;
  source_type?: "global" | "visit_type" | "program" | "inline";
  name: string;
  required?: boolean;
}

export interface ProgramConsentsGrouped {
  inherited_global: EffectiveConsentItem[];
  inherited_visit_type: EffectiveConsentItem[];
  explicit_program: EffectiveConsentItem[];
  inline_conditional: EffectiveConsentItem[];
}

interface ProgramConsentsProps {
  visitType?: string;
  groupedConsents?: ProgramConsentsGrouped;
  consents?: Array<{ id: string; name: string; scope: string; visitTypeKeys?: string[] }>;
  attachedConsentIds?: string[];
  onAddConsent: () => void;
  onRemoveConsent?: (consentId: string) => void;
}

export function ProgramConsents({
  groupedConsents,
  consents = [],
  attachedConsentIds = [],
  onAddConsent,
  onRemoveConsent,
}: ProgramConsentsProps) {
  const fallback = resolveProgramConsentFallback(consents, undefined, attachedConsentIds);
  const explicitConsents = groupedConsents?.explicit_program || fallback.explicit_program;
  const inlineConsents = groupedConsents?.inline_conditional || [];
  const totalCount = explicitConsents.length + inlineConsents.length;

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between border-b border-slate-100 p-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-slate-900">Program Consents</h3>
            <Badge variant="secondary" className="text-[10px] font-bold">{totalCount} Total</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-[11px] font-medium leading-relaxed text-slate-400">
            Only explicitly attached Consents are included. Universal and Treatment-specific scopes control compatibility; neither scope adds a Consent automatically.
          </p>
        </div>
        <Button onClick={onAddConsent} size="sm" className="h-9 rounded-lg bg-[#2563eb] px-4 text-[12px] font-bold text-white hover:bg-[#1d4ed8]">+ Add Consent</Button>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Explicit Program placements</span>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[9px] font-bold text-emerald-700">{explicitConsents.length} Attached</Badge>
        </div>
        {explicitConsents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-[#fafafa] p-5 text-center text-[11px] font-medium text-slate-400">
            No Consents attached. Choose a compatible library Consent with + Add Consent.
          </div>
        ) : explicitConsents.map((consent) => (
          <div key={consent.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div>
                <h4 className="text-[13px] font-bold text-slate-900">{consent.name}</h4>
                <div className="mt-0.5 text-[11px] font-medium text-slate-400">Explicitly placed in this Program release</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/dashboard/treatments/consents?id=${consent.source_id || consent.id}`} className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">
                Library <ExternalLink className="h-3 w-3" />
              </Link>
              {onRemoveConsent && (
                <Button variant="ghost" size="sm" onClick={() => onRemoveConsent(consent.id)} className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="mr-1 h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>
        ))}

        {inlineConsents.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Inline conditional Consents</span>
            {inlineConsents.map((consent) => (
              <div key={consent.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">{consent.name}</h4>
                  <div className="text-[11px] font-medium text-amber-800/80">Authored in the screening flow and shown only when its condition matches</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function resolveProgramConsentFallback(
  consents: Array<{ id: string; name: string; scope: string; visitTypeKeys?: string[] }>,
  _visitType?: string,
  attachedConsentIds: string[] = [],
): Omit<ProgramConsentsGrouped, "inline_conditional"> {
  const attachedIds = new Set(attachedConsentIds);
  return {
    inherited_global: [],
    inherited_visit_type: [],
    explicit_program: consents.filter((consent) => attachedIds.has(consent.id)),
  };
}
