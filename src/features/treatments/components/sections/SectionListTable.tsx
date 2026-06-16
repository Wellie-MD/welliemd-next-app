import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommonSection } from "../../types";
import { formatScope } from "../../utils/labels";
import { StatusPill } from "../common";

interface SectionListTableProps {
  sections: CommonSection[];
}

export function SectionListTable({ sections }: SectionListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Scope</th>
            <th className="px-4 py-3">Visit Type</th>
            <th className="px-4 py-3">Fields</th>
            <th className="px-4 py-3">Last Updated</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sections.map((section) => (
            <tr key={section.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-950">{section.name}</td>
              <td className="px-4 py-3">
                <StatusPill tone={section.scope === "global" ? "green" : "blue"}>{formatScope(section.scope)}</StatusPill>
              </td>
              <td className="px-4 py-3">{section.visitTypeKeys.length ? section.visitTypeKeys.join(", ") : "All"}</td>
              <td className="px-4 py-3">{section.fieldCount}</td>
              <td className="px-4 py-3">{section.updatedAt}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
