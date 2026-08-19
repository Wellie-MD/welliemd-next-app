import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  FileCheck2,
  FlaskConical,
  PackageSearch,
  Settings2,
  Tags,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

interface ProgramConfigurationAccessProps {
  programId: string;
  treatmentTypeKey: string;
  serviceStatesAll: boolean;
  serviceStates: string[];
  serviceAreaCoverage?: {
    missingStates: string[];
    warning?: string | null;
  };
  onEditSettings: () => void;
}

const configurationLinks = (programId: string, treatmentTypeKey: string) => [
  {
    label: "Questions",
    detail: "Screening and checkout",
    icon: ClipboardList,
    to: ADMIN_TREATMENT_ROUTES.programQuestions(programId),
  },
  {
    label: "Treatment Type",
    detail: treatmentTypeKey,
    icon: Tags,
    to: ADMIN_TREATMENT_ROUTES.treatmentType(treatmentTypeKey),
  },
  {
    label: "Sections",
    detail: "Reusable content",
    icon: FileCheck2,
    to: ADMIN_TREATMENT_ROUTES.sections,
  },
  {
    label: "Consents",
    detail: "Universal and treatment",
    icon: FileCheck2,
    to: ADMIN_TREATMENT_ROUTES.consents,
  },
  {
    label: "Products",
    detail: "Treatment options",
    icon: PackageSearch,
    to: ADMIN_TREATMENT_ROUTES.products,
  },
  {
    label: "Labs",
    detail: "Program requirements",
    icon: FlaskConical,
    to: ADMIN_TREATMENT_ROUTES.labs,
  },
];

export function ProgramConfigurationAccess({
  programId,
  treatmentTypeKey,
  serviceStatesAll,
  serviceStates,
  serviceAreaCoverage,
  onEditSettings,
}: ProgramConfigurationAccessProps) {
  const serviceArea = serviceStatesAll
    ? "All supported states"
    : serviceStates.length
      ? serviceStates.join(", ")
      : "No states configured";

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Program configuration
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Service area: <strong className="text-slate-700">{serviceArea}</strong>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={onEditSettings}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Edit settings
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {configurationLinks(programId, treatmentTypeKey).map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="min-w-0">
              <strong className="block truncate text-xs text-slate-800">
                {item.label}
              </strong>
              <small className="block truncate text-[10px] text-slate-400">
                {item.detail}
              </small>
            </span>
          </Link>
        ))}
      </div>
      {serviceAreaCoverage?.warning && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {serviceAreaCoverage.warning}
            {serviceAreaCoverage.missingStates.length > 0 && (
              <> Missing coverage: {serviceAreaCoverage.missingStates.join(", ")}.</>
            )}
          </span>
        </div>
      )}
    </section>
  );
}
