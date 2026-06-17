import { useState, useEffect } from "react";
import { User, Users } from "lucide-react";
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
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Custom Program Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Health TRT Intake, Men's Wellness Form"
                required
                className="mt-1.5"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                The form name shown to admins. Patients see whatever you configure in the form's branding.
              </p>
            </div>

            <div>
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description shown to patients in Explore Treatments"
                rows={3}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Patient Avatar<span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Male Radio Card */}
                <label
                  className={`flex cursor-pointer flex-col items-center text-center rounded-lg border p-4 shadow-sm transition-all hover:border-slate-300 ${
                    formData.audience === "male"
                      ? "border-[#1b5bf7] bg-[#f4f7ff]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    value="male"
                    checked={formData.audience === "male"}
                    onChange={(e) =>
                      setFormData({ ...formData, audience: e.target.value as CustomProgram["audience"] })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      formData.audience === "male" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className={`font-semibold text-sm mt-2.5 ${formData.audience === "male" ? "text-blue-900" : "text-slate-700"}`}>
                    Male
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Shown to male patients only
                  </div>
                </label>

                {/* Female Radio Card */}
                <label
                  className={`flex cursor-pointer flex-col items-center text-center rounded-lg border p-4 shadow-sm transition-all hover:border-slate-300 ${
                    formData.audience === "female"
                      ? "border-pink-500 bg-pink-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    value="female"
                    checked={formData.audience === "female"}
                    onChange={(e) =>
                      setFormData({ ...formData, audience: e.target.value as CustomProgram["audience"] })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      formData.audience === "female" ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className={`font-semibold text-sm mt-2.5 ${formData.audience === "female" ? "text-pink-900" : "text-slate-700"}`}>
                    Female
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Shown to female patients only
                  </div>
                </label>

                {/* All Patients Radio Card */}
                <label
                  className={`flex cursor-pointer flex-col items-center text-center rounded-lg border p-4 shadow-sm transition-all hover:border-slate-300 ${
                    formData.audience === "all"
                      ? "border-purple-500 bg-purple-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={formData.audience === "all"}
                    onChange={(e) =>
                      setFormData({ ...formData, audience: e.target.value as CustomProgram["audience"] })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      formData.audience === "all" ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div className={`font-semibold text-sm mt-2.5 ${formData.audience === "all" ? "text-purple-900" : "text-slate-700"}`}>
                    All Patients
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Shown to all patients
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Age Requirement<span className="text-red-500">*</span>
              </Label>
              <div className="mt-2.5 flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="minAge" className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Minimum
                  </Label>
                  <div className="relative mt-1.5 flex items-center">
                    <Input
                      id="minAge"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.minAge}
                      onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                      className="pr-14 text-sm"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">years</span>
                  </div>
                </div>
                <div className="text-slate-300 mt-6 font-semibold">—</div>
                <div className="flex-1">
                  <Label htmlFor="maxAge" className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Maximum (optional)
                  </Label>
                  <div className="relative mt-1.5 flex items-center">
                    <Input
                      id="maxAge"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.maxAge}
                      onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                      placeholder="No limit"
                      className="pr-14 text-sm"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">years</span>
                  </div>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-slate-400 leading-normal">
                Only patients within this age range will see this plan. Leave maximum blank for no upper limit (e.g., 18+ only).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
              {program ? "Save Changes" : "Create Custom Program"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
