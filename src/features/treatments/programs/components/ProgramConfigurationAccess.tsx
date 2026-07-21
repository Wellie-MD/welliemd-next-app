import { Link } from "react-router-dom";
import {
  ClipboardList,
  FileCheck2,
  FlaskConical,
  PackageSearch,
  Tags,
} from "lucide-react";

import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

interface ProgramConfigurationAccessProps {
  programId: string;
  treatmentTypeKey: string;
  serviceStatesAll: boolean;
  serviceStates: string[];
  consentCount: number;
  productLaneCount: number;
  labCount: number;
}

export function ProgramConfigurationAccess({
  programId,
  treatmentTypeKey,
  serviceStatesAll,
  serviceStates,
  consentCount,
  productLaneCount,
  labCount,
}: ProgramConfigurationAccessProps) {
  const serviceArea = serviceStatesAll
    ? "All supported states"
    : serviceStates.length
      ? serviceStates.join(", ")
      : "No states configured";
  const items = [
    {
      label: "Questions and sections",
      detail: "Canonical authoring",
      icon: ClipboardList,
      to: CLIENT_TREATMENT_ROUTES.programQuestions(programId),
    },
    {
      label: "Treatment Type",
      detail: treatmentTypeKey,
      icon: Tags,
    },
    {
      label: "Consents",
      detail: `${consentCount} assigned`,
      icon: FileCheck2,
    },
    {
      label: "Products",
      detail: `${productLaneCount} checkout lane${productLaneCount === 1 ? "" : "s"}`,
      icon: PackageSearch,
      to: CLIENT_TREATMENT_ROUTES.products,
    },
    {
      label: "Labs",
      detail: `${labCount} requirement${labCount === 1 ? "" : "s"}`,
      icon: FlaskConical,
      to: CLIENT_TREATMENT_ROUTES.labs,
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          Published Program configuration
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Service area: <strong className="text-slate-700 dark:text-slate-200">{serviceArea}</strong>
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const content = (
            <>
              <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0">
                <strong className="block truncate text-xs text-slate-800 dark:text-slate-100">
                  {item.label}
                </strong>
                <small className="block truncate text-[10px] text-slate-400">
                  {item.detail}
                </small>
              </span>
            </>
          );
          return item.to ? (
            <Link
              key={item.label}
              to={item.to}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {content}
            </Link>
          ) : (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
