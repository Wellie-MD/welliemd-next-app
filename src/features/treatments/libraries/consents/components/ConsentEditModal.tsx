import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/primitives/RichTextEditor";
import { Trash2, Plus, Check, X } from "lucide-react";
import {
  useConsents,
  useSaveConsent,
  useTreatmentTypes,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { ConsentForm, ConsentOption, TreatmentLibraryScope } from "@/features/treatments/types";
import { createMockId, currentDateStamp } from "@/features/treatments/common/data/factories";
import { cn } from "@/lib/utils";

interface ConsentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consentId?: string | null;
}

const defaultOption = (): ConsentOption => ({
  id: createMockId("opt"),
  text: "I understand and agree",
  disqualifies: false,
});

export function ConsentEditModal({ open, onOpenChange, consentId }: ConsentEditModalProps) {
  const { data: consents = [] } = useConsents();
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { mutate: saveConsent, isPending } = useSaveConsent();

  const [name, setName] = useState("");
  const [scope, setScope] = useState<TreatmentLibraryScope>("global");
  const [visitTypeKeys, setVisitTypeKeys] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<ConsentOption[]>([defaultOption()]);

  const existing = useMemo(
    () => (consentId ? consents.find((c) => c.id === consentId) : undefined),
    [consentId, consents]
  );

  // Visit Types are derived from the Treatment Type catalog and are read-only
  // route identities; operators cannot invent an arbitrary value here.
  const visitTypeOptions = useMemo(() => {
    const keys = new Set<string>();
    treatmentTypes.forEach((type) => {
      if (type.intakeVisitType) keys.add(type.intakeVisitType);
      if (type.followupVisitType) keys.add(type.followupVisitType);
    });
    (existing?.visitTypeKeys ?? []).forEach((key) => keys.add(key));
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [treatmentTypes, existing]);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setName(existing.name || "");
      setScope(existing.scope === "global" ? "global" : "visit_type");
      setVisitTypeKeys(existing.visitTypeKeys ?? []);
      setText(existing.text || "");
      setOptions(existing.options?.length ? existing.options : [defaultOption()]);
    } else {
      setName("");
      setScope("global");
      setVisitTypeKeys([]);
      setText("");
      setOptions([defaultOption()]);
    }
  }, [existing, open]);

  const handleScopeChange = (next: TreatmentLibraryScope) => {
    setScope(next);
    if (next === "global") setVisitTypeKeys([]);
  };

  const toggleVisitType = (key: string, checked: boolean) => {
    setVisitTypeKeys((current) =>
      checked ? [...current, key] : current.filter((item) => item !== key)
    );
  };

  const handleAddOption = () =>
    setOptions((current) => [...current, { id: createMockId("opt"), text: "", disqualifies: false }]);

  const handleRemoveOption = (id: string) =>
    setOptions((current) => current.filter((option) => option.id !== id));

  const handleOptionTextChange = (id: string, value: string) =>
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, text: value } : option)));

  const handleOptionDisqualifiesChange = (id: string, value: boolean) =>
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, disqualifies: value } : option)));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Consent name is required.", variant: "destructive" });
      return;
    }
    if (!text.replace(/<[^>]*>/g, "").trim()) {
      toast({ title: "Validation Error", description: "Consent text is required.", variant: "destructive" });
      return;
    }
    if (scope === "visit_type" && visitTypeKeys.length === 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one Visit Type for a scoped consent.",
        variant: "destructive",
      });
      return;
    }

    const cleanedOptions = options
      .map((option) => ({ ...option, text: option.text.trim() }))
      .filter((option) => option.text.length > 0);

    const payload: ConsentForm = {
      id: consentId || createMockId("consent"),
      name: name.trim(),
      scope,
      isArchived: existing?.isArchived ?? false,
      visitTypeKeys: scope === "visit_type" ? visitTypeKeys : [],
      text,
      options: cleanedOptions,
      updatedAt: existing?.updatedAt ?? currentDateStamp(),
    };

    saveConsent(payload, {
      onSuccess: () => {
        toast({
          title: consentId ? "Consent Updated" : "Consent Created",
          description: `Successfully saved "${name.trim()}".`,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save consent form.", variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-slate-50 p-0 sm:max-w-[680px]">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {consentId ? "Edit Consent" : "Create Consent"}
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500">Update name, scope, visit-type mapping, options, and document text.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto bg-white p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900" htmlFor="consent-name">
                  Consent Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="consent-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., Consent (Telehealth)"
                  className="focus-visible:border-blue-600 focus-visible:ring-[3px] focus-visible:ring-[#eff4ff] focus-visible:ring-offset-0"
                  data-testid="consent-name-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                  Scope <span className="text-red-500">*</span>
                </label>
                <div className="flex h-10 gap-2">
                  {(["global", "visit_type"] as const).map((value) => (
                    <label
                      key={value}
                      className={cn(
                        "flex flex-1 cursor-pointer items-center gap-1.5 rounded-md border px-2 transition-colors",
                        scope === value ? "border-blue-600 bg-blue-50/20" : "border-slate-200 bg-white"
                      )}
                    >
                      <input
                        type="radio"
                        name="consent-scope"
                        value={value}
                        checked={scope === value}
                        onChange={() => handleScopeChange(value)}
                        className="shrink-0 text-blue-600 focus:ring-[3px] focus:ring-[#eff4ff] focus:ring-offset-0"
                        data-testid={`consent-scope-${value}`}
                      />
                      <span className="whitespace-nowrap text-xs font-medium text-slate-700">
                        {value === "global" ? "Global" : "Selected Visit Types"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {scope === "visit_type" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                  Visit Types <span className="text-red-500">*</span>
                </label>
                <p className="mb-3 text-xs text-slate-500">
                  This consent only appears for patients on the selected Visit Types.
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  {visitTypeOptions.length === 0 ? (
                    <p className="col-span-full text-xs italic text-slate-400">No visit types available.</p>
                  ) : (
                    visitTypeOptions.map((key) => (
                      <label key={key} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                        <Checkbox
                          checked={visitTypeKeys.includes(key)}
                          onCheckedChange={(checked) => toggleVisitType(key, checked === true)}
                          aria-label={key}
                          data-testid={`consent-visit-type-${key}`}
                        />
                        <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-slate-700">{key}</code>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                Answer Options <span className="text-red-500">*</span>
              </label>
              <p className="mb-3 text-xs text-slate-500">
                Each option a patient can pick. Mark which option(s) disqualify the patient (block them from proceeding). Typically you&apos;ll have one &ldquo;agree&rdquo; option and one &ldquo;decline / disqualifying&rdquo; option.
              </p>
              <div className="mb-3 space-y-2">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Input
                      value={option.text}
                      onChange={(event) => handleOptionTextChange(option.id, event.target.value)}
                      className="h-9 flex-1 bg-white focus-visible:border-blue-600 focus-visible:ring-[3px] focus-visible:ring-[#eff4ff] focus-visible:ring-offset-0"
                      placeholder="Option text…"
                      aria-label="Answer option text"
                    />
                    <button
                      type="button"
                      onClick={() => handleOptionDisqualifiesChange(option.id, !option.disqualifies)}
                      aria-pressed={option.disqualifies}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-bold transition-colors",
                        option.disqualifies
                          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      )}
                      data-testid={`consent-option-toggle-${option.id}`}
                    >
                      {option.disqualifies ? (
                        <>
                          <X className="h-3 w-3" /> Disqualifying
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" /> Continue
                        </>
                      )}
                    </button>
                    {options.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveOption(option.id)}
                        aria-label="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full border-dashed border-slate-300 bg-white text-slate-500 hover:text-slate-900"
                data-testid="consent-add-option"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add answer option
              </Button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                Consent Text <span className="text-red-500">*</span>
              </label>
              <p className="mb-3 text-xs text-slate-500">Bold key risks; use bullet lists for itemized acknowledgments.</p>
              <RichTextEditor
                value={text}
                onChange={setText}
                placeholder="Type the legal consent document here…"
                maxLength={8000}
                data-testid="consent-text-editor"
              />
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700" data-testid="consent-save">
              {isPending ? "Saving…" : consentId ? "Save Changes" : "Create Consent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
