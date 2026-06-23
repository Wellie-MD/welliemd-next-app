/**
 * LabCreateModal — "Create Lab Panel" dialog.
 * Handles lab provider selection, biomarker picker, and panel metadata.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Biomarker, type CatalogLab } from "@/api/labs";
import { type CreateFormState } from "@/features/labs/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateFormState;
  onFormChange: (updater: (prev: CreateFormState) => CreateFormState) => void;
  biomarkers: Biomarker[];
  catalogLabs: CatalogLab[];
  markerSearch: string;
  onMarkerSearchChange: (value: string) => void;
  groupedBiomarkers: { category: string; items: Biomarker[] }[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function LabCreateModal({
  open,
  onOpenChange,
  form,
  onFormChange,
  biomarkers,
  catalogLabs,
  markerSearch,
  onMarkerSearchChange,
  groupedBiomarkers,
  onSubmit,
}: Props) {
  const navigate = useNavigate();

  const toggleBiomarker = (id: string) => {
    onFormChange(prev => ({
      ...prev,
      biomarkers: prev.biomarkers.includes(id)
        ? prev.biomarkers.filter(b => b !== id)
        : [...prev.biomarkers, id],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-lg font-bold">Create Lab Panel</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 leading-normal">
            Pick a lab, choose its biomarkers, then name the panel. Orders route through
            Junction to that lab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Lab Provider */}
          <div className="space-y-1.5">
            <Label htmlFor="lab_provider" className="font-semibold text-xs text-foreground">
              Choose your lab *
            </Label>
            <Select
              value={form.lab_provider_id}
              onValueChange={val => {
                const lab = catalogLabs.find(l => l.id === val);
                onFormChange(prev => ({
                  ...prev,
                  lab_provider_id: val,
                  lab_provider: lab?.name ?? "",
                  biomarkers: [],
                }));
                onMarkerSearchChange("");
              }}
            >
              <SelectTrigger id="lab_provider" className="h-9 text-xs">
                <SelectValue placeholder="Select a lab..." />
              </SelectTrigger>
              <SelectContent>
                {catalogLabs.map(lab => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.name}
                    {lab.marker_count ? ` (${lab.marker_count})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground leading-normal mt-1">
              The lab that fulfills this panel — biomarkers below are filtered to it. At
              order time the <code>lab_account_id</code> is the ordering client's linked
              account for this lab.
            </p>
          </div>

          {/* Biomarker picker */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs text-foreground">
              Choose your biomarkers
            </Label>
            <p className="text-[10.5px] text-muted-foreground mb-1.5 leading-normal">
              Sent as <code>provider_ids</code> (preferred, sandbox-to-production stable)
              or <code>marker_ids</code> as fallback when ordering through Junction.
            </p>
            <Input
              placeholder="Filter biomarkers…"
              value={markerSearch}
              onChange={e => onMarkerSearchChange(e.target.value)}
              disabled={!form.lab_provider_id}
              className="h-8 text-xs placeholder:text-muted-foreground/80 mb-2"
            />
            <div className="border border-border/80 rounded-lg p-2 max-h-48 overflow-y-auto bg-background/50 space-y-2.5">
              {!form.lab_provider_id ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {catalogLabs.length === 0 ? (
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">No Junction labs available.</p>
                      <p>Sync the Junction marker catalog first.</p>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          navigate("/dashboard/settings/junction-labs");
                        }}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Go to Junction Settings → Sync marker catalog
                      </button>
                    </div>
                  ) : (
                    "Select a lab above to choose biomarkers."
                  )}
                </div>
              ) : groupedBiomarkers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                  {biomarkers.length === 0 ? (
                    <>
                      <p className="font-medium text-foreground">No biomarkers available.</p>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          navigate("/dashboard/settings/junction-labs");
                        }}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Go to Junction Settings → Sync marker catalog
                      </button>
                    </>
                  ) : (
                    <p>No biomarkers match for this lab.</p>
                  )}
                </div>
              ) : (
                groupedBiomarkers.map(group => (
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
                            checked={form.biomarkers.includes(bm.id)}
                            onCheckedChange={() => toggleBiomarker(bm.id)}
                            className="h-4 w-4"
                          />
                          <span className="font-medium text-foreground truncate">
                            {bm.name}
                          </span>
                          <span
                            className="ml-auto font-mono text-[10px] text-muted-foreground/80 pr-1 max-w-[150px] truncate"
                            title={`Provider ID: ${bm.provider_id ?? "N/A"} · Marker ID: ${bm.junction_marker_id ?? "N/A"}`}
                          >
                            {bm.display_code ?? bm.provider_id ?? bm.junction_marker_id ?? bm.slug}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-[11.5px] text-muted-foreground mt-1">
              {form.biomarkers.length === 0
                ? "No biomarkers selected yet."
                : `${form.biomarkers.length} biomarker${form.biomarkers.length === 1 ? "" : "s"} selected.`}
            </p>
          </div>

          {/* Panel Name */}
          <div className="space-y-1.5">
            <Label htmlFor="panel-name" className="font-semibold text-xs text-foreground">
              Name your lab panel *
            </Label>
            <Input
              id="panel-name"
              required
              placeholder="e.g., Comprehensive Metabolic Panel"
              value={form.name}
              onChange={e => onFormChange(prev => ({ ...prev, name: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="panel-desc" className="font-semibold text-xs text-foreground">
              Describe your lab panel
            </Label>
            <Textarea
              id="panel-desc"
              placeholder="Optional clinical context"
              rows={2}
              value={form.description}
              onChange={e => onFormChange(prev => ({ ...prev, description: e.target.value }))}
              className="text-xs resize-none"
            />
          </div>

          {/* Fasting + Collection method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fasting" className="font-semibold text-xs text-foreground">
                Is fasting required?
              </Label>
              <Select
                value={form.fasting_required}
                onValueChange={val =>
                  onFormChange(prev => ({ ...prev, fasting_required: val as "yes" | "no" }))
                }
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
              <Label htmlFor="collection" className="font-semibold text-xs text-foreground">
                Collection method
              </Label>
              <Select
                value={form.collection_method}
                onValueChange={val =>
                  onFormChange(prev => ({
                    ...prev,
                    collection_method: val as CreateFormState["collection_method"],
                  }))
                }
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

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cost_client" className="font-semibold text-xs text-foreground">
                Cost to Client ($)
              </Label>
              <Input
                id="cost_client"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={form.cost_to_client || ""}
                onChange={e =>
                  onFormChange(prev => ({ ...prev, cost_to_client: parseFloat(e.target.value) || 0 }))
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost_welliemd" className="font-semibold text-xs text-foreground">
                Cost to WellieMD ($)
              </Label>
              <Input
                id="cost_welliemd"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={form.cost_to_welliemd || ""}
                onChange={e =>
                  onFormChange(prev => ({ ...prev, cost_to_welliemd: parseFloat(e.target.value) || 0 }))
                }
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-lg">
            <div>
              <span className="font-semibold text-xs text-foreground block">
                WellieMD availability:{" "}
                <strong className="font-bold">{form.is_active ? "Enabled" : "Disabled"}</strong>
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Locked — enable after Junction approves this panel.
              </span>
            </div>
            <Switch
              id="create-active"
              checked={form.is_active}
              onCheckedChange={val => onFormChange(prev => ({ ...prev, is_active: val }))}
            />
          </div>

          <DialogFooter className="gap-2 md:gap-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
            >
              Create Lab Panel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
