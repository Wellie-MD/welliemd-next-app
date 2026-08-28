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
  LabsTable,
  type AssignClient,
  type AssignItem,
} from "@/features/labs";

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
  assignment_id: c.assignment_id,
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
  methods: (c as any).methods,
});

export default function Labs() {
  const navigate = useNavigate();

  const [labs, setLabs] = useState<LabPanel[]>([]);
  const [combinedPanels, setCombinedPanels] = useState<import("@/features/labs/types").CombinedLabPanel[]>([]);
  const [assignmentSummary, setAssignmentSummary] = useState<Record<string, AssignmentSummary>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);


  const [combinedOpen, setCombinedOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [markerOpen, setMarkerOpen] = useState(false);

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
  const [assignMode, setAssignMode] = useState<"single" | "combined">("single");

  const loadData = useCallback(async () => {
    try {
      const [allLabs, allCombined] = await Promise.all([
        labsApi.getLabPanels(),
        labsApi.getCombinedPanels(),
      ]);
      setLabs(allLabs);
      setCombinedPanels(allCombined);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (labs.length === 0) return;
    let cancelled = false;
    (async () => {
      const summary: Record<string, AssignmentSummary> = {};
      for (const lab of labs) {
        if (cancelled) break;
        try {
          const list = await labsApi.getClientsForLabAssignment(lab.id);
          summary[lab.id] = {
            assigned: list.filter(c => c.assigned).length,
            submitted: list.filter(c => c.assigned && (!!c.junction_lab_test_id || ["pending_approval", "active", "inactive", "failed"].includes((c.junction_status || "").toLowerCase()))).length,
            live: list.filter(c => c.assigned && (c.is_orderable || (c.junction_status || "").toLowerCase() === "active")).length,
          };
        } catch {
          /* non-critical */
        }
      }
      if (!cancelled) setAssignmentSummary(summary);
    })();
    return () => { cancelled = true; };
  }, [labs]);

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
            (statusFilter === "Active" && l.is_active) ||
            (statusFilter === "Inactive" && !l.is_active) ||
            (statusFilter === "Pending approval" &&
              (l.junction_status === "pending_approval" || l.junction_status === "Pending")))
        );
      })
      .map(l => l.id);
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

  const refreshAssignClients = async () => {
    const checked = assignItemPool.filter(it => it.checked);
    if (checked.length !== 1) return;
    const list = assignMode === "combined"
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
    setAssignItemPool(assignableLabs.map(l => ({ id: l.id, name: l.name, sub: l.lab_provider || "Lab panel", checked: l.id === lab.id })));
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
    setAssignItemPool(combinedPanels.map(c => ({ id: c.id, name: c.name, sub: `${c.members.length} collection method${c.members.length === 1 ? "" : "s"}`, checked: c.id === combined.id })));
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
    const incompleteLabs = selectedLabs.filter(l => !l.is_assignable);
    if (incompleteLabs.length > 0) {
      toast({
        title: "Configuration in progress",
        description: `Finish configuration before assigning: ${incompleteLabs.map(l => l.name).join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    const assignableLabs = labs.filter(l => l.is_assignable);
    setAssignMode("single");
    setAssignItemPool(assignableLabs.map(l => ({ id: l.id, name: l.name, sub: l.lab_provider || "Lab panel", checked: selectedRowIds.includes(l.id) })));
    setAssignItemSearch("");
    setAssignClientSearch("");
    try {
      const list = await labsApi.getClientsForLabAssignment(selectedRowIds[0]);
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
    const unresolved = selectedClients.filter(c =>
      ((c.lab_account_options?.length ?? 0) > 1 || c.lab_account_state === "ambiguous") &&
      !c.lab_account_id
    );
    if (unresolved.length > 0 && assignMode === "single") {
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
    try {
      for (const item of checkedItems) {
        if (assignMode === "combined") {
          await labsApi.assignCombinedPanelToClients(item.id, clientIds);
        } else {
          await labsApi.assignLabPanelToClients(item.id, clientIds, labAccountSelections);
        }
      }
      setSelectedRowIds([]);
      loadData();
      if (checkedItems.length === 1) {
        const list = assignMode === "combined"
          ? await labsApi.getCombinedPanelClients(checkedItems[0].id)
          : await labsApi.getClientsForLabAssignment(checkedItems[0].id);
        setAssignClients(list.map(toAssignClient));
      } else {
        setAssignOpen(false);
      }
      toast({ title: "Assignments updated." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to assign items.", variant: "destructive" });
    }
  };

  const handleSubmitToJunction = async (client: AssignClient) => {
    if (!client.assignment_id) return;
    setAssignmentActionId(client.assignment_id);
    try {
      const res = await labsApi.submitAssignmentToJunction(client.assignment_id);
      await refreshAssignClients();
      toast({ title: "Submitted to Junction", description: res.message ?? `${client.name}'s panel was submitted.` });
    } catch (e: any) {
      toast({ title: "Junction submission failed", description: e?.response?.data?.message ?? e?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleSyncToTenant = async (client: AssignClient) => {
    if (!client.assignment_id) return;
    setAssignmentActionId(client.assignment_id);
    try {
      const res = await labsApi.syncAssignmentToTenant(client.assignment_id);
      await refreshAssignClients();
      toast({ title: "Client synced", description: res.message ?? `${client.name}'s panel copy was updated.` });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.response?.data?.message ?? e?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleCheckStatus = async (client: AssignClient) => {
    if (!client.assignment_id) return;
    setAssignmentActionId(client.assignment_id);
    try {
      const res = await labsApi.checkAssignmentJunctionStatus(client.assignment_id);
      await refreshAssignClients();
      toast({ title: "Junction status checked", description: res.message ?? `${client.name}'s status synchronized.` });
    } catch (e: any) {
      toast({ title: "Status check failed", description: e?.response?.data?.message ?? e?.response?.data?.detail ?? "Failed.", variant: "destructive" });
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleReplaceSubmission = async (client: AssignClient) => {
    if (!client.assignment_id) return;
    if (!confirm(`Create a replacement Junction submission for ${client.name}?`)) return;
    setAssignmentActionId(client.assignment_id);
    try {
      const res = await labsApi.replaceAssignmentSubmission(client.assignment_id, "Replacement created from admin portal.");
      await refreshAssignClients();
      toast({ title: "Replacement created", description: res.message ?? "Submit the replacement to Junction." });
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
          { label: "Active Labs", value: stats.active },
          { label: "Junction-Synced", value: stats.synced },
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
        onArchive={handleArchive}
        onArchiveCombined={handleArchiveCombined}
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
        onSubmit={handleAssignSubmit}
        onSyncToTenant={handleSyncToTenant}
        onSubmitToJunction={handleSubmitToJunction}
        onCheckStatus={handleCheckStatus}
        onReplaceSubmission={handleReplaceSubmission}
      />

      <LabMarkerDetailModal
        open={markerOpen}
        onOpenChange={setMarkerOpen}
        marker={selectedMarker}
      />
    </div>
  );
}
