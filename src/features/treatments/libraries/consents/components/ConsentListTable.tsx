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
            <TableHead className="w-[300px] px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Scope</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
            <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Last Updated</TableHead>
            <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
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
              <TableCell className="px-4 font-medium">
                <div className="text-slate-900 cursor-pointer hover:text-blue-600 hover:underline" onClick={() => onViewDetail?.(consent.id)}>
                  {consent.name}
                </div>
                <div className="text-xs text-slate-500 font-normal mt-1">
                  Legal consent document
                </div>
              </TableCell>
              <TableCell className="px-4">
                <StatusPill tone={consent.scope === "global" ? "purple" : "pink"}>{formatScope(consent.scope)}</StatusPill>
              </TableCell>
              <TableCell className="px-4">
                {consent.visitTypeKeys.length ? (
                  <div className="flex flex-wrap gap-1">
                    {consent.visitTypeKeys.map((key) => (
                      <code
                        key={key}
                        className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {key}
                      </code>
                    ))}
                  </div>
                ) : (
                  <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">All</span>
                )}
              </TableCell>
              <TableCell className="px-4 text-slate-500 text-xs">{formatDateUS(consent.updatedAt)}</TableCell>
              <TableCell className="px-4 text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Preview" onClick={() => onPatientPreview?.(consent.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Edit" onClick={() => onEdit?.(consent.id)}>
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
