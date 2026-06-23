/**
 * Labs page — admin lab panel management.
 *
 * This file is intentionally slim: all state and UI live in focused
 * feature components under src/features/labs/.
 *
 * Component map:
 *   LabsTable          — filter bar + data table
 *   LabCreateModal     — Create Lab Panel dialog
 *   LabEditModal       — Lab Test Details / edit dialog
 *   LabAssignModal     — Assign to Clients two-pane dialog
 *   LabMarkerDetailModal — Biomarker detail popup
 */
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Settings, UserPlus } from "lucide-react";
import { labsApi, type Biomarker, type CatalogLab, type ClientAssignment, type LabPanel } from "@/api/labs";
import {
  LabCreateModal,
  LabEditModal,
  LabAssignModal,
  LabMarkerDetailModal,
  LabsTable,
  type AssignClient,
  type AssignItem,
  type CreateFormState,
  INITIAL_CREATE_FORM,
} from "@/features/labs";

// ── types ────────────────────────────────────────────────────────────────────

type StatusFilter = "All" | "Active" | "Pending approval" | "Inactive";

interface EditFormState {
  cost_to_client: number;
  cost_to_welliemd: number;
  is_active: boolean;
  service_states: string[];
}

// ── helpers ───────────────────────────────────────────────────────────────────

const toAssignClient = (c: ClientAssignment): AssignClient => ({
  id: c.id,
  name: c.name,
  email: c.email,
  checked: c.assigned,
  assignment_id: c.assignment_id,
  junction_lab_test_id: c.junction_lab_test_id,
  junction_status: c.junction_status,
  junction_external_status: c.junction_external_status,
  operational_status: c.operational_status,
  is_orderable: c.is_orderable,
  linkedLabAccountIds: c.linkedLabAccountIds,
});

// ── component ─────────────────────────────────────────────────────────────────

export default function Labs() {
  const navigate = useNavigate();

  // ── data ──
  const [labs, setLabs] = useState<LabPanel[]>([]);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [catalogLabs, setCatalogLabs] = useState<CatalogLab[]>([]);
  const [assignmentsCount, setAssignmentsCount] = useState<Record<string, number>>({});

  // ── table state ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // ── modal visibility ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [markerOpen, setMarkerOpen] = useState(false);

  // ── modal data ──
  const [selectedLab, setSelectedLab] = useState<LabPanel | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Biomarker | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_CREATE_FORM);
  const [createMarkerSearch, setCreateMarkerSearch] = useState("");
  const [editForm, setEditForm] = useState<EditFormState>({
    cost_to_client: 0,
    cost_to_welliemd: 0,
    is_active: true,
    service_states: [],
  });

  // ── assign modal state ──
  const [assignItemPool, setAssignItemPool] = useState<AssignItem[]>([]);
  const [assignClients, setAssignClients] = useState<AssignClient[]>([]);
  const [assignItemSearch, setAssignItemSearch] = useState("");
  const [assignClientSearch, setAssignClientSearch] = useState("");
  const [assignmentActionId, setAssignmentActionId] = useState<string | null>(null);

  // ── data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [allLabs, allMarkers, allCatalogLabs] = await Promise.all([
        labsApi.getLabPanels(),
        labsApi.getBiomarkers(),
        labsApi.getCatalogLabs(),
      ]);
      setLabs(allLabs);
      setBiomarkers(allMarkers);
      setCatalogLabs(allCatalogLabs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lazy-load assignment counts after labs arrive
  useEffect(() => {
    if (labs.length === 0) return;
    let cancelled = false;
    (async () => {
      const counts: Record<string, number> = {};
      for (const lab of labs) {
        if (cancelled) break;
        try {
          const list = await labsApi.getClientsForLabAssignment(lab.id);
          counts[lab.id] = list.filter(c => c.assigned).length;
        } catch {
          /* non-critical */
        }
      }
      if (!cancelled) setAssignmentsCount(counts);
    })();
    return () => { cancelled = true; };
  }, [labs]);

  // ── stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: labs.length,
    active: labs.filter(l => l.is_active).length,
    synced: labs.filter(l =>
      l.junction_status === "active" || l.junction_status === "Active"
    ).length,
  }), [labs]);

  // ── grouped biomarkers for create modal ───────────────────────────────────

  const createModalGroupedBiomarkers = useMemo(() => {
    if (!createForm.lab_provider_id) return [];
    const q = createMarkerSearch.toLowerCase().trim();
    const filtered = biomarkers.filter(bm => {
      const matchesLab = bm.lab_id === createForm.lab_provider_id;
      if (!matchesLab) return false;
      if (!q) return true;
      return (
        bm.name.toLowerCase().includes(q) ||
        (bm.provider_id ?? "").toLowerCase().includes(q) ||
        (bm.slug ?? "").toLowerCase().includes(q) ||
        bm.code.toLowerCase().includes(q)
      );
    });
    const groups: { category: string; items: Biomarker[] }[] = [];
    for (const bm of filtered) {
      let g = groups.find(c => c.category === bm.category);
      if (!g) { g = { category: bm.category, items: [] }; groups.push(g); }
      g.items.push(bm);
    }
    return groups;
  }, [biomarkers, createForm.lab_provider_id, createMarkerSearch]);

  // ── table row selection ───────────────────────────────────────────────────

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

  // ── create handler ────────────────────────────────────────────────────────

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.lab_provider_id || !createForm.lab_provider) {
      toast({ title: "Validation Error", description: "Please choose a lab provider first.", variant: "destructive" });
      return;
    }
    try {
      const selectedBiomarkers = biomarkers.filter(bm => createForm.biomarkers.includes(bm.id));
      await labsApi.createLabPanel({
        name: createForm.name,
        description: createForm.description,
        lab_provider: createForm.lab_provider,
        fasting_required: createForm.fasting_required,
        collection_method: createForm.collection_method,
        cost_to_client: createForm.cost_to_client,
        cost_to_welliemd: createForm.cost_to_welliemd,
        is_active: createForm.is_active,
        service_states: createForm.service_states,
        biomarkers: selectedBiomarkers,
      });
      setCreateOpen(false);
      setCreateForm(INITIAL_CREATE_FORM);
      setCreateMarkerSearch("");
      loadData();
      toast({ title: "Lab panel created", description: "Submit it to Junction from each client assignment." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to create lab panel.", variant: "destructive" });
    }
  };

  // ── edit handler ──────────────────────────────────────────────────────────

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

  // ── toggle active ─────────────────────────────────────────────────────────

  const handleToggleActive = async (lab: LabPanel) => {
    try {
      await labsApi.updateLabPanel(lab.id, { is_active: !lab.is_active });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // ── archive ────────────────────────────────────────────────────────────────

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

  // ── assign helpers ────────────────────────────────────────────────────────

  const refreshAssignClients = async () => {
    const checked = assignItemPool.filter(it => it.checked);
    if (checked.length !== 1) return;
    const list = await labsApi.getClientsForLabAssignment(checked[0].id);
    setAssignClients(list.map(toAssignClient));
  };

  const handleAssignOpenSingle = async (lab: LabPanel) => {
    setAssignItemPool(labs.map(l => ({ id: l.id, name: l.name, sub: l.lab_provider || "Lab panel", checked: l.id === lab.id })));
    setAssignItemSearch("");
    setAssignClientSearch("");
    try {
      const list = await labsApi.getClientsForLabAssignment(lab.id);
      setAssignClients(list.map(toAssignClient));
      setAssignOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleAssignOpenMultiple = async () => {
    if (selectedRowIds.length === 0) {
      toast({ title: "Selection Required", description: "Select one or more lab panels first.", variant: "destructive" });
      return;
    }
    setAssignItemPool(labs.map(l => ({ id: l.id, name: l.name, sub: l.lab_provider || "Lab panel", checked: selectedRowIds.includes(l.id) })));
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
    const clientIds = assignClients.filter(c => c.checked).map(c => c.id);
    try {
      for (const item of checkedItems) {
        await labsApi.assignLabPanelToClients(item.id, clientIds);
      }
      setSelectedRowIds([]);
      loadData();
      if (checkedItems.length === 1) {
        const list = await labsApi.getClientsForLabAssignment(checkedItems[0].id);
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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
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
            onClick={() => navigate("/dashboard/settings/junction-labs")}
            className="border border-input bg-background hover:bg-muted font-semibold text-xs h-9 inline-flex items-center gap-1.5"
          >
            <Settings className="h-4 w-4" />
            Junction Settings
          </Button>

          <Button
            variant="outline"
            onClick={handleAssignOpenMultiple}
            className="border border-input bg-background hover:bg-muted font-semibold text-xs h-9 inline-flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Assign to Clients
          </Button>

          <Button
            onClick={() => {
              setCreateForm(INITIAL_CREATE_FORM);
              setCreateMarkerSearch("");
              setCreateOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 inline-flex items-center gap-1 px-4"
          >
            + Create Lab Panel
          </Button>
        </div>
      </div>

      {/* Stats tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Labs", value: stats.total },
          { label: "Active Labs", value: stats.active },
          { label: "Junction-Synced", value: stats.synced },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border/60 rounded-xl px-[18px] py-[14px] flex flex-col justify-between shadow-sm min-h-[90px]"
          >
            <span className="text-[11.5px] uppercase font-bold tracking-wider text-muted-foreground">
              {label}
            </span>
            <span className="text-2xl font-semibold font-mono text-foreground mt-2">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Filter bar + table */}
      <LabsTable
        labs={labs}
        assignmentsCount={assignmentsCount}
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
        onArchive={handleArchive}
      />

      {/* Modals */}
      <LabCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={createForm}
        onFormChange={setCreateForm}
        biomarkers={biomarkers}
        catalogLabs={catalogLabs}
        markerSearch={createMarkerSearch}
        onMarkerSearchChange={setCreateMarkerSearch}
        groupedBiomarkers={createModalGroupedBiomarkers}
        onSubmit={handleCreateSubmit}
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
