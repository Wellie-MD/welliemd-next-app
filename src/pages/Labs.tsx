import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Plus, UserPlus } from "lucide-react";
import { labsApi, type ClientAssignment, type LabPanel } from "@/api/labs";
import {
  LabCombinedModal,
  LabEditModal,
  LabAssignModal,
  LabMarkerDetailModal,
  LabChangeHistoryModal,
  LabsTable,
  type AssignClient,
  type AssignItem,
} from "@/features/labs";
import { isPendingJunctionStatus } from "@/features/labs/utils";

type StatusFilter = "All" | "Active" | "Pending approval" | "Inactive";
type AssignmentSummary = { assigned: number; submitted: number; live: number };

interface EditFormState {
  cost_to_client: number;
  cost_to_welliemd: number;
  is_active: boolean;
  service_states: string[];
}

const toAssignClient = (c: ClientAssignment): AssignClient => ({
  id: (c as any).client_id || c.id,
  name: (c as any).client_name || c.name,
  email: (c as any).client_email || c.email || "",
  checked: c.assigned,
  assignment_id: c.assignment_id || c.assignment_ids?.[0] || null,
  assignment_ids: c.assignment_ids || [],
  junction_lab_test_id: c.junction_lab_test_id,
  junction_status: c.junction_status,
  junction_external_status: c.junction_external_status,
  operational_status: c.operational_status,
  is_orderable: c.is_orderable,
  lab_account_id: c.lab_account_id,
  lab_account_state: c.lab_account_state,
  lab_account_options: c.lab_account_options,
  linkedLabAccountIds: c.linkedLabAccountIds,
  client_configuration_ready: c.client_configuration_ready,
  submission_ready: c.submission_ready,
  blocking_reason: c.blocking_reason,
  patient_price_configured: c.patient_price_configured,
  service_state_options: c.service_state_options,
  sync_status: c.sync_status,
  sync_attempt_count: c.sync_attempt_count,
  sync_error: c.sync_error,
  sync_correlation_id: c.sync_correlation_id,
  last_synced_at: c.last_synced_at,
  methods: c.methods,
});

const getPendingJunctionSubmissionIds = (client: AssignClient): string[] => {
  const methods = client.methods ?? [];
  if (methods.length > 0) {
    return methods
      .filter(method => method.submission_ready === true && !method.junction_lab_test_id)
      .map(method => String(method.assignment_id || ""))
      .filter(Boolean);
  }
  if (!client.submission_ready || client.junction_lab_test_id) return [];
  return client.assignment_ids?.length
    ? client.assignment_ids
    : client.assignment_id
      ? [client.assignment_id]
      : [];
};

export default function Labs() {
  const navigate = useNavigate();

  const [labs, setLabs] = useState<LabPanel[]>([]);
  const [combinedPanels, setCombinedPanels] = useState<import("@/features/labs/types").CombinedLabPanel[]>([]);
  const [assignmentSummary, setAssignmentSummary] = useState<Record<string, AssignmentSummary>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);


  const [combinedOpen, setCombinedOpen] = useState(false);
  const [combinedEditOpen, setCombinedEditOpen] = useState(false);
  const [selectedCombinedPanel, setSelectedCombinedPanel] = useState<import("@/features/labs/types").CombinedLabPanel | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [markerOpen, setMarkerOpen] = useState(false);
  const [changeHistoryOpen, setChangeHistoryOpen] = useState(false);
  const [changeHistoryLab, setChangeHistoryLab] = useState<LabPanel | null>(null);
  const [changeHistoryData, setChangeHistoryData] = useState<import("@/api/labs").LabChangeHistoryResponse | null>(null);
  const [changeHistoryLoading, setChangeHistoryLoading] = useState(false);
  const [changeHistoryError, setChangeHistoryError] = useState<string | null>(null);
  const [changeHistoryFilter, setChangeHistoryFilter] = useState<"all" | import("@/api/labs").LabChangeAction>("all");

  const [selectedLab, setSelectedLab] = useState<LabPanel | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<import("@/api/labs").Biomarker | null>(null);

  const [editForm, setEditForm] = useState<EditFormState>({
    cost_to_client: 0,
    cost_to_welliemd: 0,
    is_active: true,
    service_states: [],
  });

  const [assignItemPool, setAssignItemPool] = useState<AssignItem[]>([]);
  const [assignClients, setAssignClients] = useState<AssignClient[]>([]);
  const [assignItemSearch, setAssignItemSearch] = useState("");
  const [assignClientSearch, setAssignClientSearch] = useState("");
  const [assignmentActionId, setAssignmentActionId] = useState<string | null>(null);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignMode, setAssignMode] = useState<"single" | "combined">("single");

  const loadData = useCallback(async () => {
    try {
      const [allLabs, allCombined, summaries] = await Promise.all([
        labsApi.getLabPanels(),
        labsApi.getCombinedPanels(),
        labsApi.getAssignmentSummaries(),
      ]);
      setLabs(allLabs);
      setCombinedPanels(allCombined);
      setAssignmentSummary(summaries);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => ({
    total: labs.length + combinedPanels.filter(c => !c.is_archived).length,
    active: labs.filter(l => (assignmentSummary[l.id]?.live ?? 0) > 0).length,
    synced: labs.filter(l => (assignmentSummary[l.id]?.submitted ?? 0) > 0).length,
  }), [labs, combinedPanels, assignmentSummary]);



  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRowIds(prev =>
      checked ? [...prev, id] : prev.filter(x => x !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    const visibleIds = labs
      .filter(l => {
        const q = search.toLowerCase();
        return (
          (!q || l.name.toLowerCase().includes(q) || l.lab_provider.toLowerCase().includes(q)) &&
          (statusFilter === "All" ||
            (statusFilter === "Active" && (assignmentSummary[l.id]?.live ?? 0) > 0) ||
            (statusFilter === "Inactive" && (assignmentSummary[l.id]?.live ?? 0) === 0) ||
            (statusFilter === "Pending approval" && isPendingJunctionStatus(l.junction_status)))
        );
      })
      .map(l => l.id);
    const q = search.toLowerCase();
    const visibleCombinedIds = combinedPanels
      .filter(c => {
        if (c.is_archived) return false;
        const providers = c.members.map(member => member.lab_provider).join(" ").toLowerCase();
        if (q && !c.name.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q) && !providers.includes(q)) return false;
        if (statusFilter === "Active") return c.is_active && c.is_assignable;
        if (statusFilter === "Pending approval") return c.configuration_status !== "ready_to_assign";
        if (statusFilter === "Inactive") return !c.is_active;
        return true;
      })
      .map(c => c.id);
    visibleIds.push(...visibleCombinedIds);
    setSelectedRowIds(prev =>
      checked
        ? Array.from(new Set([...prev, ...visibleIds]))
        : prev.filter(id => !visibleIds.includes(id)),
    );
  };



  const handleEditOpen = (lab: LabPanel) => {
    setSelectedLab(lab);
    setEditForm({
      cost_to_client: lab.cost_to_client,
      cost_to_welliemd: lab.cost_to_welliemd,
      is_active: lab.is_active,
      service_states: lab.service_states ?? [],
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;
    try {
      await labsApi.updateLabPanel(selectedLab.id, editForm);
      setEditOpen(false);
      loadData();
      toast({ title: "Lab panel saved." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to update lab panel.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (lab: LabPanel) => {
    try {
      await labsApi.updateLabPanel(lab.id, { is_active: !lab.is_active });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchive = async (lab: LabPanel) => {
    if (
      !confirm(
        `Archive "${lab.name}"? This removes it from the storefront and marks all assignments inactive. Active orders will NOT be affected.`,
      )
    ) return;
    try {
      await labsApi.archiveLabPanel(lab.id);
      loadData();
      toast({ title: "Lab Archived", description: `"${lab.name}" has been archived.` });
    } catch (e: any) {
      toast({
        title: "Archive Failed",
        description: e?.response?.data?.detail ?? "Failed to archive lab panel.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveCombined = async (combined: import("@/features/labs/types").CombinedLabPanel) => {
    if (!confirm(`Archive combined panel "${combined.name}"? All linked client assignments will be deactivated.`)) return;
    try {
      await labsApi.archiveCombinedPanel(combined.id);
      loadData();
      toast({ title: "Combined Panel Archived", description: `"${combined.name}" has been archived.` });
    } catch (e: any) {
      toast({
        title: "Archive Failed",
        description: e?.response?.data?.detail ?? "Failed to archive combined panel.",
        variant: "destructive",
      });
    }
  };

  const handleEditOpenCombined = (combined: import("@/features/labs/types").CombinedLabPanel) => {
    setSelectedCombinedPanel(combined);
    setCombinedEditOpen(true);
  };

  const fetchChangeHistory = async (lab: LabPanel, filter: "all" | import("@/api/labs").LabChangeAction = "all") => {
    setChangeHistoryLoading(true);
    setChangeHistoryError(null);
    try {
      const data = await labsApi.getPanelChangeHistory(lab.id, filter);
      setChangeHistoryData(data);
    } catch (err: any) {
      setChangeHistoryError(err?.response?.data?.detail ?? "Failed to load change history.");
    } finally {
      setChangeHistoryLoading(false);
    }
  };

  const handleViewChangeHistory = (lab: LabPanel) => {
    setChangeHistoryLab(lab);
    setChangeHistoryFilter("all");
    setChangeHistoryOpen(true);
    fetchChangeHistory(lab, "all");
  };

  const handleHistoryFilterChange = (filter: "all" | import("@/api/labs").LabChangeAction) => {
    setChangeHistoryFilter(filter);
    if (changeHistoryLab) {
      fetchChangeHistory(changeHistoryLab, filter);
    }
  };

  const refreshAssignClients = async () => {
    const checked = assignItemPool.filter(it => it.checked);
    if (checked.length !== 1) return;
    const list = checked[0].kind === "combined"
      ? await labsApi.getCombinedPanelClients(checked[0].id)
      : await labsApi.getClientsForLabAssignment(checked[0].id);
    setAssignClients(list.map(toAssignClient));
  };

  const handleAssignOpenSingle = async (lab: LabPanel) => {
    if (!lab.is_assignable) {
      toast({
        title: "Configuration in progress",
        description: `Complete this panel before assigning. Missing: ${(lab.configuration_missing || []).join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    const assignableLabs = labs.filter(l => l.is_assignable);
    setAssignMode("single");
    setAssignItemPool(assignableLabs.map(l => ({ id: l.id, name: l.name, sub: l.lab_provider || "Lab panel", checked: l.id === lab.id, kind: "single" as const })));
    setAssignItemSearch("");
    setAssignClientSearch("");
    try {
      const list = await labsApi.getClientsForLabAssignment(lab.id);
      setAssignClients(list.map(toAssignClient));
      setAssignOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleAssignOpenCombined = async (combined: import("@/features/labs/types").CombinedLabPanel) => {
    setAssignMode("combined");
    setAssignItemPool(combinedPanels.filter(c => c.is_assignable).map(c => ({ id: c.id, name: c.name, sub: `${c.members.length} collection method${c.members.length === 1 ? "" : "s"}`, checked: c.id === combined.id, kind: "combined" as const })));
    setAssignItemSearch("");
    setAssignClientSearch("");
    try {
      const list = await labsApi.getCombinedPanelClients(combined.id);
      setAssignClients(list.map(toAssignClient));
      setAssignOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleAssignOpenMultiple = async () => {
    if (selectedRowIds.length === 0) {
      toast({ title: "Selection Required", description: "Select one or more lab panels first.", variant: "destructive" });
      return;
    }
    const selectedLabs = labs.filter(l => selectedRowIds.includes(l.id));
    const selectedCombined = combinedPanels.filter(c => selectedRowIds.includes(c.id));
    const incompleteLabs = selectedLabs.filter(l => !l.is_assignable).map(l => l.name);
    const incompleteCombined = selectedCombined.filter(c => !c.is_assignable).map(c => c.name);
    if (incompleteLabs.length > 0 || incompleteCombined.length > 0) {
      toast({
        title: "Configuration in progress",
        description: `Finish configuration before assigning: ${[...incompleteLabs, ...incompleteCombined].join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    const assignableLabs = labs.filter(l => l.is_assignable);
    const assignableCombined = combinedPanels.filter(c => c.is_assignable);
    const pool: AssignItem[] = [
      ...assignableLabs.map(l => ({ id: l.id, name: l.name, sub: l.lab_provider || "Lab panel", checked: selectedRowIds.includes(l.id), kind: "single" as const })),
      ...assignableCombined.map(c => ({ id: c.id, name: c.name, sub: `${c.members.length} collection method${c.members.length === 1 ? "" : "s"}`, checked: selectedRowIds.includes(c.id), kind: "combined" as const })),
    ];
    const firstSelected = pool.find(item => item.checked);
    setAssignMode(firstSelected?.kind === "combined" ? "combined" : "single");
    setAssignItemPool(pool);
    setAssignItemSearch("");
    setAssignClientSearch("");
    try {
      const list = firstSelected?.kind === "combined"
        ? await labsApi.getCombinedPanelClients(firstSelected.id)
        : await labsApi.getClientsForLabAssignment(firstSelected?.id || selectedRowIds[0]);
      setAssignClients(list.map(toAssignClient));
      setAssignOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleAssignSubmit = async () => {
    const checkedItems = assignItemPool.filter(it => it.checked);
    if (checkedItems.length === 0) {
      toast({ title: "Validation Error", description: "Select at least one lab panel on the left.", variant: "destructive" });
      return;
    }
    const selectedClients = assignClients.filter(c => c.checked);
    const hasSingleSelection = checkedItems.some(item => item.kind === "single");
    const unresolved = selectedClients.filter(c =>
      ((c.lab_account_options?.length ?? 0) > 1 || c.lab_account_state === "ambiguous") &&
      !c.lab_account_id
    );
    if (unresolved.length > 0 && hasSingleSelection) {
      toast({
        title: "Lab account selection required",
        description: `Select a Junction lab account for ${unresolved[0].name} before assigning.`,
        variant: "destructive",
      });
      return;
    }
    const clientIds = selectedClients.map(c => c.id);
    const labAccountSelections = Object.fromEntries(
      selectedClients
        .filter(c => c.lab_account_id)
        .map(c => [c.id, c.lab_account_id as string])
    );
    setAssignmentSubmitting(true);
    try {
      for (const item of checkedItems) {
        if (item.kind === "combined") {
          // The backend creates one logical offering and performs one grouped
          // sync. Individual member assignment sync would split the offering
          // and can never represent the Combined Lab correctly.
          await labsApi.assignCombinedPanelToClients(item.id, clientIds);
        } else {
          await labsApi.assignLabPanelToClients(item.id, clientIds, labAccountSelections);
        }
      }
      setSelectedRowIds([]);
      loadData();
      if (checkedItems.length === 1) {
        const list = checkedItems[0].kind === "combined"
          ? await labsApi.getCombinedPanelClients(checkedItems[0].id)
          : await labsApi.getClientsForLabAssignment(checkedItems[0].id);
        setAssignClients(list.map(toAssignClient));
      } else {
        setAssignOpen(false);
      }
      toast({
        title: "Assignments updated.",
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to assign items.", variant: "destructive" });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleSubmitToJunction = async (client: AssignClient) => {
    const assignmentIds = getPendingJunctionSubmissionIds(client);
    if (assignmentIds.length === 0) return;
    setAssignmentActionId(assignmentIds[0]);
    try {
      const responses = [];
      for (const assignmentId of assignmentIds) {
        responses.push(await labsApi.submitAssignmentToJunction(assignmentId));
      }
      await refreshAssignClients();
      toast({ title: "Submitted to Junction", description: responses[0]?.message ?? `${client.name}'s panel was submitted.` });
    } catch (e: any) {
      toast({ title: "Junction submission failed", description: e?.response?.data?.message ?? e?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleSyncToTenant = async (client: AssignClient) => {
    const assignmentIds = client.assignment_ids?.length ? client.assignment_ids : client.assignment_id ? [client.assignment_id] : [];
    if (assignmentIds.length === 0) return;
    setAssignmentActionId(assignmentIds[0]);
    try {
      const responses = [];
      for (const assignmentId of assignmentIds) {
        responses.push(await labsApi.syncAssignmentToTenant(assignmentId));
      }
      await refreshAssignClients();
      toast({ title: "Client synced", description: responses[0]?.message ?? `${client.name}'s panel copy was updated.` });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.response?.data?.message ?? e?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleCheckStatus = async (client: AssignClient) => {
    const assignmentIds = client.assignment_ids?.length ? client.assignment_ids : client.assignment_id ? [client.assignment_id] : [];
    if (assignmentIds.length === 0) return;
    setAssignmentActionId(assignmentIds[0]);
    try {
      const responses = [];
      for (const assignmentId of assignmentIds) {
        responses.push(await labsApi.checkAssignmentJunctionStatus(assignmentId));
      }
      await refreshAssignClients();
      toast({ title: "Junction status checked", description: responses[0]?.message ?? `${client.name}'s status synchronized.` });
    } catch (e: any) {
      toast({ title: "Status check failed", description: e?.response?.data?.message ?? e?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleReplaceSubmission = async (client: AssignClient) => {
    const assignmentIds = client.assignment_ids?.length ? client.assignment_ids : client.assignment_id ? [client.assignment_id] : [];
    if (assignmentIds.length === 0) return;
    if (!confirm(`Create a replacement Junction submission for ${client.name}?`)) return;
    setAssignmentActionId(assignmentIds[0]);
    try {
      const responses = [];
      for (const assignmentId of assignmentIds) {
        responses.push(await labsApi.replaceAssignmentSubmission(assignmentId, "Replacement created from admin portal."));
      }
      await refreshAssignClients();
      toast({ title: "Replacement created", description: responses[0]?.message ?? "Submit the replacement to Junction." });
    } catch (e: any) {
      toast({ title: "Replacement failed", description: e?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setAssignmentActionId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Labs</h1>
            <span className="inline-flex items-center gap-1 border bg-sky-50 px-2.5 py-0.5 rounded-full border-sky-100/60 text-[10.5px] font-semibold text-sky-800 shadow-sm">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="inline">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="12" r="3" />
                <line x1="9" y1="12" x2="15" y2="12" />
              </svg>
              via Junction
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Diagnostic tests and panels ordered as part of custom forms. All lab orders
            route through Junction to the underlying provider (Quest, LabCorp, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleAssignOpenMultiple}
            className="border border-input bg-background hover:bg-muted font-semibold text-xs h-9 inline-flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Assign to Clients
          </Button>

          <Button
            variant="outline"
            onClick={() => setCombinedOpen(true)}
            className="border border-input bg-background hover:bg-muted font-semibold text-xs h-9 inline-flex items-center gap-1.5"
          >
            Create combined panel
          </Button>

          <Button
            onClick={() => navigate("/dashboard/products/labs/catalog?create=1")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 inline-flex items-center gap-1 px-4"
          >
            <Plus className="h-4 w-4" />
            Create Lab Panel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Labs", value: stats.total },
          { label: "Live for Clients", value: stats.active },
          { label: "Submitted to Junction", value: stats.synced },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border/60 rounded-xl px-[18px] py-[14px] flex flex-col justify-between shadow-sm min-h-[90px]">
            <span className="text-[11.5px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
            <span className="text-2xl font-semibold font-mono text-foreground mt-2">{value}</span>
          </div>
        ))}
      </div>

      <LabsTable
        labs={labs}
        combinedPanels={combinedPanels}
        assignmentSummary={assignmentSummary}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedRowIds={selectedRowIds}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        onToggleActive={handleToggleActive}
        onEditOpen={handleEditOpen}
        onAssignOpenSingle={handleAssignOpenSingle}
        onAssignOpenCombined={handleAssignOpenCombined}
        onEditOpenCombined={handleEditOpenCombined}
        onArchive={handleArchive}
        onArchiveCombined={handleArchiveCombined}
        onViewChangeHistory={handleViewChangeHistory}
      />



      <LabCombinedModal
        open={combinedOpen}
        onOpenChange={setCombinedOpen}
        labs={labs}
        onCreated={() => {
          loadData();
          toast({ title: "Combined panel created." });
        }}
      />

      <LabCombinedModal
        open={combinedEditOpen}
        onOpenChange={setCombinedEditOpen}
        labs={labs}
        initialPanel={selectedCombinedPanel}
        onCreated={() => undefined}
        onUpdated={() => {
          loadData();
          toast({ title: "Combined panel saved." });
        }}
      />

      <LabEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        selectedLab={selectedLab}
        editForm={editForm}
        onEditFormChange={setEditForm}
        onSubmit={handleEditSubmit}
        onMarkerClick={marker => { setSelectedMarker(marker); setMarkerOpen(true); }}
      />

      <LabAssignModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assignItemPool={assignItemPool}
        onAssignItemPoolChange={setAssignItemPool}
        assignClients={assignClients}
        onAssignClientsChange={setAssignClients}
        itemSearch={assignItemSearch}
        onItemSearchChange={setAssignItemSearch}
        clientSearch={assignClientSearch}
        onClientSearchChange={setAssignClientSearch}
        assignmentActionId={assignmentActionId}
        isSubmitting={assignmentSubmitting}
        showJunctionActions={assignMode === "single"}
        onSubmit={handleAssignSubmit}
        {...(assignMode === "single" ? {
          onSyncToTenant: handleSyncToTenant,
          onSubmitToJunction: handleSubmitToJunction,
          onCheckStatus: handleCheckStatus,
          onReplaceSubmission: handleReplaceSubmission,
        } : {})}
      />

      <LabMarkerDetailModal
        open={markerOpen}
        onOpenChange={setMarkerOpen}
        marker={selectedMarker}
      />

      <LabChangeHistoryModal
        open={changeHistoryOpen}
        onOpenChange={setChangeHistoryOpen}
        recordName={changeHistoryLab?.name ?? ""}
        recordType="lab"
        history={changeHistoryData}
        loading={changeHistoryLoading}
        error={changeHistoryError}
        filter={changeHistoryFilter}
        onFilterChange={handleHistoryFilterChange}
      />
    </div>
  );
}
