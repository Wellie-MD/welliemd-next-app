import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { Pencil, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { labsApi, LabPanel, Biomarker } from "@/api/labs";

const STATES_LIST = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

interface AssignItem {
  id: string;
  name: string;
  sub: string;
  checked: boolean;
}

interface AssignClient {
  id: string;
  name: string;
  email: string;
  checked: boolean;
  linkedLabAccountIds?: string[];
}

export default function Labs() {
  const [labs, setLabs] = useState<LabPanel[]>([]);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Pending approval" | "Inactive">("All");
  
  // Selection state for multiple assignments
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [markerDetailsOpen, setMarkerDetailsOpen] = useState(false);

  // Selected states for actions
  const [selectedLab, setSelectedLab] = useState<LabPanel | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Biomarker | null>(null);

  // Assign Modal States
  const [assignItemPool, setAssignItemPool] = useState<AssignItem[]>([]);
  const [assignClients, setAssignClients] = useState<AssignClient[]>([]);
  const [assignItemSearch, setAssignItemSearch] = useState("");
  const [assignClientSearch, setAssignClientSearch] = useState("");

  // Create Form state
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    lab_provider: "",
    fasting_required: "yes" as "yes" | "no",
    collection_method: "at_home_phlebotomy" as any,
    cost_to_client: 0,
    cost_to_welliemd: 0,
    is_active: true,
    service_states: [] as string[],
    biomarkers: [] as string[],
  });

  const [createMarkerSearch, setCreateMarkerSearch] = useState("");

  // Edit Form state
  const [editForm, setEditForm] = useState({
    cost_to_client: 0,
    cost_to_welliemd: 0,
    is_active: true,
    service_states: [] as string[],
  });

  const loadData = async () => {
    try {
      const allLabs = await labsApi.getLabPanels();
      setLabs(allLabs);
      const allMarkers = await labsApi.getBiomarkers();
      setBiomarkers(allMarkers);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync client assignments count for display in table
  const [labsAssignmentsCount, setLabsAssignmentsCount] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchAssignmentsCount = async () => {
      const counts: Record<string, number> = {};
      for (const lab of labs) {
        try {
          const list = await labsApi.getClientsForLabAssignment(lab.id);
          counts[lab.id] = list.filter(c => c.assigned).length;
        } catch (e) {
          console.error(e);
        }
      }
      setLabsAssignmentsCount(counts);
    };
    if (labs.length > 0) {
      fetchAssignmentsCount();
    }
  }, [labs]);

  const filteredLabs = useMemo(() => {
    return labs.filter(lab => {
      // Search filter
      const matchesSearch = lab.name.toLowerCase().includes(search.toLowerCase()) || 
        lab.lab_provider.toLowerCase().includes(search.toLowerCase()) ||
        lab.id.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === "Active") return lab.is_active && lab.junction_status === "Active";
      if (statusFilter === "Pending approval") return lab.junction_status === "Pending";
      if (statusFilter === "Inactive") return !lab.is_active;

      return true;
    });
  }, [labs, search, statusFilter]);

  const stats = useMemo(() => {
    const total = labs.length;
    const active = labs.filter(l => l.is_active && l.junction_status === "Active").length;
    const synced = labs.filter(l => l.junction_status === "Active").length;
    return { total, active, synced };
  }, [labs]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.lab_provider) {
      toast({
        title: "Validation Error",
        description: "Please choose a lab provider first.",
        variant: "destructive"
      });
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
      // Reset form
      setCreateForm({
        name: "",
        description: "",
        lab_provider: "",
        fasting_required: "yes",
        collection_method: "at_home_phlebotomy",
        cost_to_client: 0,
        cost_to_welliemd: 0,
        is_active: true,
        service_states: [],
        biomarkers: [],
      });
      setCreateMarkerSearch("");
      loadData();
      toast({
        title: "Success",
        description: "Lab panel created successfully and sent to Junction for approval."
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to create lab panel.",
        variant: "destructive"
      });
    }
  };

  const handleEditOpen = (lab: LabPanel) => {
    setSelectedLab(lab);
    setEditForm({
      cost_to_client: lab.cost_to_client,
      cost_to_welliemd: lab.cost_to_welliemd,
      is_active: lab.is_active,
      service_states: lab.service_states || [],
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
      toast({
        title: "Success",
        description: "Lab panel configuration saved."
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to update lab panel.",
        variant: "destructive"
      });
    }
  };

  const handleCheckJunctionStatus = async (lab: LabPanel) => {
    try {
      await labsApi.checkLabPanelJunctionStatus(lab.id);
      loadData();
      toast({
        title: "Junction Status Synchronized",
        description: `Junction validated "${lab.name}". Status is now active — price, turnaround times, and collection instructions are now available.`
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to update Junction status.",
        variant: "destructive"
      });
    }
  };

  const handleAssignOpenSingle = async (lab: LabPanel) => {
    // Populate items list with only this lab checked
    const pool: AssignItem[] = labs.map(l => ({
      id: l.id,
      name: l.name,
      sub: l.lab_provider || "Lab panel",
      checked: l.id === lab.id
    }));
    setAssignItemPool(pool);
    setAssignItemSearch("");
    setAssignClientSearch("");

    try {
      const clientList = await labsApi.getClientsForLabAssignment(lab.id);
      const mappedClients: AssignClient[] = clientList.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        checked: c.assigned,
        linkedLabAccountIds: c.linkedLabAccountIds
      }));
      setAssignClients(mappedClients);
      setAssignOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignOpenMultiple = async () => {
    if (selectedRowIds.length === 0) return;
    
    // Populate items list with checked matching selected rows
    const pool: AssignItem[] = labs.map(l => ({
      id: l.id,
      name: l.name,
      sub: l.lab_provider || "Lab panel",
      checked: selectedRowIds.includes(l.id)
    }));
    setAssignItemPool(pool);
    setAssignItemSearch("");
    setAssignClientSearch("");

    try {
      // For multiple, fetch clients from first checked item to get a baseline
      const firstId = selectedRowIds[0];
      const clientList = await labsApi.getClientsForLabAssignment(firstId);
      const mappedClients: AssignClient[] = clientList.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        checked: c.assigned,
        linkedLabAccountIds: c.linkedLabAccountIds
      }));
      setAssignClients(mappedClients);
      setAssignOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignSubmit = async () => {
    const checkedItems = assignItemPool.filter(it => it.checked);
    if (checkedItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please check at least one item on the left pane to assign.",
        variant: "destructive"
      });
      return;
    }
    const checkedClientIds = assignClients.filter(c => c.checked).map(c => c.id);
    
    try {
      for (const item of checkedItems) {
        await labsApi.assignLabPanelToClients(item.id, checkedClientIds);
      }
      setAssignOpen(false);
      setSelectedRowIds([]);
      loadData();
      toast({
        title: "Success",
        description: "Assignments updated successfully."
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to assign items.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLab = (lab: LabPanel) => {
    if (confirm(`Would delete "${lab.name}"`)) {
      setLabs(prev => prev.filter(l => l.id !== lab.id));
      setSelectedRowIds(prev => prev.filter(id => id !== lab.id));
      toast({
        title: "Lab Deleted",
        description: `"${lab.name}" has been removed.`
      });
    }
  };

  const toggleAllAssignClients = (checked: boolean) => {
    setAssignClients(prev => prev.map(c => ({ ...c, checked })));
  };

  const toggleStateInEdit = (stateCode: string) => {
    setEditForm(prev => {
      const service_states = prev.service_states.includes(stateCode)
        ? prev.service_states.filter(s => s !== stateCode)
        : [...prev.service_states, stateCode];
      return { ...prev, service_states };
    });
  };

  const toggleBiomarkerInCreate = (id: string) => {
    setCreateForm(prev => {
      const biomarkers = prev.biomarkers.includes(id)
        ? prev.biomarkers.filter(b => b !== id)
        : [...prev.biomarkers, id];
      return { ...prev, biomarkers };
    });
  };

  const handleMarkerClick = (marker: Biomarker) => {
    setSelectedMarker(marker);
    setMarkerDetailsOpen(true);
  };

  // Toggle selection for all visible rows
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredLabs.map(l => l.id);
      setSelectedRowIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    } else {
      const visibleIds = filteredLabs.map(l => l.id);
      setSelectedRowIds(prev => prev.filter(id => !visibleIds.includes(id)));
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowIds(prev => [...prev, id]);
    } else {
      setSelectedRowIds(prev => prev.filter(x => x !== id));
    }
  };

  const allVisibleSelected = useMemo(() => {
    if (filteredLabs.length === 0) return false;
    return filteredLabs.every(l => selectedRowIds.includes(l.id));
  }, [filteredLabs, selectedRowIds]);

  // Filtering lists in assign dialog
  const filteredAssignItems = useMemo(() => {
    return assignItemPool.filter(it => 
      it.name.toLowerCase().includes(assignItemSearch.toLowerCase()) || 
      it.sub.toLowerCase().includes(assignItemSearch.toLowerCase())
    );
  }, [assignItemPool, assignItemSearch]);

  const filteredAssignClients = useMemo(() => {
    return assignClients.filter(c => 
      c.name.toLowerCase().includes(assignClientSearch.toLowerCase()) || 
      c.email.toLowerCase().includes(assignClientSearch.toLowerCase())
    );
  }, [assignClients, assignClientSearch]);

  // Grouped and filtered biomarkers for the Create Modal
  const createModalGroupedBiomarkers = useMemo(() => {
    if (!createForm.lab_provider) return [];
    
    // Filter by provider and search query
    const filtered = biomarkers.filter(bm => {
      const matchesProvider = bm.labs ? bm.labs.includes(createForm.lab_provider) : true;
      const matchesSearch = createMarkerSearch.trim() === "" ||
        bm.name.toLowerCase().includes(createMarkerSearch.toLowerCase()) ||
        bm.id.toLowerCase().includes(createMarkerSearch.toLowerCase()) ||
        bm.code.toLowerCase().includes(createMarkerSearch.toLowerCase());
      return matchesProvider && matchesSearch;
    });

    // Group by category
    const groups: { category: string; items: Biomarker[] }[] = [];
    filtered.forEach(bm => {
      let g = groups.find(c => c.category === bm.category);
      if (!g) {
        g = { category: bm.category, items: [] };
        groups.push(g);
      }
      g.items.push(bm);
    });
    return groups;
  }, [biomarkers, createForm.lab_provider, createMarkerSearch]);  const getCollectionMethodLabel = (method: string) => {
    const map: Record<string, string> = {
      at_home_phlebotomy: 'At-home phlebotomy',
      on_site_collection: 'On-site collection',
      walk_in_test: 'Walk-in test',
      testkit: 'Test kit'
    };
    return map[method] || method;
  };

  const renderJunctionStatusBadge = (status: string) => {
    if (status === "Active") {
      return (
        <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#dcfce7] text-[#166534] border-[#bbf7d0]">
          Active
        </span>
      );
    }
    if (status === "Pending") {
      return (
        <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#fef3c7] text-[#92400e] border-[#fde68a]">
          Pending approval
        </span>
      );
    }
    return (
      <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#fee2e2] text-[#991b1b] border-[#fecaca]">
        Inactive
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Labs</h1>
            <span className="inline-flex items-center gap-1 border bg-white px-2.5 py-0.5 rounded-full border-sky-100/60 bg-sky-50 text-[10.5px] font-semibold text-sky-800 shadow-sm">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" className="inline">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="12" r="3" />
                <line x1="9" y1="12" x2="15" y2="12" />
              </svg>
              via Junction
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Diagnostic tests and panels ordered as part of custom forms. All lab orders route through Junction to the underlying provider (Quest, LabCorp, etc.).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedRowIds.length === 0) {
                toast({
                  title: "Selection Required",
                  description: "Please select one or more lab panels using the row checkboxes first.",
                  variant: "destructive"
                });
                return;
              }
              handleAssignOpenMultiple();
            }}
            className="border border-input bg-background hover:bg-muted font-semibold text-xs h-9 inline-flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Assign to Clients
          </Button>

          <Button
            onClick={() => {
              setCreateForm({
                name: "",
                description: "",
                lab_provider: "",
                fasting_required: "yes",
                collection_method: "at_home_phlebotomy",
                cost_to_client: 0,
                cost_to_welliemd: 0,
                is_active: true,
                service_states: [],
                biomarkers: [],
              });
              setCreateMarkerSearch("");
              setCreateOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 inline-flex items-center gap-1 px-4"
          >
            + Create Lab Panel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/60 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[90px] px-[18px] py-[14px]">
          <span className="text-[11.5px] uppercase font-bold tracking-wider text-muted-foreground">Total Labs</span>
          <span className="text-2xl font-semibold font-mono text-foreground mt-2">{stats.total}</span>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[90px] px-[18px] py-[14px]">
          <span className="text-[11.5px] uppercase font-bold tracking-wider text-muted-foreground">Active Labs</span>
          <span className="text-2xl font-semibold font-mono text-foreground mt-2">{stats.active}</span>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[90px] px-[18px] py-[14px]">
          <span className="text-[11.5px] uppercase font-bold tracking-wider text-muted-foreground">Junction-Synced</span>
          <span className="text-2xl font-semibold font-mono text-foreground mt-2">{stats.synced}</span>
        </div>
      </div>

      {/* Filters and Search Container */}
      <div className="bg-card border border-border/60 rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Active", "Pending approval", "Inactive"] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
                  statusFilter === status
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setSearch(""); setStatusFilter("All"); }}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium ml-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        </div>
        
        <div className="relative w-full">
          <svg
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Search labs by name, code, or vendor"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10 w-full text-xs placeholder:text-muted-foreground border-border/80"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">LAB TEST</TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">LAB</TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">PRICE</TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">JUNCTION STATUS</TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">WELLIEMD</TableHead>
              <TableHead className="text-right font-semibold text-xs tracking-wider text-muted-foreground pr-6">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLabs.map(lab => {
              const assignedCount = labsAssignmentsCount[lab.id] || 0;
              const hasAssignmentText = assignedCount > 0 
                ? ` · Assigned to ${assignedCount} client${assignedCount > 1 ? 's' : ''}`
                : '';
              
              return (
                <TableRow key={lab.id} className="hover:bg-muted/5">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedRowIds.includes(lab.id)}
                      onCheckedChange={(checked) => handleRowSelect(lab.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full inline-block shrink-0 ${lab.is_active ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'}`}></span>
                      <div>
                        <div className="font-semibold text-foreground text-[13.5px] flex items-center leading-normal">
                          {lab.name}
                          {lab.required === "required" && (
                            <span className="text-rose-600 ml-1.5 text-[10.5px] select-none align-middle" title="Required">●</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {getCollectionMethodLabel(lab.collection_method)}{hasAssignmentText}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] font-medium text-foreground">{lab.lab_provider}</TableCell>
                  <TableCell>
                    <div className="text-[12.5px] leading-tight">
                      <span className="font-semibold text-foreground block">${lab.cost_to_client.toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground">cost ${lab.cost_to_welliemd.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderJunctionStatusBadge(lab.junction_status)}
                  </TableCell>
                  <TableCell>
                    {lab.junction_status === "Active" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await labsApi.updateLabPanel(lab.id, { is_active: !lab.is_active });
                            loadData();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className={`inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                          lab.is_active
                            ? "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] hover:bg-[#bbf7d0]"
                            : "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0] hover:bg-[#e2e8f0]"
                        }`}
                      >
                        {lab.is_active ? "Enabled" : "Disabled"}
                      </button>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0] opacity-55 cursor-not-allowed">
                          Disabled
                        </span>
                        <div className="text-[10px] text-muted-foreground pl-[10px]">locked</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCheckJunctionStatus(lab)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Check Junction Status"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditOpen(lab)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit pricing & availability"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLab(lab)}
                        className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredLabs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  No labs match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-lg font-bold">Create Lab Panel</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
              Pick a lab, choose its biomarkers, then name the panel. Orders route through Junction to that lab.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            {/* Lab Provider Select */}
            <div className="space-y-1.5">
              <Label htmlFor="lab_provider" className="font-semibold text-xs text-foreground">Choose your lab *</Label>
              <Select
                value={createForm.lab_provider}
                onValueChange={val => {
                  setCreateForm(prev => ({ ...prev, lab_provider: val, biomarkers: [] }));
                  setCreateMarkerSearch("");
                }}
              >
                <SelectTrigger id="lab_provider" className="h-9 text-xs">
                  <SelectValue placeholder="Select a lab..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quest Diagnostics">Quest Diagnostics</SelectItem>
                  <SelectItem value="LabCorp">LabCorp</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                The lab that fulfills this panel — biomarkers below are filtered to it. At order time the <code>lab_account_id</code> is the ordering client's linked account for this lab.
              </p>
            </div>

            {/* Biomarker check-grid with search */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs text-foreground">Choose your biomarkers</Label>
              <p className="text-[10.5px] text-muted-foreground mt-0 mb-1.5 leading-normal">
                The biomarkers this panel contains — sent as <code>marker_ids</code> when Junction creates the lab test.
              </p>
              
              <Input
                placeholder="Filter biomarkers…"
                value={createMarkerSearch}
                onChange={e => setCreateMarkerSearch(e.target.value)}
                disabled={!createForm.lab_provider}
                className="h-8 text-xs placeholder:text-muted-foreground/80 mb-2"
              />

              <div className="border border-border/80 rounded-lg p-2 max-h-48 overflow-y-auto bg-background/50 space-y-2.5">
                {!createForm.lab_provider ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Select a lab above to choose biomarkers.
                  </div>
                ) : createModalGroupedBiomarkers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No biomarkers match for this lab.
                  </div>
                ) : (
                  createModalGroupedBiomarkers.map(group => (
                    <div key={group.category} className="space-y-1">
                      <div className="text-[9.5px] font-bold tracking-wider text-muted-foreground uppercase px-1 py-0.5">
                        {group.category}
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map(bm => (
                          <label
                            key={bm.id}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer select-none text-xs"
                          >
                            <Checkbox
                              checked={createForm.biomarkers.includes(bm.id)}
                              onCheckedChange={(checked) => {
                                toggleBiomarkerInCreate(bm.id);
                              }}
                              className="h-4 w-4"
                            />
                            <span className="font-medium text-foreground truncate">{bm.name}</span>
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground/80 pr-1">{bm.id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-1">
                {createForm.biomarkers.length === 0
                  ? "No biomarkers selected yet."
                  : `${createForm.biomarkers.length} biomarker${createForm.biomarkers.length === 1 ? '' : 's'} selected.`}
              </div>
            </div>

            {/* Panel Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-semibold text-xs text-foreground">Name your lab panel *</Label>
              <Input
                id="name"
                required
                placeholder="e.g., Comprehensive Metabolic Panel"
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            {/* Panel Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="font-semibold text-xs text-foreground">Describe your lab panel</Label>
              <Textarea
                id="description"
                required
                placeholder="Optional clinical context"
                rows={2}
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                className="text-xs resize-none"
              />
            </div>

            {/* Fasting & Method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fasting" className="font-semibold text-xs text-foreground">Is fasting required?</Label>
                <Select
                  value={createForm.fasting_required}
                  onValueChange={val => setCreateForm(prev => ({ ...prev, fasting_required: val as any }))}
                >
                  <SelectTrigger id="fasting" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="collection" className="font-semibold text-xs text-foreground">Collection method</Label>
                <Select
                  value={createForm.collection_method}
                  onValueChange={val => setCreateForm(prev => ({ ...prev, collection_method: val as any }))}
                >
                  <SelectTrigger id="collection" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="at_home_phlebotomy">At-home phlebotomy</SelectItem>
                    <SelectItem value="on_site_collection">On-site collection</SelectItem>
                    <SelectItem value="walk_in_test">Walk-in test</SelectItem>
                    <SelectItem value="testkit">Test kit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Client & cost welliemd */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cost_to_client" className="font-semibold text-xs text-foreground">Cost to Client ($)</Label>
                <Input
                  id="cost_to_client"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={createForm.cost_to_client === 0 ? "" : createForm.cost_to_client}
                  onChange={e => setCreateForm(prev => ({ ...prev, cost_to_client: parseFloat(e.target.value) || 0 }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost_to_welliemd" className="font-semibold text-xs text-foreground">Cost to WellieMD ($)</Label>
                <Input
                  id="cost_to_welliemd"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={createForm.cost_to_welliemd === 0 ? "" : createForm.cost_to_welliemd}
                  onChange={e => setCreateForm(prev => ({ ...prev, cost_to_welliemd: parseFloat(e.target.value) || 0 }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* WellieMD availability switch */}
            <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-lg">
              <div>
                <span className="font-semibold text-xs text-foreground block">
                  WellieMD availability: <strong className="font-bold">{createForm.is_active ? "Enabled" : "Disabled"}</strong>
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Locked — enable after Junction approves this panel.
                </span>
              </div>
              <Switch
                id="create-active"
                checked={createForm.is_active}
                onCheckedChange={val => setCreateForm(prev => ({ ...prev, is_active: val }))}
              />
            </div>

            <DialogFooter className="gap-2 md:gap-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="text-xs h-9">Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9">Create Lab Panel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-lg font-bold">Lab Test Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
              The lab and biomarkers are fixed once created. Pricing and availability are editable below.
            </DialogDescription>
          </DialogHeader>

          {selectedLab && (
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {/* Detailed Read-Only Specs Grid */}
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 py-2 text-xs">
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Name</span>
                  <span className="text-foreground text-sm font-semibold">{selectedLab.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-1.5">Junction Status</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selectedLab.junction_status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedLab.junction_status}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Junction Lab ID</span>
                  <span className="text-foreground font-mono text-[12px]">{selectedLab.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Type</span>
                  <span className="text-foreground font-semibold">Lab panel</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Lab</span>
                  <span className="text-foreground font-semibold">{selectedLab.lab_provider}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Sample type</span>
                  <span className="text-foreground font-semibold">{selectedLab.sample_type || "serum"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Collection method</span>
                  <span className="text-foreground capitalize font-semibold">{selectedLab.collection_method.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Fasting required</span>
                  <span className="text-foreground capitalize font-semibold">{selectedLab.fasting_required === "yes" ? "Yes" : "No"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Common turnaround</span>
                  <span className="text-foreground font-semibold">{selectedLab.turnaround_days || "2 days"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Worst-case turnaround</span>
                  <span className="text-foreground font-semibold">4 days</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Junction price</span>
                  <span className="text-foreground font-semibold">${(selectedLab.junction_price || selectedLab.cost_to_welliemd * 0.85).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Auto-generated</span>
                  <span className="text-foreground font-semibold">No</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Collection instructions</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); toast({ title: "PDF Download", description: "PDF instructions download started." }); }} className="text-blue-600 hover:underline font-semibold block">
                    View instructions (PDF)
                  </a>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Lab (processing facility)</span>
                  <span className="text-foreground font-semibold">
                    {selectedLab.lab_provider === "Quest Diagnostics" 
                      ? "Quest Diagnostics — 500 Plaza Dr, Secaucus, NJ 07094"
                      : "LabCorp — 358 S Main St, Burlington, NC 27215"
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Supported sample types</span>
                  <span className="text-foreground font-semibold">serum, urine</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Supported collection methods</span>
                  <span className="text-foreground font-semibold">At-home phlebotomy, Walk-in test, On-site collection</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Vital slug</span>
                  <span className="text-foreground font-mono font-semibold">{selectedLab.vital_slug || selectedLab.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block font-bold uppercase tracking-wider text-[10px] mb-0.5">Description</span>
                  <span className="text-foreground font-semibold">{selectedLab.description}</span>
                </div>
              </div>

              {/* Biomarkers List Table */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Biomarkers ({selectedLab.biomarkers.length})
                </div>
                <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-bold text-foreground h-8">NAME</TableHead>
                        <TableHead className="font-bold text-foreground h-8">MARKER ID</TableHead>
                        <TableHead className="font-bold text-foreground h-8">CATEGORY</TableHead>
                        <TableHead className="h-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLab.biomarkers.map((bm: Biomarker) => (
                        <TableRow key={bm.id} className="h-8">
                          <TableCell className="font-medium text-foreground py-1.5">{bm.name}</TableCell>
                          <TableCell className="font-mono text-muted-foreground py-1.5">{bm.code}</TableCell>
                          <TableCell className="py-1.5">{bm.category}</TableCell>
                          <TableCell className="text-right py-1.5 pr-4">
                            <button
                              type="button"
                              onClick={() => handleMarkerClick(bm)}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Details
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {selectedLab.biomarkers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No biomarkers mapped.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Editable Pricing & Availability Section */}
              <div className="space-y-3.5 pt-4 border-t">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pricing & availability (editable)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_cost_to_client" className="font-semibold text-xs text-foreground">Cost to Client ($)</Label>
                    <Input
                      id="edit_cost_to_client"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={editForm.cost_to_client === 0 ? "" : editForm.cost_to_client}
                      onChange={e => setEditForm(prev => ({ ...prev, cost_to_client: parseFloat(e.target.value) || 0 }))}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit_cost_to_welliemd" className="font-semibold text-xs text-foreground">Cost to WellieMD ($)</Label>
                    <Input
                      id="edit_cost_to_welliemd"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={editForm.cost_to_welliemd === 0 ? "" : editForm.cost_to_welliemd}
                      onChange={e => setEditForm(prev => ({ ...prev, cost_to_welliemd: parseFloat(e.target.value) || 0 }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-lg">
                  <div>
                    <span className="font-semibold text-xs text-foreground block">
                      WellieMD availability: <strong className="font-bold">{editForm.is_active ? "Enabled" : "Disabled"}</strong>
                    </span>
                  </div>
                  <Switch
                    id="edit-active"
                    checked={editForm.is_active}
                    onCheckedChange={val => setEditForm(prev => ({ ...prev, is_active: val }))}
                  />
                </div>
              </div>

              {/* Service States Selection */}
              <div className="space-y-3 pt-4 border-t">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Service States
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">States where this lab panel is offered to patients. Leave empty to offer in all states.</p>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditForm(prev => ({ ...prev, service_states: [...STATES_LIST] }))}
                      className="h-7 text-xs border-border/80"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditForm(prev => ({ ...prev, service_states: [] }))}
                      className="h-7 text-xs border-border/80"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {editForm.service_states.length === 0 && (
                  <div className="bg-[#fef3c7] border border-[#fde68a] text-[#92400e] p-2.5 rounded-lg text-xs flex items-center gap-2">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span><strong>No states selected</strong> — this panel will be offered in <strong>ALL states</strong>.</span>
                  </div>
                )}

                <div className="border border-border/80 rounded-lg p-3 max-h-36 overflow-y-auto flex flex-wrap gap-1.5 bg-background/50">
                  {STATES_LIST.map(state => {
                    const active = editForm.service_states.includes(state);
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() => toggleStateInEdit(state)}
                        className={`h-7 w-11 text-xs font-semibold rounded border transition-colors ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-background text-muted-foreground border-input hover:bg-muted"
                        }`}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="gap-2 md:gap-0 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="text-xs h-9">Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Modal (2 Panes structure matching HTML exactly) */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-[760px] w-[94%] p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-lg font-bold">Assign to Clients</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal" id="assign_subtitle">
              Pick lab panels and the client brands that can offer them under Products → Lab Tests.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-0 min-h-[40vh] max-h-[60vh] overflow-hidden">
            {/* Left Pane: Items List */}
            <div className="w-[42%] border-r bg-muted/10 p-4 overflow-y-auto flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Lab Panels</span>
                <span className="text-[11px] text-muted-foreground">
                  {assignItemPool.filter(it => it.checked).length} selected
                </span>
              </div>
              <Input
                placeholder="Search items"
                value={assignItemSearch}
                onChange={e => setAssignItemSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="space-y-1">
                {filteredAssignItems.map(it => (
                  <label key={it.id} className="flex items-start gap-2.5 p-2 border-b border-border/60 hover:bg-muted/40 rounded cursor-pointer select-none">
                    <Checkbox
                      checked={it.checked}
                      onCheckedChange={(checked) => {
                        setAssignItemPool(prev => prev.map(x => x.id === it.id ? { ...x, checked: !!checked } : x));
                      }}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground leading-normal truncate">{it.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{it.sub}</div>
                    </div>
                  </label>
                ))}
                {filteredAssignItems.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">No matches</div>
                )}
              </div>
            </div>

            {/* Right Pane: Clients List */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Assign to clients</span>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toggleAllAssignClients(true)}
                    className="h-6 text-[10px] px-2 py-0.5"
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toggleAllAssignClients(false)}
                    className="h-6 text-[10px] px-2 py-0.5"
                  >
                    None
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Search clients by name or email"
                value={assignClientSearch}
                onChange={e => setAssignClientSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="space-y-1">
                {filteredAssignClients.map(c => (
                  <label key={c.id} className="flex items-center gap-2.5 p-2 border-b border-border/60 hover:bg-muted/40 rounded cursor-pointer select-none">
                    <Checkbox
                      checked={c.checked}
                      onCheckedChange={(checked) => {
                        setAssignClients(prev => prev.map(x => x.id === c.id ? { ...x, checked: !!checked } : x));
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{c.email}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 pr-1">
                      {(c.linkedLabAccountIds || []).length} acct{(c.linkedLabAccountIds || []).length === 1 ? '' : 's'}
                    </span>
                  </label>
                ))}
                {filteredAssignClients.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">No matches</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t gap-2 bg-muted/5">
            <Button variant="outline" onClick={() => setAssignOpen(false)} className="text-xs h-9">Cancel</Button>
            <Button onClick={handleAssignSubmit} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-biomarker detail Modal */}
      <Dialog open={markerDetailsOpen} onOpenChange={setMarkerDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Biomarker Details</DialogTitle>
            <DialogDescription>
              Junction marker specifications and expected Turnaround Times (TAT).
            </DialogDescription>
          </DialogHeader>

          {selectedMarker && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-y py-3">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Name</span>
                  <span className="font-semibold text-foreground">{selectedMarker.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Code (Junction ID)</span>
                  <span className="font-medium text-foreground font-mono">{selectedMarker.code}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Category</span>
                  <span className="font-semibold text-foreground">{selectedMarker.category}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Slug</span>
                  <span className="font-medium text-foreground font-mono">{selectedMarker.slug}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Common TAT</span>
                  <span className="font-semibold text-emerald-600">{selectedMarker.common_tat}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Worst Case TAT</span>
                  <span className="font-semibold text-amber-600">{selectedMarker.worst_case_tat}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setMarkerDetailsOpen(false)} className="text-xs h-8">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
