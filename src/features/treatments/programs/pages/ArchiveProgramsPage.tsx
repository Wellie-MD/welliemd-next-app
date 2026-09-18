import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePrograms, useRestoreProgram } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { formatProgramStage } from "@/features/treatments/utils/labels";
import type { Program } from "@/features/treatments/types";

export default function ArchiveProgramsPage() {
  const { toast } = useToast();
  const { data: programs = [], isLoading } = usePrograms();
  const restoreProgramMutation = useRestoreProgram();
  const [searchQuery, setSearchQuery] = useState("");
  const [restoringProgramId, setRestoringProgramId] = useState<string | null>(null);

  const archivedPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return programs
      .filter((program) => program.status === "archived")
      .filter((program) => {
        if (!q) return true;
        return (
          program.name.toLowerCase().includes(q) ||
          program.treatmentTypeKey.toLowerCase().includes(q) ||
          program.visitType.toLowerCase().includes(q) ||
          (program.description || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [programs, searchQuery]);

  const handleRestore = (program: Program) => {
    setRestoringProgramId(program.id);
    restoreProgramMutation.mutate(program.id, {
      onSuccess: (restored) => {
        toast({
          title: "Program Restored",
          description: `${restored.name} has been restored as a draft.`,
        });
      },
      onError: (error: unknown) => {
        toast({
          title: "Error",
          description:
            (error as any)?.response?.data?.detail ||
            (error as any)?.response?.data?.error ||
            (error as any)?.message ||
            "Failed to restore program",
          variant: "destructive",
        });
      },
      onSettled: () => setRestoringProgramId(null),
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Archive Programs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Restore archived clinical programs back to draft status.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search archived programs..."
            className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-lg shadow-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[300px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Treatment Type</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Questions</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-slate-500">
                  Loading archived programs...
                </TableCell>
              </TableRow>
            ) : archivedPrograms.length > 0 ? (
              archivedPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">
                    <div className="text-slate-900">{program.name}</div>
                    <div className="text-xs text-slate-500 font-normal mt-1">
                      {program.description || "Clinical questionnaire"}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{formatProgramStage(program.stage)}</TableCell>
                  <TableCell className="text-slate-600">{program.treatmentTypeKey}</TableCell>
                  <TableCell>
                    <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 font-medium">
                      {program.visitType}
                    </code>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {(program.questionCount || 0) + (program.checkoutQuestionCount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                      archived
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleRestore(program)}
                      disabled={restoringProgramId === program.id}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-slate-500">
                  {searchQuery ? "No archived programs match your search." : "No archived programs found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
