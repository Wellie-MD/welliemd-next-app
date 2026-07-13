import { Archive, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsentForm } from "@/features/treatments/types";
import { formatDateUS, formatScope } from "@/features/treatments/utils/labels";
import { StatusPill } from "@/features/treatments/common/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ConsentListTableProps {
  consents: ConsentForm[];
  onEdit?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  onPatientPreview?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function ConsentListTable({ consents, onEdit, onViewDetail, onPatientPreview, onDelete, onArchive }: ConsentListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[300px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scope</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Updated</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consents.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                No consent forms match your filters.
              </TableCell>
            </TableRow>
          )}
          {consents.map((consent) => (
            <TableRow key={consent.id} className="group hover:bg-slate-50/50">
              <TableCell className="font-medium">
                <div className="text-slate-900 cursor-pointer hover:text-[#12517A] hover:underline" onClick={() => onViewDetail?.(consent.id)}>
                  {consent.name}
                </div>
                <div className="text-xs text-slate-500 font-normal mt-1">
                  Legal consent document
                </div>
              </TableCell>
              <TableCell>
                <StatusPill tone={consent.scope === "global" ? "green" : "blue"}>{formatScope(consent.scope)}</StatusPill>
              </TableCell>
              <TableCell>
                {consent.visitTypeKeys.length ? (
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                    {consent.visitTypeKeys.join(" · ")}
                  </code>
                ) : (
                  <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">All</span>
                )}
              </TableCell>
              <TableCell className="text-slate-500 text-xs">{formatDateUS(consent.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Preview" onClick={() => onPatientPreview?.(consent.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Edit" onClick={() => onEdit?.(consent.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {onArchive && !consent.isArchived && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600" title="Archive" onClick={() => onArchive(consent.id)}>
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" title="Delete" onClick={() => onDelete(consent.id)}>
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
