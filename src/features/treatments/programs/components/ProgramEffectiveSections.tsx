import { AlertTriangle, ExternalLink, Layers, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { EffectiveSectionItem } from "@/features/treatments/api/programsApi";

export interface ProgramSectionsGrouped {
  inherited_global: EffectiveSectionItem[];
  inherited_visit_type: EffectiveSectionItem[];
  explicit_program: EffectiveSectionItem[];
}

interface Props {
  visitType?: string;
  sections?: ProgramSectionsGrouped;
  blockers?: Array<{
    code: string;
    message: string;
    corrective_action?: { code: string; route: string };
  }>;
}

const SectionRows = ({
  items,
  tone,
}: {
  items: EffectiveSectionItem[];
  tone: "purple" | "blue" | "emerald";
}) => {
  const styles = {
    purple: "border-purple-100 bg-purple-50/60 text-purple-700",
    blue: "border-blue-100 bg-blue-50/60 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
  }[tone];

  if (!items.length) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-center text-[11px] text-slate-400">
        No Sections in this group.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((section) => (
        <div
          key={`${section.source_id || section.id}:${section.source_version || section.version || 1}`}
          className={`flex items-center justify-between rounded-xl border p-3.5 ${styles}`}
        >
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 h-4 w-4" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-bold text-slate-900">{section.name}</h4>
                <Lock className="h-3 w-3 text-slate-400" />
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                {section.fields.length} {section.fields.length === 1 ? "field" : "fields"}
                {section.source_version ? ` · source v${section.source_version}` : ""}
              </p>
            </div>
          </div>
          <Link
            to={`/dashboard/treatments/sections?id=${section.source_id || section.id}`}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold hover:underline"
          >
            View in Library <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ))}
    </div>
  );
};

export function ProgramEffectiveSections({ visitType, sections, blockers = [] }: Props) {
  const globalSections = sections?.inherited_global || [];
  const visitTypeSections = sections?.inherited_visit_type || [];
  const explicitSections = sections?.explicit_program || [];
  const total = globalSections.length + visitTypeSections.length + explicitSections.length;

  return (
    <section data-testid="program-effective-sections" className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
      {blockers.length > 0 && (
        <div data-testid="program-effective-content-blockers" className="border-b border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Resolve inherited-content blockers
          </div>
          <div className="space-y-2">
            {blockers.map((blocker) => (
              <div key={`${blocker.code}:${blocker.message}`} className="flex items-center justify-between gap-3 text-xs text-amber-900">
                <span>{blocker.message}</span>
                {blocker.corrective_action?.route?.startsWith("/") && (
                  <Link className="shrink-0 font-bold underline" to={blocker.corrective_action.route}>
                    Fix dependency
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-extrabold text-slate-900">Effective Patient Sections</h3>
          <Badge variant="secondary" className="text-[10px] font-bold">{total} Total</Badge>
        </div>
        <p className="mt-1 max-w-2xl text-[11px] font-medium leading-relaxed text-slate-400">
          Backend-resolved Sections are read-only here. Global and Visit-Type Sections are inherited automatically; Program placements remain scoped to this Program.
        </p>
      </div>
      <div className="space-y-6 p-6">
        <div className="space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">Inherited — Global</div>
          <SectionRows items={globalSections} tone="purple" />
        </div>
        <div className="space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
            Inherited — Visit Type {visitType ? `(${visitType})` : ""}
          </div>
          <SectionRows items={visitTypeSections} tone="blue" />
        </div>
        <div className="space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Explicit — Program Placement</div>
          <SectionRows items={explicitSections} tone="emerald" />
        </div>
      </div>
    </section>
  );
}
