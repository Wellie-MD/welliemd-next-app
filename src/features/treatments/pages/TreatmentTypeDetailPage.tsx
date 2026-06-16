import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrototypeNotice, StatusPill } from "../components/common";
import { useTreatmentTypes } from "../hooks/useTreatmentLibraries";
import { TreatmentTypeModal } from "../components/treatment-types/TreatmentTypeModal";

export default function TreatmentTypeDetailPage() {
  const { treatmentTypeKey = "glp_weight_loss" } = useParams();
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const treatmentType = treatmentTypes.find((item) => item.key === treatmentTypeKey) ?? treatmentTypes[0];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!treatmentType) {
    return <div className="p-6">Treatment type not found.</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <Button asChild variant="outline" size="icon" className="shrink-0 h-9 w-9 text-slate-500">
            <Link to="/dashboard/treatments/treatment-types"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Treatment Type</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{treatmentType.name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
              <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Intake:</span>
              <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold border border-slate-200 shadow-sm">{treatmentType.intakeVisitType}</code>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Follow-up:</span>
              <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold border border-slate-200 shadow-sm">{treatmentType.followupVisitType ?? "no-followup"}</code>
              <div className="ml-2">
                <StatusPill tone={treatmentType.isActive ? "green" : "slate"}>{treatmentType.isActive ? "Active" : "Inactive"}</StatusPill>
              </div>
            </div>
          </div>
        </div>
        <Button className="bg-[#12517A] text-white hover:bg-[#12517A]/90" onClick={() => setIsEditModalOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Treatment Type
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Summary label="Eligibility modules" value={treatmentType.programCount} />
        <Summary label="Products" value={treatmentType.productCount} />
        <Summary label="Scoped sections" value={treatmentType.sectionCount} />
        <Summary label="Scoped consents" value={treatmentType.consentCount} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Usage Details</h2>
        </div>
        <div className="p-6 text-sm text-slate-600">
          <p className="mb-4">
            This treatment type binds together clinical programs, products, and consents via its <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">intakeVisitType</code> and <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">followupVisitType</code>.
          </p>
          <PrototypeNotice>
            A full implementation would show data tables listing the specific Programs, Sections, and Consents that reference this Treatment Type.
          </PrototypeNotice>
        </div>
      </div>

      <TreatmentTypeModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        treatmentTypeKey={treatmentType.key}
      />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-full">
      <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
