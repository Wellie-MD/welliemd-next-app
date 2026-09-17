import { useMemo, useState } from "react";
import { RotateCcw, Search, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useConsents, useRestoreConsent } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";

const SCOPE_LABELS: Record<string, string> = {
  global: "Global",
  treatment: "Treatment",
  shared: "Shared",
};

const SCOPE_COLORS: Record<string, string> = {
  global: "bg-blue-50 text-blue-700 border-blue-200",
  treatment: "bg-purple-50 text-purple-700 border-purple-200",
  shared: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function ArchiveConsentsTab() {
  const { toast } = useToast();
  const { data: consents = [], isLoading } = useConsents();
  const restoreConsentMutation = useRestoreConsent();
  const [searchQuery, setSearchQuery] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const archivedConsents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return consents
      .filter((c) => c.isArchived === true)
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (SCOPE_LABELS[c.scope] || c.scope).toLowerCase().includes(q) ||
          c.visitTypeKeys.some((vt) => vt.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [consents, searchQuery]);

  const handleRestore = (id: string, name: string) => {
    setRestoringId(id);
    restoreConsentMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Consent Restored",
          description: `${name} has been restored to the consent forms library.`,
        });
      },
      onError: (error: unknown) => {
        toast({
          title: "Error",
          description:
            (error as any)?.response?.data?.detail ||
            (error as any)?.response?.data?.error ||
            (error as any)?.message ||
            "Failed to restore consent",
          variant: "destructive",
        });
      },
      onSettled: () => setRestoringId(null),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archived consents..."
            className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-lg shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scope</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Types</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Updated</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-slate-500">
                  Loading archived consents...
                </TableCell>
              </TableRow>
            ) : archivedConsents.length > 0 ? (
              archivedConsents.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-900">{consent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        SCOPE_COLORS[consent.scope] || "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {SCOPE_LABELS[consent.scope] || consent.scope}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {consent.visitTypeKeys.length > 0
                      ? consent.visitTypeKeys.join(", ")
                      : "All Visits"}
                  </TableCell>
                  <TableCell className="text-slate-500">{consent.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleRestore(consent.id, consent.name)}
                      disabled={restoringId === consent.id}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-slate-500">
                  {searchQuery
                    ? "No archived consents match your search."
                    : "No archived consents found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
