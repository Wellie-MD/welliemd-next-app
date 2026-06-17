import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommonSection } from "@/features/treatments/types";
import { formatScope } from "@/features/treatments/utils/labels";
import { StatusPill } from "@/features/treatments/common/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SectionListTableProps {
  sections: CommonSection[];
  onEdit?: (section: CommonSection) => void;
  onDelete?: (id: string) => void;
}

export function SectionListTable({ sections, onEdit, onDelete }: SectionListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[300px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scope</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fields</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Updated</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <TableRow key={section.id} className="group hover:bg-slate-50/50">
              <TableCell className="font-medium">
                <div
                  className="text-slate-900 cursor-pointer hover:text-[#12517A] hover:underline"
                  onClick={() => onEdit?.(section)}
                >
                  {section.name}
                </div>
                <div className="text-xs text-slate-500 font-normal mt-1">
                  {section.description || "Common section block"}
                </div>
              </TableCell>
              <TableCell>
                <StatusPill tone={section.scope === "global" ? "green" : "blue"}>{formatScope(section.scope)}</StatusPill>
              </TableCell>
              <TableCell>
                {section.visitTypeKeys.length ? (
                  <div className="flex flex-wrap gap-1">
                    {section.visitTypeKeys.map((key) => (
                      <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 font-medium">
                        {key}
                      </code>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm">All</span>
                )}
              </TableCell>
              <TableCell className="text-slate-600">{section.fieldCount}</TableCell>
              <TableCell className="text-slate-500 text-xs">{section.updatedAt}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Edit" onClick={() => onEdit(section)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" title="Delete" onClick={() => onDelete(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
