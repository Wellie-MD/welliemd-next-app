import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, Search, ShieldCheck } from "lucide-react";

import {
  getCheckoutReconciliationWorklist,
  resolveCheckoutReconciliation,
  type CheckoutReconciliationCase,
  type CheckoutState,
} from "@/api/checkoutReconciliationApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Permissions } from "@/constants/permissions";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

const stateOptions: Array<{ value: CheckoutState | "all"; label: string }> = [
  { value: "all", label: "All unresolved states" },
  { value: "reconciliation_required", label: "Manual review required" },
  { value: "gateway_processing", label: "Gateway confirmation in progress" },
  { value: "failed_compensating", label: "Cleanup in progress" },
];

const stateLabels: Record<CheckoutState, string> = {
  reconciliation_required: "Manual review required",
  gateway_processing: "Gateway confirmation in progress",
  failed_compensating: "Cleanup in progress",
};

function formatAge(seconds: number) {
  if (seconds < 60) return "Less than a minute";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

function apiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ detail?: string; error?: string }>;
  return axiosError.response?.data?.detail || axiosError.response?.data?.error || fallback;
}

export default function ResolutionQueue() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canResolve = hasPermission(Permissions.ORDER_UPDATE);
  const [cases, setCases] = useState<CheckoutReconciliationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<CheckoutState | "all">("all");
  const [selectedCase, setSelectedCase] = useState<CheckoutReconciliationCase | null>(null);
  const [outcome, setOutcome] = useState<"authorized" | "failed" | "">("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCheckoutReconciliationWorklist(
        stateFilter === "all" ? {} : { checkout_state: stateFilter },
      );
      setCases(data);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not load checkout recovery cases."));
    } finally {
      setLoading(false);
    }
  }, [stateFilter]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const visibleCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cases;
    return cases.filter((item) =>
      [item.reference, item.submission_id, item.failure_code, item.checkout_state]
        .some((value) => String(value || "").toLowerCase().includes(term)),
    );
  }, [cases, search]);

  const reviewCount = cases.filter((item) => item.checkout_state === "reconciliation_required").length;
  const failedCompensationCount = cases.reduce((total, item) => total + item.compensation.failed, 0);

  const openResolveDialog = (item: CheckoutReconciliationCase) => {
    setSelectedCase(item);
    setOutcome("");
    setEvidenceReference("");
    setNote("");
  };

  const handleResolve = async () => {
    if (!selectedCase || !outcome || !evidenceReference.trim()) return;
    setSubmitting(true);
    try {
      const result = await resolveCheckoutReconciliation(selectedCase.reference, {
        confirmed_outcome: outcome,
        evidence_reference: evidenceReference.trim(),
        note: note.trim() || undefined,
      });
      toast({
        title: "Checkout evidence recorded",
        description: `${selectedCase.reference} moved to ${result.checkout_state.replaceAll("_", " ")}.`,
      });
      setSelectedCase(null);
      await loadCases();
    } catch (requestError) {
      toast({
        title: "Checkout was not resolved",
        description: apiErrorMessage(requestError, "The evidence could not be applied."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checkout Recovery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review checkouts whose payment result or cleanup is not yet final. Oldest cases appear first.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadCases()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />Open cases</div>
          <div className="mt-2 text-2xl font-semibold">{cases.length}</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" />Need gateway evidence</div>
          <div className="mt-2 text-2xl font-semibold text-amber-950">{reviewCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" />Failed cleanup steps</div>
          <div className="mt-2 text-2xl font-semibold">{failedCompensationCount}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Resolving a case records a payment provider result that you already verified. It does not charge the patient or create a new authorization.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by support reference, submission, or failure code" className="pl-9" />
        </div>
        <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as CheckoutState | "all")}>
          <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            {stateOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Support reference</TableHead><TableHead>State</TableHead><TableHead>Failure</TableHead><TableHead>Age</TableHead><TableHead>Cleanup</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Loading recovery cases...</TableCell></TableRow>
            ) : visibleCases.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-green-600" />No unresolved checkouts match this view.</TableCell></TableRow>
            ) : visibleCases.map((item) => (
              <TableRow key={item.id}>
                <TableCell><div className="font-medium">{item.reference}</div><div className="max-w-48 truncate text-xs text-muted-foreground" title={item.submission_id}>{item.submission_id}</div></TableCell>
                <TableCell><Badge variant={item.checkout_state === "reconciliation_required" ? "destructive" : "secondary"}>{stateLabels[item.checkout_state]}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{item.failure_code || "—"}</TableCell>
                <TableCell>{formatAge(item.age_seconds)}</TableCell>
                <TableCell><span className={item.compensation.failed ? "font-medium text-red-700" : "text-muted-foreground"}>{item.compensation.succeeded}/{item.compensation.total} complete{item.compensation.failed ? ` · ${item.compensation.failed} failed` : ""}</span></TableCell>
                <TableCell className="text-right">
                  {item.checkout_state === "reconciliation_required" ? <Button size="sm" onClick={() => openResolveDialog(item)} disabled={!canResolve} title={!canResolve ? "Order update permission required" : undefined}>Review evidence</Button> : <span className="text-xs text-muted-foreground">Monitoring</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selectedCase)} onOpenChange={(open) => !open && !submitting && setSelectedCase(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve {selectedCase?.reference}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Check the payment provider first. Choose only the result shown by verified gateway records.</div>
            <div className="space-y-2">
              <Label>Verified gateway outcome</Label>
              <Select value={outcome} onValueChange={(value) => setOutcome(value as "authorized" | "failed")}>
                <SelectTrigger><SelectValue placeholder="Select verified outcome" /></SelectTrigger>
                <SelectContent><SelectItem value="authorized">Authorized — provider confirms a hold exists</SelectItem><SelectItem value="failed">Failed — provider confirms no authorization</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-evidence">Gateway evidence reference</Label>
              <Input id="gateway-evidence" value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} placeholder="Transaction ID, gateway case ID, or audit reference" />
              <p className="text-xs text-muted-foreground">Required for the audit trail. Do not enter card details.</p>
            </div>
            <div className="space-y-2"><Label htmlFor="resolution-note">Internal note (optional)</Label><Textarea id="resolution-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="How the result was verified" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSelectedCase(null)} disabled={submitting}>Cancel</Button><Button onClick={() => void handleResolve()} disabled={submitting || !outcome || !evidenceReference.trim()}>{submitting ? "Recording..." : "Record verified outcome"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
