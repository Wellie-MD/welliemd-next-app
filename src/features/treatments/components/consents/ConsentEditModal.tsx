import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { useConsents, useSaveConsent } from "../../hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { ConsentForm } from "../../types";

interface ConsentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consentId?: string | null;
}

export function ConsentEditModal({ open, onOpenChange, consentId }: ConsentEditModalProps) {
  const { data: consents = [] } = useConsents();
  const { mutate: saveConsent, isPending } = useSaveConsent();

  const [name, setName] = useState("");
  const [scope, setScope] = useState<"universal" | "treatment">("universal");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<Array<{ text: string; disqualifies: boolean }>>([
    { text: "I understand and agree", disqualifies: false },
  ]);

  useEffect(() => {
    if (consentId) {
      const existing = consents.find((c) => c.id === consentId);
      if (existing) {
        setName(existing.name || "");
        setScope(existing.scope || "universal");
        setText(existing.text || "");
        // In our mock model, options might not exist yet, let's fall back to default
        setOptions(
          existing.options || [
            { text: "I understand and agree", disqualifies: false },
          ]
        );
      }
    } else {
      setName("");
      setScope("universal");
      setText("");
      setOptions([{ text: "I understand and agree", disqualifies: false }]);
    }
  }, [consentId, open, consents]);

  const handleAddOption = () => {
    setOptions([...options, { text: "", disqualifies: false }]);
  };

  const handleRemoveOption = (index: number) => {
    const updated = [...options];
    updated.splice(index, 1);
    setOptions(updated);
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index].text = val;
    setOptions(updated);
  };

  const handleOptionDisqualifiesChange = (index: number, val: boolean) => {
    const updated = [...options];
    updated[index].disqualifies = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Consent name is required.",
        variant: "destructive",
      });
      return;
    }
    if (!text.trim()) {
      toast({
        title: "Validation Error",
        description: "Consent text is required.",
        variant: "destructive",
      });
      return;
    }

    const payload: ConsentForm = {
      id: consentId || `consent-${Math.random().toString(36).substr(2, 9)}`,
      name,
      scope,
      text,
      options,
    };

    saveConsent(payload, {
      onSuccess: () => {
        toast({
          title: consentId ? "Consent Updated" : "Consent Created",
          description: `Successfully saved "${name}".`,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save consent form.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] bg-slate-50 overflow-hidden flex flex-col p-0 max-h-[90vh]">
        <DialogHeader className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {consentId ? "Edit Consent" : "Create Consent"}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Update name, scope, treatment mapping, and text.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Consent Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Consent (Telehealth)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Scope <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 h-10">
                <label className={`flex-1 flex items-center gap-2 px-3 border rounded-md cursor-pointer transition-colors ${scope === "universal" ? "border-[#12517A] bg-blue-50/20" : "border-slate-200 bg-white"}`}>
                  <input
                    type="radio"
                    name="scope"
                    value="universal"
                    checked={scope === "universal"}
                    onChange={() => setScope("universal")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Universal</span>
                </label>
                <label className={`flex-1 flex items-center gap-2 px-3 border rounded-md cursor-pointer transition-colors ${scope === "treatment" ? "border-[#12517A] bg-blue-50/20" : "border-slate-200 bg-white"}`}>
                  <input
                    type="radio"
                    name="scope"
                    value="treatment"
                    checked={scope === "treatment"}
                    onChange={() => setScope("treatment")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Treatment</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Answer Options <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Each option a patient can pick. Mark which option(s) disqualify the patient.
            </p>
            <div className="space-y-2 mb-3">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <Input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(index, e.target.value)}
                    className="flex-1 h-9 bg-white"
                    placeholder="Option text..."
                    required
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={opt.disqualifies}
                      onChange={(e) => handleOptionDisqualifiesChange(index, e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    Disqualifies
                  </label>
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveOption(index)}
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
              className="w-full border-dashed border-slate-300 text-slate-500 hover:text-slate-900 bg-white"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add answer option
            </Button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Consent Text <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Bold key risks, use bullet lists for itemized acknowledgments.
            </p>
            <Textarea
              className="w-full min-h-[150px] p-4 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Type consent text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

