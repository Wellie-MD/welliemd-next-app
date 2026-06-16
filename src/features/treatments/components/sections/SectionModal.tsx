import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveSection } from "../../hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { CommonSection } from "../../types";

interface SectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: CommonSection | null;
}

export function SectionModal({ open, onOpenChange, section }: SectionModalProps) {
  const { mutate: saveSection, isPending } = useSaveSection();

  const [name, setName] = useState("");
  const [scope, setScope] = useState<"global" | "treatment">("global");
  const [visitTypeKeysStr, setVisitTypeKeysStr] = useState("");
  const [fieldCount, setFieldCount] = useState(0);

  useEffect(() => {
    if (section) {
      setName(section.name || "");
      setScope(section.scope || "global");
      setVisitTypeKeysStr(section.visitTypeKeys?.join(", ") || "");
      setFieldCount(section.fieldCount || 0);
    } else {
      setName("");
      setScope("global");
      setVisitTypeKeysStr("");
      setFieldCount(0);
    }
  }, [section, open]);

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

    const visitTypeKeys = visitTypeKeysStr
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload: CommonSection = {
      id: section?.id || `section-${Math.random().toString(36).substr(2, 9)}`,
      name,
      scope,
      visitTypeKeys,
      fieldCount,
      updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    saveSection(payload, {
      onSuccess: () => {
        toast({
          title: section ? "Section Updated" : "Section Created",
          description: `Successfully saved "${name}".`,
        });
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save section.",
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
            {section ? "Edit Section" : "Create Common Section"}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Configure reusable section parameters.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 bg-white space-y-6">
          <div>
            <Label htmlFor="secName">Name <span className="text-red-500">*</span></Label>
            <Input
              id="secName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Medical History Summary"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Scope <span className="text-red-500">*</span></Label>
            <div className="flex gap-2 h-10 mt-1">
              <label className={`flex-1 flex items-center gap-2 px-3 border rounded-md cursor-pointer transition-colors ${scope === "global" ? "border-[#12517A] bg-blue-50/20" : "border-slate-200 bg-white"}`}>
                <input
                  type="radio"
                  name="scope"
                  value="global"
                  checked={scope === "global"}
                  onChange={() => setScope("global")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Global</span>
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

          <div>
            <Label htmlFor="secVisitTypes">Visit Type Keys (comma-separated)</Label>
            <Input
              id="secVisitTypes"
              type="text"
              value={visitTypeKeysStr}
              onChange={(e) => setVisitTypeKeysStr(e.target.value)}
              placeholder="e.g. weightloss, trt"
              className="font-mono mt-1"
            />
            <p className="text-[10px] text-slate-400 mt-1">Leave empty to make this section available to all visit types.</p>
          </div>

          <div>
            <Label htmlFor="secFields">Field Count</Label>
            <Input
              id="secFields"
              type="number"
              min="0"
              value={fieldCount}
              onChange={(e) => setFieldCount(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
              {isPending ? "Saving..." : section ? "Update Section" : "Create Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
