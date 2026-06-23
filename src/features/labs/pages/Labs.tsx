import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Copy, Search, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { clientLabsApi, ClientLabPanel } from "@/features/labs/api";
import LabEditDialog from "@/features/labs/components/LabEditDialog";

function getCollectionMethodLabel(method: string) {
  switch (method) {
    case "testkit":
      return "Testkit";
    case "walk_in_test":
      return "Walk-in";
    case "at_home_phlebotomy":
      return "At-home";
    case "on_site_collection":
      return "On-site";
    default:
      return method.replace(/_/g, " ");
  }
}

function getDisplaySpecimen(lab: ClientLabPanel) {
  if (lab.collection_method === "at_home_phlebotomy" || lab.collection_method === "walk_in_test") {
    return "blood draw";
  }
  return lab.sample_type || "serum";
}

export default function Labs() {
  const [labs, setLabs] = useState<ClientLabPanel[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Filters
  const [selectedPanel, setSelectedPanel] = useState<string>("all");
  const [selectedLab, setSelectedLab] = useState<string>("all");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Editing dialog state
  const [editingLab, setEditingLab] = useState<ClientLabPanel | null>(null);

  // Load labs from real backend
  const fetchLabs = async () => {
    try {
      setLoading(true);
      const data = await clientLabsApi.getLabPanels();
      setLabs(data);
    } catch (error) {
      console.error("Failed to fetch client labs:", error);
      toast({
        title: "Error",
        description: "Failed to load lab tests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  // Filter options
  const panelOptions = useMemo(() => {
    const names = labs.map((l) => l.name);
    return ["all", ...Array.from(new Set(names))];
  }, [labs]);

  const labOptions = useMemo(() => {
    const providers = labs.map((l) => l.lab_provider);
    return ["all", ...Array.from(new Set(providers))];
  }, [labs]);

  // Filter and search logic
  const filteredLabs = useMemo(() => {
    return labs.filter((lab) => {
      // Search term
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = lab.name.toLowerCase().includes(query);
        const matchesProvider = lab.lab_provider.toLowerCase().includes(query);
        const matchesCategory = (lab.description || "").toLowerCase().includes(query);
        if (!matchesName && !matchesProvider && !matchesCategory) return false;
      }

      // Panel Filter
      if (selectedPanel !== "all" && lab.name !== selectedPanel) return false;

      // Lab Provider Filter
      if (selectedLab !== "all" && lab.lab_provider !== selectedLab) return false;

      // Collection Method Filter
      if (selectedCollection !== "all") {
        if (selectedCollection === "at_home" && lab.collection_method !== "at_home_phlebotomy") return false;
        if (selectedCollection === "walk_in" && lab.collection_method !== "walk_in_test") return false;
      }

      // Status Filter
      if (selectedStatus !== "all") {
        const isActiveFilter = selectedStatus === "active";
        if (lab.is_active !== isActiveFilter) return false;
      }

      return true;
    });
  }, [labs, search, selectedPanel, selectedLab, selectedCollection, selectedStatus]);

  // Copy backend-generated storefront (Checkout Link)
  const handleCopyLink = (lab: ClientLabPanel) => {
    if (!lab.is_orderable) return; // guard: should not reach here when disabled
    const url = lab.storefront_url;
    if (!url) {
      toast({ title: "Unavailable", description: "Checkout link is not available yet.", variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Checkout link copied to clipboard.",
    });
  };

  // Open edit dialog
  const handleEditClick = (lab: ClientLabPanel) => {
    setEditingLab(lab);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lab Tests</h1>
        <div className="text-xs text-muted-foreground mt-1">
          Home / Products / <span className="font-semibold text-foreground">Lab Tests</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-3 border-b border-border pb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[165px_120px_120px_120px_minmax(220px,1fr)_auto] gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Panel</Label>
            <Select value={selectedPanel} onValueChange={setSelectedPanel}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Panels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panels</SelectItem>
                {panelOptions.filter(x => x !== "all").map((panel) => (
                  <SelectItem key={panel} value={panel}>{panel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lab</Label>
            <Select value={selectedLab} onValueChange={setSelectedLab}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Labs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labs</SelectItem>
                {labOptions.filter(x => x !== "all").map((lab) => (
                  <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Collection</Label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="at_home">At-home</SelectItem>
                <SelectItem value="walk_in">Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search lab tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground whitespace-nowrap pb-2">
            Showing {filteredLabs.length} of {labs.length}
          </div>
        </div>
      </div>

      {/* Lab tests Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="p-4 py-3">Name</th>
                <th className="p-4 py-3">Panel</th>
                <th className="p-4 py-3">Lab</th>
                <th className="p-4 py-3">Specimen</th>
                <th className="p-4 py-3">Collection</th>
                <th className="p-4 py-3">Biomarkers</th>
                <th className="p-4 py-3">Status</th>
                <th className="p-4 py-3">Created At</th>
                <th className="p-4 py-3 text-center">Checkout Link</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading assigned lab tests...
                  </td>
                </tr>
              ) : filteredLabs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-medium">
                    No lab tests match these filters.
                  </td>
                </tr>
              ) : (
                filteredLabs.map((lab) => (
                  <tr
                    key={lab.id}
                    className="hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => handleEditClick(lab)}
                  >
                    <td className="p-4 py-3.5 font-semibold text-foreground group-hover:text-primary transition-colors">
                      {lab.name}
                    </td>
                    <td className="p-4 py-3.5">
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-semibold px-2 py-0.5 text-[10px]">
                        Lab Panel
                      </Badge>
                    </td>
                    <td className="p-4 py-3.5 text-muted-foreground">{lab.lab_provider}</td>
                    <td className="p-4 py-3.5 text-muted-foreground">{getDisplaySpecimen(lab)}</td>
                    <td className="p-4 py-3.5">
                      <Badge
                        variant="outline"
                        className={`font-semibold px-2 py-0.5 text-[10px] ${
                          lab.collection_method === "at_home_phlebotomy"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {getCollectionMethodLabel(lab.collection_method)}
                      </Badge>
                    </td>
                    <td className="p-4 py-3.5 text-muted-foreground">
                      {lab.biomarkers.length > 0 ? `${lab.biomarkers.length} markers` : "-"}
                    </td>
                    <td className="p-4 py-3.5">
                      <Badge
                        variant="outline"
                        className={`font-semibold px-2 py-0.5 text-[10px] ${
                          lab.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {lab.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 py-3.5 text-muted-foreground">{lab.created_at ? new Date(lab.created_at as unknown as string).toLocaleDateString() : "—"}</td>
                    <td className="p-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {lab.is_orderable ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted text-sky-500 hover:text-sky-600 rounded-md"
                          title="Copy Checkout Link"
                          onClick={() => handleCopyLink(lab)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground cursor-not-allowed"
                          title={
                            lab.junction_status === "pending_submission"
                              ? "Submit to Junction first"
                              : lab.junction_status === "pending_approval"
                                ? "Awaiting Junction approval"
                                : lab.operational_status === "failed" || lab.junction_status === "failed"
                                  ? "Submission failed — replace and resubmit"
                                  : !lab.is_active
                                    ? "Lab is inactive"
                                    : "Unavailable"
                          }
                        >
                          <Copy className="h-3.5 w-3.5 opacity-30" />
                          <span className="hidden sm:inline opacity-50">Unavailable</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Lab Dialog */}
      <LabEditDialog
        editingLab={editingLab}
        onClose={() => setEditingLab(null)}
        onSaved={(updatedLab) => {
          setLabs((current) =>
            current.map((lab) =>
              lab.assignment_id === updatedLab.assignment_id ? updatedLab : lab
            )
          );
          setEditingLab(updatedLab);
        }}
      />
    </div>
  );
}
