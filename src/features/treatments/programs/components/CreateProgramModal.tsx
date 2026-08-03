import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown } from "lucide-react";
import type { TreatmentType, ProgramStage, Program } from "@/features/treatments/types";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

const STATE_CODES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

interface CreateProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatmentTypes: TreatmentType[];
  onSave: (
    programData: Omit<Program, "id" | "questionCount" | "checkoutQuestionCount" | "status" | "updatedAt">
  ) => Promise<Program | boolean> | Program | boolean;
  prefillTreatmentTypeKey?: string;
  prefillStage?: ProgramStage;
  initialProgram?: Program | null;
  mode?: "create" | "edit";
}

export function CreateProgramModal({
  open,
  onOpenChange,
  treatmentTypes,
  onSave,
  prefillTreatmentTypeKey,
  prefillStage,
  initialProgram,
  mode = "create",
}: CreateProgramModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [stage, setStage] = useState<ProgramStage>("intake");
  const [treatmentTypeKey, setTreatmentTypeKey] = useState("");
  const [slug, setSlug] = useState("");
  const [sexRequirement, setSexRequirement] = useState<"any" | "male" | "female">("any");
  const [minAge, setMinAge] = useState<string>("18");
  const [maxAge, setMaxAge] = useState<string>("");
  const [minBmi, setMinBmi] = useState<string>("");
  const [maxBmi, setMaxBmi] = useState<string>("");
  const [serviceStatesAll, setServiceStatesAll] = useState(false);
  const [serviceStates, setServiceStates] = useState<string[]>([]);
  const [stateSearch, setStateSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Determine pre-filled values
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialProgram) {
        setName(initialProgram.name || "");
        setStage(initialProgram.stage || "intake");
        setTreatmentTypeKey(initialProgram.treatmentTypeKey || "");
        setSlug(initialProgram.slug || "");
        setSexRequirement(initialProgram.sexRequirement || "any");
        setMinAge(initialProgram.minAge != null ? String(initialProgram.minAge) : "18");
        setMaxAge(initialProgram.maxAge != null ? String(initialProgram.maxAge) : "");
        setMinBmi(initialProgram.minBmi != null ? String(initialProgram.minBmi) : "");
        setMaxBmi(initialProgram.maxBmi != null ? String(initialProgram.maxBmi) : "");
        setServiceStatesAll(initialProgram.serviceStatesAll ?? false);
        setServiceStates(initialProgram.serviceStates || []);
      } else if (prefillTreatmentTypeKey) {
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
        setServiceStatesAll(false);
        setServiceStates([]);
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
        setServiceStatesAll(false);
        setServiceStates([]);
      }
    }
  }, [open, prefillTreatmentTypeKey, prefillStage, treatmentTypes, initialProgram, mode]);

  // Derived visit type
  const selectedTreatment = treatmentTypes.find((t) => t.key === treatmentTypeKey);
  const derivedVisitType = selectedTreatment
    ? stage === "intake"
      ? selectedTreatment.intakeVisitType
      : selectedTreatment.followupVisitType
    : "";
  const missingStageVisitType = Boolean(
    selectedTreatment && !derivedVisitType,
  );

  const handleNameChange = (val: string) => {
    setName(val);
    if (mode === "edit") return;

    // New Programs start with a suggested slug. Existing routing identifiers
    // remain stable unless the user edits the URL Slug field explicitly.
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim()
      || !treatmentTypeKey
      || !slug.trim()
      || missingStageVisitType
      || (!serviceStatesAll && serviceStates.length === 0)
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = await onSave({
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
        serviceStatesAll,
        serviceStates: serviceStatesAll ? [] : serviceStates,
      });
      if (saved) {
        onOpenChange(false);
        const programId =
          typeof saved === "object" && saved !== null && "id" in saved
            ? (saved as { id: string }).id
            : initialProgram?.id;
        if (programId) {
          navigate(ADMIN_TREATMENT_ROUTES.programQuestions(programId));
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSaving) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-[500px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900">
              {mode === "edit" ? "Edit Program" : "Create Program"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {mode === "edit"
                ? "Update the program details, routing identifiers, and eligibility requirements."
                : prefillTreatmentTypeKey
                ? `Adding follow-up for ${selectedTreatment?.name || ""}.`
                : "Create a clinical questionnaire linked to a specific treatment."}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 disabled:cursor-not-allowed disabled:opacity-50"
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
            {missingStageVisitType && (
              <p className="text-[10px] font-semibold text-red-600">
                Configure the {stage === "follow_up" ? "follow-up" : "intake"} Visit Type
                on {selectedTreatment?.name} before saving this Program.
              </p>
            )}
          </div>

          {/* URL Slug */}
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <input type="checkbox" checked={serviceStatesAll} onChange={(event) => setServiceStatesAll(event.target.checked)} />
              Offered in all states
            </label>
            {!serviceStatesAll && (
              <>
                <Input value={stateSearch} onChange={(event) => setStateSearch(event.target.value.toUpperCase())} placeholder="Search state code" className="h-8 text-xs" />
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {STATE_CODES.filter((code) => code.includes(stateSearch)).map((code) => (
                    <button key={code} type="button" onClick={() => setServiceStates((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code])} className={`rounded border px-2 py-1 text-[11px] font-semibold ${serviceStates.includes(code) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>{code}</button>
                  ))}
                </div>
                {!serviceStates.length && <p className="text-[10px] text-red-600">Select at least one state before saving or publishing.</p>}
              </>
            )}
            <p className="text-[10px] text-slate-400">At checkout, Program states are intersected with the selected Product's effective service states.</p>
          </div>

          {/* Program slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Slug</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden h-9 items-center focus-within:ring-1 focus-within:ring-blue-500">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from name"
                className="flex-1 px-3 text-xs bg-white text-slate-800 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Stable routing identifier for this Program. The client portal combines intake slugs with its tenant questionnaire domain when it creates patient links. Leave blank to auto-generate from the name. Use lowercase letters, numbers, and hyphens — no spaces.
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
              disabled={isSaving}
              className="h-9 px-4 text-xs font-bold border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={missingStageVisitType || isSaving}
              className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
            >
              {isSaving
                ? "Saving..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Program"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
