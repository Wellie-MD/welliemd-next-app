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
  onOpen: (section: CommonSection) => void;
  onPreview: (section: CommonSection) => void;
  onEdit: (section: CommonSection) => void;
  onDelete: (id: string) => void;
}

const scopeTone = (scope: CommonSection["scope"]) => {
  if (scope === "global") return "purple";
  if (scope === "shared") return "blue";
  return "slate";
};

const formatVisitTypeLabel = (section: CommonSection) =>
  section.visitTypeKeys.length > 0 ? section.visitTypeKeys.join(", ") : "All";

const formatDisplayDate = (date: string) => {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${month}/${day}/${year}`;
};

export function SectionListTable({
  sections,
  onOpen,
  onPreview,
  onEdit,
  onDelete,
}: SectionListTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[300px] px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Scope</TableHead>
            <TableHead className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
            <TableHead className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Fields</TableHead>
            <TableHead className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Updated</TableHead>
            <TableHead className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex justify-end">Actions</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <TableRow key={section.id} className="h-[54px] hover:bg-slate-50/60">
              <TableCell className="px-4">
                <button
                  type="button"
                  onClick={() => onOpen(section)}
                  className="text-left text-xs font-semibold text-blue-600 hover:underline"
                  data-testid={`section-open-${section.id}`}
                >
                  {section.name}
                </button>
              </TableCell>
              <TableCell className="px-4">
                <StatusPill tone={scopeTone(section.scope)}>{formatScope(section.scope)}</StatusPill>
              </TableCell>
              <TableCell className="px-4">
                <StatusPill tone="purple">{formatVisitTypeLabel(section)}</StatusPill>
              </TableCell>
              <TableCell className="px-4 text-xs font-medium text-slate-700">{section.fieldCount}</TableCell>
              <TableCell className="px-4 text-xs text-slate-600">{formatDisplayDate(section.updatedAt)}</TableCell>
              <TableCell className="px-4">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Preview"
                    aria-label={`Preview ${section.name}`}
                    onClick={() => onPreview(section)}
                    data-testid={`section-preview-${section.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Edit"
                    aria-label={`Edit ${section.name}`}
                    onClick={() => onEdit(section)}
                    data-testid={`section-edit-${section.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                    aria-label={`Delete ${section.name}`}
                    onClick={() => onDelete(section.id)}
                    data-testid={`section-delete-${section.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
