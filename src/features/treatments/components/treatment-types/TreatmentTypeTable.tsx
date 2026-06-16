import { Link } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreatmentType } from "../../types";
import { StatusPill } from "../common";

interface TreatmentTypeTableProps {
  treatmentTypes: TreatmentType[];
}

export function TreatmentTypeTable({ treatmentTypes }: TreatmentTypeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Intake Visit Type</th>
            <th className="px-4 py-3">Follow-up Visit Type</th>
            <th className="px-4 py-3">Used In</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {treatmentTypes.map((type) => (
            <tr key={type.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-950">
                <Link to={`/dashboard/treatments/treatment-types/${type.key}`}>{type.name}</Link>
              </td>
              <td className="px-4 py-3"><code className="rounded bg-slate-100 px-2 py-1 text-xs">{type.key}</code></td>
              <td className="px-4 py-3">{type.intakeVisitType}</td>
              <td className="px-4 py-3">{type.followupVisitType ?? "Not configured"}</td>
              <td className="px-4 py-3">
                <StatusPill tone="blue">{type.programCount} programs</StatusPill>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/dashboard/treatments/treatment-types/${type.key}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
