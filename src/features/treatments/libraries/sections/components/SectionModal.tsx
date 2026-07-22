import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveSection, useTreatmentTypes } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { CommonSection, TreatmentLibraryScope } from "@/features/treatments/types";
import { createMockId, currentDateStamp } from "@/features/treatments/common/data/factories";

interface SectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: CommonSection | null;
}

export function SectionModal({ open, onOpenChange, section }: SectionModalProps) {
  const { mutate: saveSection, isPending } = useSaveSection();
  const { data: treatmentTypes = [] } = useTreatmentTypes();

  const visitTypeOptions = useMemo(() => {
    const keys = new Set<string>();
    treatmentTypes.forEach((type) => {
      if (type.intakeVisitType) keys.add(type.intakeVisitType);
      if (type.followupVisitType) keys.add(type.followupVisitType);
    });
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [treatmentTypes]);

  const [name, setName] = useState("");
  const [scope, setScope] = useState<TreatmentLibraryScope | "">("");
  const [visitType, setVisitType] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(section?.name ?? "");
    setScope(section?.scope ?? "");
    setVisitType(section?.visitTypeKeys[0] ?? "");
  }, [open, section]);

  const isTreatmentSpecific = scope === "treatment" || scope === "shared";
  const title = section ? "Edit Section" : "Create Section";
  const submitLabel = section ? "Save Changes" : "Create Section";

  const canSubmit = useMemo(() => {
    if (!name.trim() || !scope) return false;
    if (isTreatmentSpecific && !visitType) return false;
    return true;
  }, [isTreatmentSpecific, name, scope, visitType]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || !scope) {
      toast({
        title: "Validation Error",
        description: "Section name and scope are required.",
        variant: "destructive",
      });
      return;
    }

    const payload: CommonSection = {
      id: section?.id ?? createMockId("section"),
      name: name.trim(),
      scope,
      visitTypeKeys: isTreatmentSpecific ? [visitType] : [],
      fieldCount: section?.fieldCount ?? 0,
      updatedAt: currentDateStamp(),
    };

    saveSection(payload, {
      onSuccess: () => {
        toast({
          title: section ? "Section Updated" : "Section Created",
          description: `${payload.name} has been saved.`,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Save Failed",
          description: "The section could not be saved.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
          <DialogTitle className="text-base font-semibold text-slate-950">{title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Create a reusable patient data section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="section-name" className="text-xs font-medium text-slate-900">
                Section Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="section-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g., Medical Baseline, Identity Verification"
                className="h-10 border-slate-300 text-sm"
                data-testid="section-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-scope" className="text-xs font-medium text-slate-900">
                Scope<span className="text-red-500">*</span>
              </Label>
              <Select value={scope} onValueChange={(value) => setScope(value as TreatmentLibraryScope)}>
                <SelectTrigger id="section-scope" className="h-10 border-slate-300 text-sm" data-testid="section-scope-select">
                  <SelectValue placeholder="Select scope..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global - Shown to all patients</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="treatment">Treatment Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isTreatmentSpecific ? (
              <div className="space-y-2">
                <Label htmlFor="section-visit-type" className="text-xs font-medium text-slate-900">
                  Visit Type<span className="text-red-500">*</span>
                </Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger id="section-visit-type" className="h-10 border-slate-300 text-sm" data-testid="section-visit-type-select">
                    <SelectValue placeholder="Select visit type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {visitTypeOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  This section will only appear for patients on the selected visit type.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-4 text-xs font-semibold"
              onClick={() => onOpenChange(false)}
              data-testid="section-modal-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              className="h-9 bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
              data-testid="section-modal-submit"
            >
              {isPending ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
