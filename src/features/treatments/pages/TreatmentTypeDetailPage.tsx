import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrototypeNotice, StatusPill } from "../components/common";
import { useTreatmentTypes } from "../hooks/useTreatmentLibraries";

export default function TreatmentTypeDetailPage() {
  const { treatmentTypeKey = "glp_weight_loss" } = useParams();
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const treatmentType = treatmentTypes.find((item) => item.key === treatmentTypeKey) ?? treatmentTypes[0];

  if (!treatmentType) {
    return <div className="p-6">Treatment type not found.</div>;
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/treatments/treatment-types"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Treatment Type</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{treatmentType.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <code className="rounded bg-slate-100 px-2 py-1 text-xs">{treatmentType.intakeVisitType}</code>
              <span>/</span>
              <code className="rounded bg-slate-100 px-2 py-1 text-xs">{treatmentType.followupVisitType ?? "no-followup"}</code>
              <StatusPill tone={treatmentType.isActive ? "green" : "slate"}>{treatmentType.isActive ? "Active" : "Inactive"}</StatusPill>
            </div>
          </div>
        </div>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit visit type
        </Button>
      </div>
      <PrototypeNotice>
        Detail must show summary stats, eligibility modules, products, scoped sections, scoped consents, and links back to the relevant library pages.
      </PrototypeNotice>
      <div className="grid gap-4 md:grid-cols-4">
        <Summary label="Eligibility modules" value={treatmentType.programCount} />
        <Summary label="Products" value={treatmentType.productCount} />
        <Summary label="Scoped sections" value={treatmentType.sectionCount} />
        <Summary label="Scoped consents" value={treatmentType.consentCount} />
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
