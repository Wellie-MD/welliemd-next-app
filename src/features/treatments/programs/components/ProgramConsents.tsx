import { Shield, ExternalLink, Trash2, Lock, Sparkles, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface EffectiveConsentItem {
  id: string;
  source_id?: string;
  source_version?: number;
  source_type?: "global" | "visit_type" | "program" | "inline";
  scope?: string;
  name: string;
  text?: string;
  required?: boolean;
  visit_type_keys?: string[];
  resolved_from?: Array<{ type: string; key?: string; id?: string; program_id?: string }>;
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
  consents?: Array<{ id: string; name: string; scope: string }>;
  onAddConsent: () => void;
  onRemoveConsent?: (consentId: string) => void;
}

export function ProgramConsents({
  visitType,
  groupedConsents,
  consents = [],
  onAddConsent,
  onRemoveConsent,
}: ProgramConsentsProps) {
  // If groupedConsents is provided via EffectiveContent API, use it directly; otherwise fallback gracefully.
  const globalConsents = groupedConsents?.inherited_global || consents.filter((c) => c.scope === "global");
  const visitTypeConsents = groupedConsents?.inherited_visit_type || [];
  const explicitConsents = groupedConsents?.explicit_program || consents.filter((c) => c.scope !== "global" && c.scope !== "visit_type");
  const inlineConsents = groupedConsents?.inline_conditional || [];

  const totalCount =
    globalConsents.length +
    visitTypeConsents.length +
    explicitConsents.length +
    inlineConsents.length;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-6">
      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-slate-900">Effective Patient Consents</h3>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {totalCount} Total
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed font-medium">
            Legal consents required before treatment checkout. Inherited Global and Visit-Type consents apply automatically without database duplication. Explicit Program consents are attached directly.
          </p>
        </div>
        <Button
          onClick={onAddConsent}
          size="sm"
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[12px] h-9 px-4 rounded-lg shadow-sm"
        >
          + Add Consent
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. Inherited — Global */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-purple-700 tracking-wider uppercase">
                Inherited — Global
              </span>
              <Badge variant="outline" className="text-[9px] font-bold text-purple-600 bg-purple-50 border-purple-200">
                Universal ({globalConsents.length})
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Read-only from Shared Library</span>
          </div>

          <div className="space-y-2">
            {globalConsents.length === 0 ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-center text-[11px] text-slate-400">
                No active global consents found.
              </div>
            ) : (
              globalConsents.map((uc) => (
                <div
                  key={uc.id}
                  className="flex items-center justify-between bg-[#faf7ff] border border-[#f3e8ff] rounded-xl p-3.5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Shield className="h-4 w-4 text-[#a855f7]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-bold text-slate-900">{uc.name}</h4>
                        <Lock className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Global — automatically inherited across all programs
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/treatments/consents?id=${uc.source_id || uc.id}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline px-2 py-1"
                  >
                    View in Library <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Inherited — Visit Type */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-blue-700 tracking-wider uppercase">
                Inherited — Visit Type {visitType ? `(${visitType})` : ""}
              </span>
              <Badge variant="outline" className="text-[9px] font-bold text-blue-600 bg-blue-50 border-blue-200">
                Route Match ({visitTypeConsents.length})
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Read-only from Shared Library</span>
          </div>

          <div className="space-y-2">
            {visitTypeConsents.length === 0 ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-center text-[11px] text-slate-400">
                No matching visit-type consents for route <span className="font-semibold text-slate-600">"{visitType || "default"}"</span>.
              </div>
            ) : (
              visitTypeConsents.map((vtc) => (
                <div
                  key={vtc.id}
                  className="flex items-center justify-between bg-[#f0f7ff] border border-[#dbeafe] rounded-xl p-3.5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Layers className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-bold text-slate-900">{vtc.name}</h4>
                        <Lock className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Visit-Type route: {visitType || "matching"}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/treatments/consents?id=${vtc.source_id || vtc.id}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline px-2 py-1"
                  >
                    View in Library <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Explicit — Program */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase">
                Explicit — Program Attachment
              </span>
              <Badge variant="outline" className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                {explicitConsents.length} Attached
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Scoped strictly to this program</span>
          </div>

          {explicitConsents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-[#fafafa] p-5 text-center">
              <p className="text-[11px] text-slate-400 font-medium">
                No explicit consents attached. Universal & Visit-Type consents above apply automatically. Click <strong className="font-bold text-slate-600">+ Add Consent</strong> to attach program-specific consents.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {explicitConsents.map((ec) => (
                <div
                  key={ec.id}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 transition-colors shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900">{ec.name}</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        Explicit Program Consent — will only snapshot into this program's case
                      </div>
                    </div>
                  </div>
                  {onRemoveConsent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveConsent(ec.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Inline — Conditional */}
        {inlineConsents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-amber-700 tracking-wider uppercase">
                  Inline — Conditional Flow Consents
                </span>
                <Badge variant="outline" className="text-[9px] font-bold text-amber-700 bg-amber-50 border-amber-200">
                  {inlineConsents.length} Conditional
                </Badge>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Triggered during screening flow</span>
            </div>

            <div className="space-y-2">
              {inlineConsents.map((ic) => (
                <div
                  key={ic.id}
                  className="flex items-center justify-between bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900">{ic.name}</h4>
                      <div className="text-[11px] text-amber-800/80 mt-0.5 font-medium">
                        Inline screening consent (triggers conditionally on question responses)
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-semibold bg-amber-100/80 text-amber-800 border-amber-300">
                    Screening Flow
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
