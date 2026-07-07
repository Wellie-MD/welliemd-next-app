import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { CatalogItem, CatalogLab } from "@/api/labs";

type CollectionMethod = "at_home_phlebotomy" | "walk_in_test" | "testkit" | "on_site_collection";

interface SelectedBiomarker extends CatalogItem { }

interface CreateFormState {
  lab_provider_id: string;
  lab_provider: string;
  catalog_item_ids: string[];
  name: string;
  description: string;
  fasting_required: "yes" | "no";
  collection_method: CollectionMethod;
}

const INITIAL_FORM: CreateFormState = {
  lab_provider_id: "",
  lab_provider: "",
  catalog_item_ids: [],
  name: "",
  description: "",
  fasting_required: "no",
  collection_method: "at_home_phlebotomy",
};

const COLLECTION_METHOD_LABELS: Record<CollectionMethod, string> = {
  at_home_phlebotomy: "At Home Phlebotomy",
  walk_in_test: "Walk-in test",
  testkit: "Test kit",
  on_site_collection: "On-site collection",
};

type WizardStep = "select" | "metadata";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogLabs: CatalogLab[];
  catalogItems: CatalogItem[];
  labFilter: string;
  onLabFilterChange: (v: string) => void;
  onCreate: (form: CreateFormState) => Promise<void>;
  biomarkerIds: string[];
  onBiomarkerIdsChange: (ids: string[]) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export type { CreateFormState };

export default function TestCreatePanel({
  open,
  onOpenChange,
  catalogLabs,
  catalogItems,
  labFilter,
  onLabFilterChange,
  onCreate,
  biomarkerIds,
  onBiomarkerIdsChange,
  isExpanded = false,
  onToggleExpand,
}: Props) {
  const [form, setForm] = useState<CreateFormState>({ ...INITIAL_FORM });
  const [step, setStep] = useState<WizardStep>("select");
  const [creating, setCreating] = useState(false);

  const selectedItems = useMemo(() => {
    const cache = new Map(catalogItems.map((i) => [i.id, i]));
    return biomarkerIds
      .map((id) => cache.get(id))
      .filter((item): item is SelectedBiomarker => Boolean(item));
  }, [catalogItems, biomarkerIds]);

  const canContinue = form.lab_provider_id && biomarkerIds.length > 0;

  const handleLabSelect = (value: string) => {
    const lab = catalogLabs.find((l) => l.id === value);
    setForm((prev) => ({
      ...prev,
      lab_provider_id: value,
      lab_provider: lab?.name ?? "",
    }));
    onBiomarkerIdsChange([]);
    onLabFilterChange(value);
  };

  const handleRemoveBiomarker = (id: string) => {
    onBiomarkerIdsChange(biomarkerIds.filter((bid) => bid !== id));
  };

  const handleContinue = () => {
    if (canContinue) setStep("metadata");
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreate({
        ...form,
        catalog_item_ids: biomarkerIds,
      });
      handleClose();
    } catch {
      // error handled by parent
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setForm({ ...INITIAL_FORM });
    setStep("select");
    onBiomarkerIdsChange([]);
    onLabFilterChange("all");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="w-full bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-6">
      <div className="px-6 py-5 border-b shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Create draft panel
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate from the Junction reference catalog. Finish pricing and availability on the Labs page before assigning it.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200"
              title={isExpanded ? "Minimize panel" : "Maximize panel"}
            >
              {isExpanded ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 14h6v-6M20 10h-6v6M14 10l7-7M10 14l-7 7" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200"
            title="Close workspace"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step === "select" ? (
          <>
            {/* Step 1 — Choose your lab */}
            <div className="px-6 pt-5 pb-4 border-b">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                STEP 1
              </p>
              <Label className="text-sm font-semibold mt-1 block">
                Choose your lab
              </Label>
              <div className="mt-2">
                <Select value={form.lab_provider_id} onValueChange={handleLabSelect}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg shadow-sm focus:ring-1 focus:ring-blue-600 focus:ring-offset-0 bg-white hover:bg-slate-50/50 transition-colors font-semibold text-slate-700">
                    <SelectValue placeholder="Select A Lab">
                      {form.lab_provider ? `Lab: ${form.lab_provider}` : "Select A Lab"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {catalogLabs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Step 2 — Choose your biomarkers */}
            <div className="px-6 pt-4 pb-4 border-b">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                STEP 2
              </p>
              <Label className="text-sm font-semibold mt-1 block">
                {selectedItems.length > 0
                  ? `${selectedItems.length} catalog item${selectedItems.length === 1 ? "" : "s"} selected`
                  : "Choose your catalog items"}
              </Label>
              <div className="mt-3">
                {selectedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 px-6 py-10 text-center flex flex-col items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-400 mb-2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-slate-500">No catalog items selected</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                      Search and click "Add to test" in the catalog table on the left to include reference items in this draft.
                    </p>
                  </div>
                ) : (
                  <div className={`grid gap-2 ${isExpanded ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-blue-200 bg-blue-50/30 px-4 py-3 shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs break-words tracking-tight uppercase">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {item.lab_name}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                            onClick={() => handleRemoveBiomarker(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M8 12h8" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={`px-6 pt-5 pb-4 ${isExpanded ? "grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8" : "space-y-4"}`}>
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                STEP 3
              </p>
              <Label className="text-sm font-semibold">Name your draft panel</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Comprehensive Metabolic Panel"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                STEP 4
              </p>
              <Label className="text-sm font-semibold">Describe your draft panel</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional admin context"
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                STEP 5
              </p>
              <Label className="text-sm font-semibold">Is fasting required?</Label>
              <Select
                value={form.fasting_required}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    fasting_required: v as "yes" | "no",
                  }))
                }
              >
                <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg shadow-sm focus:ring-1 focus:ring-blue-600 focus:ring-offset-0 bg-white hover:bg-slate-50/50 transition-colors font-semibold text-slate-700">
                  <SelectValue>
                    {form.fasting_required === "yes" ? "Yes" : "No"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                STEP 6
              </p>
              <Label className="text-sm font-semibold">Choose your collection method</Label>
              <Select
                value={form.collection_method}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    collection_method: v as CollectionMethod,
                  }))
                }
              >
                <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg shadow-sm focus:ring-1 focus:ring-blue-600 focus:ring-offset-0 bg-white hover:bg-slate-50/50 transition-colors font-semibold text-slate-700">
                  <SelectValue>
                    {form.collection_method ? `Method: ${COLLECTION_METHOD_LABELS[form.collection_method]}` : "Choose Method"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="at_home_phlebotomy">At Home Phlebotomy</SelectItem>
                  <SelectItem value="walk_in_test">Walk-in test</SelectItem>
                  <SelectItem value="testkit">Test kit</SelectItem>
                  <SelectItem value="on_site_collection">On-site collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-3">
          {step === "metadata" ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              &lt; Back
            </Button>
          ) : (
            <div />
          )}
           {step === "select" ? (
             <Button
               onClick={handleContinue}
               disabled={!canContinue}
               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg px-6 py-2 transition-all duration-200"
             >
               Continue
             </Button>
           ) : (
              <Button
                onClick={handleCreate}
                disabled={creating || !form.name}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg px-6 py-2 transition-all duration-200"
              >
                {creating ? "Creating…" : "Create draft panel"}
              </Button>
           )}
        </div>
      </div>
  );
}
