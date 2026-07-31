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
import { cn } from "@/lib/utils";

interface SectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: CommonSection | null;
}

const sectionSaveErrorMessage = (error: unknown): string => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    const direct = [body.detail, body.message, body.error].find(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
    if (direct) return direct;
    const fieldMessages = Object.entries(body)
      .flatMap(([field, value]) => {
        if (Array.isArray(value)) return value.map((item) => `${field}: ${String(item)}`);
        if (typeof value === "string") return [`${field}: ${value}`];
        return [];
      })
      .filter(Boolean);
    if (fieldMessages.length) return fieldMessages.join(" ");
  }
  if (error instanceof Error && error.message) return error.message;
  return "The section could not be saved. Review the section scope and Visit Type selections.";
};

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

  // Visit Types are read-only route identities derived from Treatment Types.
  // The Admin cannot invent a Visit Type in this picker.
  const visitTypeOptions = useMemo(() => {
    const keys = new Set<string>();
    treatmentTypes.forEach((type) => {
      if (type.intakeVisitType) keys.add(type.intakeVisitType);
      if (type.followupVisitType) keys.add(type.followupVisitType);
    });
    (section?.visitTypeKeys ?? []).forEach((key) => keys.add(key));
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [section, treatmentTypes]);

  const isVisitTypeScoped = scope === "visit_type";
  const title = section ? "Edit Section" : "Create Section";
  const submitLabel = section ? "Save Changes" : "Create Section";
  const nameTooLong = name.trim().length > 200;

  const canSubmit = useMemo(() => {
    if (!name.trim() || nameTooLong || !scope) return false;
    if (isVisitTypeScoped && visitTypeKeys.length === 0) return false;
    return true;
  }, [isVisitTypeScoped, name, scope, visitTypeKeys]);

  const handleScopeChange = (value: TreatmentLibraryScope) => {
    setScope(value);
    if (value === "global") setVisitTypeKeys([]);
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
        description: nameTooLong
          ? "Section names must be 200 characters or fewer."
          : isVisitTypeScoped && visitTypeKeys.length === 0
            ? "Select at least one Visit Type. Visit Types come from Treatment Type routes."
            : "Section name and scope are required.",
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
      onError: (error) => {
        toast({
          title: "Save Failed",
          description: sectionSaveErrorMessage(error),
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
                maxLength={200}
              />
              <p className={cn("text-xs", nameTooLong ? "text-red-600" : "text-slate-500")}>
                {name.trim().length}/200 characters
              </p>
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
                  <SelectItem value="visit_type">Selected Visit Types</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isVisitTypeScoped ? (
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
                  This section will appear for patients on any selected Visit Type. Visit Types are read-only routes supplied by Treatment Type configuration.
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
