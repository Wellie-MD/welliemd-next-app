import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CustomProgram } from "../../types";

export interface CustomProgramFormData {
  name: string;
  description: string;
  minAge: number;
  maxAge?: number;
  audience: CustomProgram["audience"];
}

interface CustomProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomProgramFormData) => void;
  program?: CustomProgram | null;
}

export function CustomProgramModal({ open, onOpenChange, onSubmit, program }: CustomProgramModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minAge: "18",
    maxAge: "",
    audience: "all" as CustomProgram["audience"],
  });

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || "",
        description: program.description || "",
        minAge: String(program.minAge ?? 18),
        maxAge: program.maxAge ? String(program.maxAge) : "",
        audience: program.audience || "all",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        minAge: "18",
        maxAge: "",
        audience: "all",
      });
    }
  }, [program, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      minAge: parseInt(formData.minAge) || 18,
      maxAge: formData.maxAge ? parseInt(formData.maxAge) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>{program ? "Edit Custom Program" : "Create New Custom Program"}</DialogTitle>
          <DialogDescription>
            {program
              ? "Update custom program settings and age requirements."
              : "Set up a new intake form. You'll wire up treatments, eligibility, and questions after the form is created."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                Custom Program Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Health TRT Intake, Men's Sexual Health Form"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                The form name shown to admins. Patients see whatever you configure in the form's branding.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description shown to patients in Explore Treatments"
                rows={3}
              />
            </div>

            <div>
              <Label>Patient Avatar<span className="text-red-500">*</span></Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300">
                  <input
                    type="radio"
                    name="audience"
                    value="male"
                    checked={formData.audience === "male"}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value as CustomProgram["audience"] })}
                    className="sr-only"
                  />
                  <div className={`flex flex-col items-center text-center w-full ${formData.audience === "male" ? "text-blue-600" : "text-slate-600"}`}>
                    <div className="font-semibold text-sm mt-2">Male</div>
                    <div className="text-xs text-slate-500 mt-1">Shown to male patients only</div>
                  </div>
                </label>

                <label className="flex cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300">
                  <input
                    type="radio"
                    name="audience"
                    value="female"
                    checked={formData.audience === "female"}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value as CustomProgram["audience"] })}
                    className="sr-only"
                  />
                  <div className={`flex flex-col items-center text-center w-full ${formData.audience === "female" ? "text-pink-600" : "text-slate-600"}`}>
                    <div className="font-semibold text-sm mt-2">Female</div>
                    <div className="text-xs text-slate-500 mt-1">Shown to female patients only</div>
                  </div>
                </label>

                <label className="flex cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300">
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={formData.audience === "all"}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value as CustomProgram["audience"] })}
                    className="sr-only"
                  />
                  <div className={`flex flex-col items-center text-center w-full ${formData.audience === "all" ? "text-purple-600" : "text-slate-600"}`}>
                    <div className="font-semibold text-sm mt-2">All Patients</div>
                    <div className="text-xs text-slate-500 mt-1">Shown to all patients</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label>Age Requirement<span className="text-red-500">*</span></Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="minAge" className="text-xs text-slate-500">Minimum</Label>
                  <div className="relative mt-1 flex items-center">
                    <Input
                      id="minAge"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.minAge}
                      onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                    />
                    <span className="absolute right-3 text-sm text-slate-400">years</span>
                  </div>
                </div>
                <div className="text-slate-400 mt-5">—</div>
                <div className="flex-1">
                  <Label htmlFor="maxAge" className="text-xs text-slate-500">Maximum (optional)</Label>
                  <div className="relative mt-1 flex items-center">
                    <Input
                      id="maxAge"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.maxAge}
                      onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                      placeholder="No limit"
                    />
                    <span className="absolute right-3 text-sm text-slate-400">years</span>
                  </div>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Only patients within this age range will see this plan. Leave maximum blank for no upper limit (e.g., 18+ only).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {program ? "Save Changes" : "Create Custom Program"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
