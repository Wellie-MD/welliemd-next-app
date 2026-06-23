import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Box, Copy, Search, RefreshCw, FlaskConical, DollarSign, Power, MapPin, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { clientLabsApi, ClientLabPanel } from "@/api/labs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function getCollectionDetailLabel(method: string) {
  switch (method) {
    case "walk_in_test":
      return "Walk-in test";
    case "at_home_phlebotomy":
      return "At-home kit";
    case "on_site_collection":
      return "On-site collection";
    case "testkit":
      return "Testkit";
    default:
      return getCollectionMethodLabel(method);
  }
}

function getDisplaySpecimen(lab: ClientLabPanel) {
  if (lab.collection_method === "at_home_phlebotomy" || lab.collection_method === "walk_in_test") {
    return "blood draw";
  }
  return lab.sample_type || "serum";
}

function getCreatedAt(index: number) {
  const dates = ["06/10/2026", "06/10/2026", "06/11/2026", "06/11/2026", "06/12/2026", "06/12/2026"];
  return dates[index] || "06/12/2026";
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC", "PR",
];

function getReferenceRange(name: string) {
  const ranges: Record<string, [string, string]> = {
    Glucose: ["mg/dL", "70-99"],
    BUN: ["mg/dL", "7-20"],
    Creatinine: ["mg/dL", "0.6-1.3"],
    Sodium: ["mmol/L", "135-145"],
    Potassium: ["mmol/L", "3.5-5.1"],
    Chloride: ["mmol/L", "98-107"],
    CO2: ["mmol/L", "22-29"],
    Calcium: ["mg/dL", "8.5-10.2"],
    Albumin: ["g/dL", "3.5-5.0"],
    "Total Protein": ["g/dL", "6.0-8.3"],
    ALT: ["U/L", "7-56"],
    AST: ["U/L", "10-40"],
    Bilirubin: ["mg/dL", "0.1-1.2"],
  };

  return ranges[name] || ["mg/dL", "70-99"];
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

      {/* Edit Lab Modal */}
      <Dialog open={!!editingLab} onOpenChange={(open) => !open && setEditingLab(null)}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-[880px] max-h-[92vh] overflow-y-auto p-0 gap-0 border-none rounded-2xl shadow-2xl bg-white text-gray-900">
          {editingLab && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[#e8ebee] p-6 bg-white sticky top-0 z-10">
                <div className="flex gap-3">
                  <span className="w-10 h-10 rounded-[11px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-[17px] font-bold text-gray-900 leading-tight">Edit Product</DialogTitle>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        editingLab.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}>
                        {editingLab.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-[13.5px] font-semibold text-gray-900 mt-1 leading-tight">{editingLab.name}</div>
                    <DialogDescription className="text-[11.5px] text-gray-500 mt-1">
                      Fields marked read-only are managed by the admin and cannot be edited.
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLab(null)}
                  className="border border-[#e8ebee] bg-white rounded-lg w-[30px] h-[30px] flex items-center justify-center cursor-pointer text-gray-550 shrink-0 hover:bg-gray-55"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 bg-[#f7f9fb]">
                {/* Product Information */}
                <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-[#fbfcfd] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                      <Box className="w-[15px] h-[15px]" />
                    </span>
                    <h3 className="text-[13.5px] font-bold text-gray-900">Product Information</h3>
                    <span className="text-[10.5px] font-semibold bg-[#eef1f4] text-[#6b7280] rounded-full px-2 py-0.5">🔒 Admin-managed</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-x-7 gap-y-2 text-xs">
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Product Name</div>
                      <div className="text-[15px] font-semibold text-gray-900 mt-0.5">{editingLab.name}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Product Description</div>
                      <div className="text-[13.5px] font-medium text-gray-900 mt-0.5 leading-relaxed">
                        {editingLab.description || `${editingLab.name} — lab panel collected by blood draw, processed by ${editingLab.lab_provider}.`}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#e8ebee] my-3.5" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-7 gap-y-4 text-xs">
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Test Type</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">Lab</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Purchase Type</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">One Time</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Collection</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{getCollectionDetailLabel(editingLab.collection_method)}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Lab</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.lab_provider}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Sample Type</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5 capitalize">{editingLab.sample_type || "Serum"}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Specimen</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{getDisplaySpecimen(editingLab)}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Fasting Required</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.fasting_required === "yes" ? "Yes" : "No"}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Turnaround</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.turnaround_days || "1-2 days (up to 4 days)"}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Biomarkers</div>
                      <div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.biomarkers.length}</div>
                    </div>
                  </div>

                  <div className="border-t border-[#e8ebee] mt-3.5 pt-3.5 text-xs">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Collection Instructions</div>
                    <p className="text-[13.5px] font-medium text-gray-900 mt-0.5 leading-relaxed">
                      A phlebotomy kit ships to the patient. Collect the sample per the enclosed guide and return it in the prepaid mailer the same day. Fasting 8–12 hours beforehand is required.
                    </p>
                  </div>

                  {/* Junction approval status — locked, admin-managed */}
                  <div className="border-t border-[#e8ebee] mt-3.5 pt-3.5">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Junction Approval Status</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {editingLab.is_orderable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          ✓ Active — Checkout Link available
                        </span>
                      ) : editingLab.junction_status === "pending_submission" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                          Pending Submission — submit from Admin portal
                        </span>
                      ) : editingLab.junction_status === "pending_approval" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Junction Approval
                        </span>
                      ) : editingLab.junction_status === "failed" || editingLab.operational_status === "failed" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                          Submission Failed — contact admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                          {editingLab.junction_status || "Not submitted"}
                        </span>
                      )}
                      {editingLab.junction_lab_test_id && (
                        <span className="font-mono text-[10px] text-gray-400 truncate max-w-[200px]" title={editingLab.junction_lab_test_id}>
                          ID: {editingLab.junction_lab_test_id}
                        </span>
                      )}
                    </div>
                    {editingLab.junction_rejection_reason && (
                      <p className="mt-1.5 text-[11px] text-rose-600">{editingLab.junction_rejection_reason}</p>
                    )}
                  </div>
                </div>

                {/* Panel Composition */}
                <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                        <FlaskConical className="w-[15px] h-[15px]" />
                      </span>
                      <h3 className="text-[13.5px] font-bold text-gray-900">Panel Composition</h3>
                    </div>
                    <span className="text-[10.5px] font-semibold bg-[#e3f3fb] text-[#2b7da6] rounded-full px-2 py-0.5">
                      {editingLab.biomarkers.length} biomarkers
                    </span>
                  </div>
                  <p className="text-xs text-gray-550">
                    Biomarkers measured by this panel and their reference ranges. Collected with an {getCollectionDetailLabel(editingLab.collection_method).toLowerCase()} ({getDisplaySpecimen(editingLab)}); results in {editingLab.turnaround_days || "1-2 days"}.
                  </p>
                  <div className="border border-[#e8ebee] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f7f9fb] text-[10px] uppercase font-bold text-gray-500 border-b border-[#e8ebee]">
                        <tr>
                          <th className="px-3 py-2">Biomarker</th>
                          <th className="px-3 py-2">Units</th>
                          <th className="px-3 py-2">Reference Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8ebee]">
                        {editingLab.biomarkers.map((bm) => {
                          const [units, range] = getReferenceRange(bm.name);
                          return (
                            <tr key={bm.id}>
                              <td className="px-3 py-2 font-semibold text-gray-900">{bm.name}</td>
                              <td className="px-3 py-2 text-gray-550">{units}</td>
                              <td className="px-3 py-2 text-gray-550">{range}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing & Profit */}
                <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                      <DollarSign className="w-[15px] h-[15px]" />
                    </span>
                    <h3 className="text-[13.5px] font-bold text-gray-900">Pricing & Profit</h3>
                    <span className="text-[10.5px] font-semibold bg-[#e3f6ec] text-[#1d8a52] rounded-full px-2 py-0.5">Editable</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Base Price (Patient)</Label>
                      <div className="flex items-center h-[38px] rounded-lg border border-[#e8ebee] bg-white px-3 text-xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                        <span className="text-gray-400 mr-1.5">$</span>
                        <input className="w-full bg-transparent outline-none text-[13px] text-gray-900 font-semibold" defaultValue={editingLab.price.toFixed(2)} />
                      </div>
                      <p className="text-[10.5px] text-[#94a3b8] mt-1">Retail price shown to patients</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Discounted Price (Patient)</Label>
                      <div className="flex items-center h-[38px] rounded-lg border border-[#e8ebee] bg-white px-3 text-xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                        <span className="text-gray-400 mr-1.5">$</span>
                        <input className="w-full bg-transparent outline-none text-[13px] text-gray-900 font-semibold" placeholder="0.00" />
                      </div>
                      <p className="text-[10.5px] text-[#94a3b8] mt-1">Optional promotional price</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Shipping Fee (Patient)</Label>
                      <div className="flex items-center h-[38px] rounded-lg border border-[#e8ebee] bg-white px-3 text-xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                        <span className="text-gray-400 mr-1.5">$</span>
                        <input className="w-full bg-transparent outline-none text-[13px] text-gray-900 font-semibold" placeholder="0.00" />
                      </div>
                      <p className="text-[10.5px] text-[#94a3b8] mt-1">Per-patient fee</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="border border-[#e8ebee] rounded-[12px] p-3.5 bg-[#f7f9fb] text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <b className="text-[13px] text-gray-800">Your cost</b>
                        <span className="text-[10.5px] font-semibold bg-[#eef1f4] text-[#6b7280] rounded-full px-2 py-0.5">🔒 Admin-managed</span>
                      </div>
                      <div className="flex justify-between py-1 text-[12.5px]">
                        <span className="text-gray-550">Cost to client (lab)</span>
                        <span className="font-semibold text-gray-900">${editingLab.cost_to_client.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-[12.5px]">
                        <span className="text-gray-555">Draw / handling</span>
                        <span className="font-semibold text-gray-900">$0.00</span>
                      </div>
                      <div className="border-t border-[#e8ebee] my-1.5" />
                      <div className="flex justify-between py-1 text-[12.5px]">
                        <b className="text-gray-900">Total cost</b>
                        <b className="text-gray-900">${editingLab.cost_to_client.toFixed(2)}</b>
                      </div>
                    </div>

                    <div className="border border-[#cdebd9] rounded-[12px] p-3.5 bg-[#f1faf4] text-xs">
                      <b className="text-[13px] text-gray-800 block mb-1.5">Profit breakdown</b>
                      <div className="flex justify-between py-1 text-[12.5px]">
                        <span className="text-gray-555">Patient pays</span>
                        <span className="font-semibold text-gray-900">${editingLab.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-[12.5px]">
                        <span className="text-gray-555">Shipping fee</span>
                        <span className="font-semibold text-gray-900">+$0.00</span>
                      </div>
                      <div className="flex justify-between py-1 text-[12.5px]">
                        <span className="text-gray-555">Your cost</span>
                        <span className="font-semibold text-gray-900">-${editingLab.cost_to_client.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-[#cdebd9] my-1.5" />
                      <div className="flex items-end justify-between">
                        <b className="text-[13px] text-gray-900">Profit per order</b>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-[#1d8a52]">${(editingLab.price - editingLab.cost_to_client).toFixed(2)}</span>
                          <span className="text-[10.5px] font-semibold bg-[#dcf3e5] text-[#1d8a52] rounded-full px-2 py-0.5">
                            {editingLab.price > 0 ? `${Math.round(((editingLab.price - editingLab.cost_to_client) / editingLab.price) * 100)}%` : "0%"}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10.5px] text-gray-400 mt-1.5">Excludes visit cost</div>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                      <Power className="w-[15px] h-[15px]" />
                    </span>
                    <h3 className="text-[13.5px] font-bold text-gray-900">Availability</h3>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-555 max-w-[60%]">
                      Inactive products are hidden from product selection in intake.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-900">{editingLab.is_active ? "Active" : "Inactive"}</div>
                        <div className="text-[10px] text-gray-505">
                          {editingLab.is_active ? "Shown in product selection" : "Hidden from product selection"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${editingLab.is_active ? "bg-[#46b6e6]" : "bg-[#cbd5e1]"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${editingLab.is_active ? "left-[22px]" : "left-[2px]"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Service States */}
                <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                      <MapPin className="w-[15px] h-[15px]" />
                    </span>
                    <h3 className="text-[13.5px] font-bold text-gray-900">Service States</h3>
                    <span className="ml-auto text-[10.5px] font-semibold bg-[#e3f3fb] text-[#2b7da6] rounded-full px-2 py-0.5">
                      {editingLab.service_states.length} of {US_STATES.length} active
                    </span>
                  </div>
                  <p className="text-xs text-gray-555">
                    Select the states where this assigned product should remain available. You can only choose states configured by admin.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs border border-[#e8ebee] bg-white text-gray-900 rounded-full px-3 font-semibold hover:bg-gray-50">
                      Select all states
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:bg-transparent hover:text-gray-700">
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {US_STATES.map((state) => {
                      const selected = editingLab.service_states.includes(state);
                      return (
                        <button
                          key={state}
                          type="button"
                          className={`border rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors duration-150 ${
                            selected
                              ? "bg-[#46b6e6] border-[#46b6e6] text-white"
                              : "bg-white border-[#e8ebee] text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {state}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Image */}
                <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                      <ImageIcon className="w-[15px] h-[15px]" />
                    </span>
                    <h3 className="text-[13.5px] font-bold text-gray-900">Product Image</h3>
                    <span className="text-[10.5px] font-semibold bg-[#e3f6ec] text-[#1d8a52] rounded-full px-2 py-0.5">Editable</span>
                  </div>
                  <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[#e8ebee] bg-white p-6 text-center hover:bg-gray-50">
                    <span className="w-11 h-11 rounded-full bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </span>
                    <span className="mt-2 text-[13.5px] font-semibold text-gray-900">Click to upload</span>
                    <span className="text-[13px] text-gray-500">or drag and drop an image here</span>
                    <span className="mt-2 text-[10.5px] font-semibold bg-[#eef1f4] text-[#6b7280] rounded-full px-2 py-0.5">PNG or JPG · up to 5MB</span>
                    <input type="file" accept="image/png,image/jpeg" className="hidden" />
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-[#e8ebee] px-6 py-3.5 sticky bottom-0 bg-white z-10">
                <Button
                  variant="outline"
                  onClick={() => setEditingLab(null)}
                  className="border border-[#e8ebee] bg-white text-gray-700 hover:bg-gray-55 rounded-lg px-4 h-9 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setEditingLab(null)}
                  className="bg-[#46b6e6] border border-[#46b6e6] text-white hover:bg-[#3ca4cf] rounded-lg px-4 h-9 text-xs font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
