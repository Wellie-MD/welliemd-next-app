import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown } from "lucide-react";
import type { TreatmentType, ProgramStage, Program } from "@/features/treatments/types";

interface CreateProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatmentTypes: TreatmentType[];
  onSave: (programData: Omit<Program, "id" | "questionCount" | "checkoutQuestionCount" | "status" | "updatedAt">) => void;
  prefillTreatmentTypeKey?: string;
  prefillStage?: ProgramStage;
}

export function CreateProgramModal({
  open,
  onOpenChange,
  treatmentTypes,
  onSave,
  prefillTreatmentTypeKey,
  prefillStage,
}: CreateProgramModalProps) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState<ProgramStage>("intake");
  const [treatmentTypeKey, setTreatmentTypeKey] = useState("");
  const [slug, setSlug] = useState("");
  const [sexRequirement, setSexRequirement] = useState<"any" | "male" | "female">("any");
  const [minAge, setMinAge] = useState<string>("18");
  const [maxAge, setMaxAge] = useState<string>("");
  const [minBmi, setMinBmi] = useState<string>("");
  const [maxBmi, setMaxBmi] = useState<string>("");

  // Determine pre-filled values
  useEffect(() => {
    if (open) {
      if (prefillTreatmentTypeKey) {
        setTreatmentTypeKey(prefillTreatmentTypeKey);
        const treatment = treatmentTypes.find((t) => t.key === prefillTreatmentTypeKey);
        const derivedStage = prefillStage || "follow_up";
        setStage(derivedStage);
        if (treatment) {
          const suffix = derivedStage === "follow_up" ? "Follow-up" : "Intake";
          const autoName = `${treatment.name} ${suffix}`;
          setName(autoName);
          setSlug(autoName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
        }
      } else {
        setName("");
        setStage("intake");
        setTreatmentTypeKey("");
        setSlug("");
        setSexRequirement("any");
        setMinAge("18");
        setMaxAge("");
        setMinBmi("");
        setMaxBmi("");
      }
    }
  }, [open, prefillTreatmentTypeKey, prefillStage, treatmentTypes]);

  // Derived visit type
  const selectedTreatment = treatmentTypes.find((t) => t.key === treatmentTypeKey);
  const derivedVisitType = selectedTreatment
    ? stage === "intake"
      ? selectedTreatment.intakeVisitType
      : selectedTreatment.followupVisitType || `${selectedTreatment.key}Followup`
    : "";

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !treatmentTypeKey || !slug.trim()) {
      return;
    }

    onSave({
      name,
      stage,
      treatmentTypeKey,
      visitType: derivedVisitType,
      slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
      sexRequirement,
      minAge: minAge ? parseInt(minAge, 10) : null,
      maxAge: maxAge ? parseInt(maxAge, 10) : null,
      minBmi: minBmi ? parseFloat(minBmi) : null,
      maxBmi: maxBmi ? parseFloat(maxBmi) : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900">
              {prefillTreatmentTypeKey ? "Create Program" : "Create Program"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {prefillTreatmentTypeKey
                ? `Adding follow-up for ${selectedTreatment?.name || ""}.`
                : "Create a clinical questionnaire linked to a specific treatment."}
            </DialogDescription>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Program Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Program Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., ED Intake, TRT Follow-up"
              required
              className="h-9 text-xs border-slate-200 rounded-lg focus-visible:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProgramStage)}
                className="w-full h-9 pl-3 pr-10 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none font-medium text-slate-800"
              >
                <option value="intake">Intake</option>
                <option value="follow_up">Follow-up</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Choose whether this program is for the initial intake or for follow-up visits. Each treatment type needs an intake; follow-ups are optional and you can have more than one.
            </p>
          </div>

          {/* Treatment Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Treatment Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={treatmentTypeKey}
                onChange={(e) => setTreatmentTypeKey(e.target.value)}
                required
                className="w-full h-9 pl-3 pr-10 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none font-medium text-slate-800"
              >
                <option value="">Select treatment type...</option>
                {treatmentTypes.map((t) => (
                  <option key={t.id} value={t.key}>
                    {t.name} ({t.key})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              The specific product or program line this module belongs to (e.g., Branded GLP and Compounded GLP share visit type "weightloss" but are different treatment types.)
            </p>
          </div>

          {/* Visit Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Visit Type</label>
            <Input
              value={derivedVisitType || "Derived from treatment type and stage..."}
              disabled
              className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg text-slate-500 font-medium"
            />
            <p className="text-[10px] text-slate-400 leading-normal">
              Auto-derived from the selected treatment type. Uses IntakeVisitType when the stage is Intake and FollowupVisitType when it's Follow-up — both fields live on the Treatment Type record.
            </p>
          </div>

          {/* URL Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">URL Slug</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden h-9 items-center focus-within:ring-1 focus-within:ring-blue-500">
              <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">
                welliemd.com/intake/
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from name"
                className="flex-1 px-3 text-xs bg-white text-slate-800 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              The direct URL patients can use to enter this program (e.g., for marketing links or QR codes). Leave blank to auto-generate from the name. Use lowercase letters, numbers, and hyphens — no spaces.
            </p>
          </div>

          {/* Program Requirements */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              PROGRAM REQUIREMENTS
            </span>

            {/* Sex */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Sex</label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { value: "any", label: "Any" },
                    { value: "male", label: "Male only" },
                    { value: "female", label: "Female only" },
                  ] as const
                ).map((opt) => {
                  const isChecked = sexRequirement === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSexRequirement(opt.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                        isChecked
                          ? "border-blue-500 bg-blue-50/40 text-blue-700 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                          isChecked
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            className="h-2.5 w-2.5 stroke-[3.5] stroke-current"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Restrict eligibility by patient's biological sex. Used for sex-specific treatments like TRT (male) or HRT (female).
              </p>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Age range</label>
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden h-9 items-center flex-1">
                  <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    MIN
                  </span>
                  <input
                    type="text"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="18"
                    className="w-full px-3 text-xs focus:outline-none"
                  />
                </div>
                <span className="text-xs font-bold text-slate-400">to</span>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden h-9 items-center flex-1">
                  <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    MAX
                  </span>
                  <input
                    type="text"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="No max"
                    className="w-full px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Minimum is typically 18 (legal adult). Leave max blank for no upper limit. E.g., 18–45 for general adult treatments, 45+ for HRT/Menopause.
              </p>
            </div>

            {/* BMI Range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">BMI range</label>
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden h-9 items-center flex-1">
                  <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    MIN
                  </span>
                  <input
                    type="text"
                    value={minBmi}
                    onChange={(e) => setMinBmi(e.target.value)}
                    placeholder="No min"
                    className="w-full px-3 text-xs focus:outline-none"
                  />
                </div>
                <span className="text-xs font-bold text-slate-400">to</span>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden h-9 items-center flex-1">
                  <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    MAX
                  </span>
                  <input
                    type="text"
                    value={maxBmi}
                    onChange={(e) => setMaxBmi(e.target.value)}
                    placeholder="No max"
                    className="w-full px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Optional. Used for weight-related treatments. E.g., 27+ for GLP-1 weight loss, under 26 for GLP microdose. Leave both blank if BMI doesn't apply.
              </p>
            </div>
          </div>

          {/* Dialog Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-bold border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
            >
              Create Program
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
