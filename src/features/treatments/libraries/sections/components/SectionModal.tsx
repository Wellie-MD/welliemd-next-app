import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
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
import { baseVisitTypes } from "@/features/treatments/common/data/visitTypes";
import { cn } from "@/lib/utils";

interface SectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: CommonSection | null;
}

export function SectionModal({ open, onOpenChange, section }: SectionModalProps) {
  const { mutate: saveSection, isPending } = useSaveSection();
  const { data: treatmentTypes = [] } = useTreatmentTypes();

  const [name, setName] = useState("");
  const [scope, setScope] = useState<TreatmentLibraryScope | "">("");
  const [visitTypeKeys, setVisitTypeKeys] = useState<string[]>([]);
  const [visitTypePickerOpen, setVisitTypePickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName(section?.name ?? "");
    setScope(section?.scope ?? "");
    setVisitTypeKeys(section?.visitTypeKeys ?? []);
  }, [open, section]);

  // Visit types available to pick from: the standard set plus any already
  // attached to this section (in case it references one outside the list).
  const visitTypeOptions = useMemo(() => {
    const keys = new Set(baseVisitTypes);
    treatmentTypes.forEach((type) => {
      if (type.intakeVisitType) keys.add(type.intakeVisitType);
      if (type.followupVisitType) keys.add(type.followupVisitType);
    });
    (section?.visitTypeKeys ?? []).forEach((key) => keys.add(key));
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [section, treatmentTypes]);

  const isTreatment = scope === "treatment";
  const isShared = scope === "shared";
  const title = section ? "Edit Section" : "Create Section";
  const submitLabel = section ? "Save Changes" : "Create Section";

  const canSubmit = useMemo(() => {
    if (!name.trim() || !scope) return false;
    if ((isTreatment || isShared) && visitTypeKeys.length === 0) return false;
    return true;
  }, [isShared, isTreatment, name, scope, visitTypeKeys]);

  const handleScopeChange = (value: TreatmentLibraryScope) => {
    setScope(value);
    if (value === "global") setVisitTypeKeys([]);
    else if (value === "treatment") setVisitTypeKeys((current) => (current[0] ? [current[0]] : []));
  };

  const toggleVisitType = (key: string, checked: boolean) => {
    setVisitTypeKeys((current) =>
      checked ? [...current, key] : current.filter((item) => item !== key)
    );
  };

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
      visitTypeKeys: scope === "global" ? [] : visitTypeKeys,
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
      <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
          <DialogTitle className="text-base font-semibold text-slate-950">{title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {section ? "Update section settings." : "Create a reusable patient data section."}
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
              <Select value={scope} onValueChange={(value) => handleScopeChange(value as TreatmentLibraryScope)}>
                <SelectTrigger id="section-scope" className="h-10 border-slate-300 text-sm" data-testid="section-scope-select">
                  <SelectValue placeholder="Select scope..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global - Shown to all patients</SelectItem>
                  <SelectItem value="shared">Shared - Multiple visit types</SelectItem>
                  <SelectItem value="treatment">Treatment Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isTreatment ? (
              <div className="space-y-2">
                <Label htmlFor="section-visit-type" className="text-xs font-medium text-slate-900">
                  Visit Type<span className="text-red-500">*</span>
                </Label>
                <Select value={visitTypeKeys[0] ?? ""} onValueChange={(value) => setVisitTypeKeys([value])}>
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

            {isShared ? (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-900">
                  Visit Types<span className="text-red-500">*</span>
                </Label>
                <Popover open={visitTypePickerOpen} onOpenChange={setVisitTypePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={visitTypePickerOpen}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm"
                      data-testid="section-visit-types-trigger"
                    >
                      <span className={cn("truncate", visitTypeKeys.length === 0 && "text-slate-500")}>
                        {visitTypeKeys.length === 0 ? "Select visit types..." : `${visitTypeKeys.length} selected`}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {visitTypeOptions.map((key) => {
                            const checked = visitTypeKeys.includes(key);
                            return (
                              <CommandItem
                                key={key}
                                onSelect={() => toggleVisitType(key, !checked)}
                                className="cursor-pointer text-sm"
                                data-testid={`section-visit-type-${key}`}
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                                    checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                                  )}
                                >
                                  {checked && <Check className="h-3 w-3" />}
                                </div>
                                <code className="text-xs">{key}</code>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {visitTypeKeys.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {visitTypeKeys.map((key) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-blue-700"
                      >
                        {key}
                        <button
                          type="button"
                          onClick={() => toggleVisitType(key, false)}
                          className="rounded-full p-0.5 hover:bg-blue-100"
                          aria-label={`Remove ${key}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  This section will appear for patients on any of the selected visit types.
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
