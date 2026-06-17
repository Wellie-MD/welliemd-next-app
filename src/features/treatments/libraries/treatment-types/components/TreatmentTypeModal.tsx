import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTreatmentTypes, useSaveTreatmentType } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { TreatmentType } from "@/features/treatments/types";

interface TreatmentTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatmentTypeKey?: string | null;
}

export function TreatmentTypeModal({ open, onOpenChange, treatmentTypeKey }: TreatmentTypeModalProps) {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { mutate: saveTreatmentType, isPending } = useSaveTreatmentType();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [followupVisitType, setFollowupVisitType] = useState("");

  useEffect(() => {
    if (treatmentTypeKey) {
      const existing = treatmentTypes.find((t) => t.key === treatmentTypeKey);
      if (existing) {
        setName(existing.name || "");
        setKey(existing.key || "");
        setFollowupVisitType(existing.followupVisitType || "");
      }
    } else {
      setName("");
      setKey("");
      setFollowupVisitType("");
    }
  }, [treatmentTypeKey, open, treatmentTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }
    if (!key.trim()) {
      toast({
        title: "Validation Error",
        description: "Intake Visit Type is required.",
        variant: "destructive",
      });
      return;
    }

    const existing = treatmentTypes.find((t) => t.key === treatmentTypeKey);
    const payload: TreatmentType = {
      id: existing?.id || key.trim(),
      name,
      key: key.trim(),
      intakeVisitType: key.trim(),
      followupVisitType: followupVisitType.trim() || undefined,
      description: existing?.description || "",
      programCount: existing?.programCount || 0,
      productCount: existing?.productCount || 0,
      sectionCount: existing?.sectionCount || 0,
      consentCount: existing?.consentCount || 0,
      isActive: existing?.isActive ?? true,
    };

    saveTreatmentType(payload, {
      onSuccess: () => {
        toast({
          title: treatmentTypeKey ? "Treatment Type Updated" : "Treatment Type Created",
          description: `Successfully saved "${name}".`,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save treatment type.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-50 overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {treatmentTypeKey ? "Edit Treatment Type" : "Create Treatment Type"}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {treatmentTypeKey 
              ? "Update this treatment type. Visit-type identifiers can be shared with other treatments." 
              : "Add a new treatment to the catalog. Multiple treatment types can share the same visit-type identifiers."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 bg-white space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Branded GLP-1"
              required
            />
            <p className="text-xs text-slate-500 mt-1.5">Human-readable name shown to admins and patients.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Intake Visit Type <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!!treatmentTypeKey} // Keep key read-only on edit to prevent identity mismatch
              placeholder="e.g., weightloss"
              required
              className="font-mono"
            />
            <p className="text-xs text-slate-500 mt-1.5">System identifier used for routing intake visits. Can be shared.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Follow-up Visit Type
            </label>
            <Input
              type="text"
              value={followupVisitType}
              onChange={(e) => setFollowupVisitType(e.target.value)}
              placeholder="e.g., weightloss_fu"
              className="font-mono"
            />
            <p className="text-xs text-slate-500 mt-1.5">System identifier for follow-ups.</p>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
              {isPending ? "Saving..." : treatmentTypeKey ? "Update Treatment Type" : "Create Treatment Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
