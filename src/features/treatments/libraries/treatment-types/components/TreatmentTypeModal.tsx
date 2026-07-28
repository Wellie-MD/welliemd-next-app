import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTreatmentTypes, useSaveTreatmentType } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { TreatmentType } from "@/features/treatments/types";
import { slugify } from "@/features/treatments/api/mappers";

interface TreatmentTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatmentTypeKey?: string | null;
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-700">{children}</code>
);

export function TreatmentTypeModal({ open, onOpenChange, treatmentTypeKey }: TreatmentTypeModalProps) {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { mutate: saveTreatmentType, isPending } = useSaveTreatmentType();

  const [name, setName] = useState("");
  const [intake, setIntake] = useState("");
  const [followup, setFollowup] = useState("");

  useEffect(() => {
    if (!open) return;
    const existing = treatmentTypeKey ? treatmentTypes.find((t) => t.key === treatmentTypeKey) : undefined;
    if (existing) {
      setName(existing.name || "");
      setIntake(existing.intakeVisitType || "");
      setFollowup(existing.followupVisitType || "");
    } else {
      setName("");
      setIntake("");
      setFollowup("");
    }
  }, [treatmentTypeKey, open, treatmentTypes]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Display name is required.", variant: "destructive" });
      return;
    }
    if (!intake.trim()) {
      toast({ title: "Validation Error", description: "Intake visit-type identifier is required.", variant: "destructive" });
      return;
    }

    const existing = treatmentTypeKey ? treatmentTypes.find((t) => t.key === treatmentTypeKey) : undefined;
    const identitySlug = slugify(name.trim());
    const payload: TreatmentType = {
      id: existing?.id || `tt-${identitySlug}`,
      name: name.trim(),
      // Treatment identity comes from the display name. Visit identifiers are
      // provider routing values and are intentionally shareable.
      key: existing?.key || identitySlug,
      intakeVisitType: intake.trim(),
      followupVisitType: followup.trim() || undefined,
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
          description: `Successfully saved "${name.trim()}".`,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save treatment type.", variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-[540px]">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {treatmentTypeKey ? "Edit Treatment Type" : "Create Treatment Type"}
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500">
            {treatmentTypeKey
              ? "Update this treatment type. Visit-type identifiers can be shared with other treatments."
              : "Add a new treatment to the catalog. Multiple treatment types can share the same visit-type identifiers."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900" htmlFor="tt-name">
              Display Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="tt-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Branded GLP, Compounded GLP, Testosterone Replacement"
              data-testid="treatment-type-name"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Human-readable name shown to admins and (often) to patients. This is the treatment type.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900" htmlFor="tt-intake">
              Intake visit-type identifier <span className="text-red-500">*</span>
            </label>
            <Input
              id="tt-intake"
              value={intake}
              onChange={(event) => setIntake(event.target.value)}
              placeholder="e.g., weightloss, trt, ed"
              className="font-mono"
              data-testid="treatment-type-intake"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              System identifier used for routing intake visits. <span className="font-semibold text-slate-700">Can be shared</span> across treatment types — e.g. Branded GLP and Compounded GLP both use <Code>weightloss</Code>.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900" htmlFor="tt-followup">
              Follow-up visit-type identifier
            </label>
            <Input
              id="tt-followup"
              value={followup}
              onChange={(event) => setFollowup(event.target.value)}
              placeholder="e.g., weightlossfollowup, trtFollowup"
              className="font-mono"
              data-testid="treatment-type-followup"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Optional. Enter the exact configured provider identifier. It is never inferred from the intake identifier. Leave blank if this treatment doesn&apos;t have follow-ups.
            </p>
          </div>

          <div className="-mx-6 -mb-6 flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700" data-testid="treatment-type-save">
              {isPending ? "Saving…" : treatmentTypeKey ? "Update Treatment Type" : "Create Treatment Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
