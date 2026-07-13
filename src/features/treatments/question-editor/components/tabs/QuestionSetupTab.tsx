import { Settings2 } from "lucide-react";
import type { QuestionKind } from "@/features/treatments/types";

const QUESTION_TYPE_GROUPS: Array<{
  label: string;
  options: Array<{ value: QuestionKind; label: string }>;
}> = [
  {
    label: "Basic Inputs",
    options: [
      { value: "text", label: "Text (Short Answer)" },
      { value: "textarea", label: "Text Area (Long Answer)" },
      { value: "number", label: "Number" },
      { value: "date", label: "Date" },
    ],
  },
  {
    label: "Contact & Location",
    options: [
      { value: "email", label: "Email Address" },
      { value: "phone", label: "Phone Number" },
      { value: "zip", label: "ZIP Code" },
      { value: "state_routing", label: "State Routing (Service Area Check)" },
    ],
  },
  {
    label: "Choices",
    options: [
      { value: "single_choice", label: "Single Choice (Radio)" },
      { value: "multiple_choice", label: "Multiple Choice (Checkbox)" },
    ],
  },
  {
    label: "Specialized",
    options: [
      { value: "bmi", label: "BMI (Height, Weight & Auto-Calculate)" },
      { value: "file_upload", label: "File Upload" },
      { value: "medication_dose", label: "Medication & Dose Selector" },
    ],
  },
  {
    label: "Grouped Fields",
    options: [
      { value: "personal_details", label: "Personal Details (Grouped)" },
      { value: "shipping_address", label: "Shipping Address (Grouped)" },
    ],
  },
  {
    label: "Beluga Mapped",
    options: [
      { value: "sex", label: "Sex (Beluga Mapped)" },
      { value: "self_reported_meds", label: "Self Reported Medications (Beluga Mapped)" },
      { value: "allergies", label: "Allergies (Beluga Mapped)" },
      { value: "medical_conditions", label: "Medical Conditions (Beluga Mapped)" },
      { value: "labs_preference", label: "Labs Preference (Beluga Mapped)" },
    ],
  },
];

interface QuestionSetupTabProps {
  text: string;
  setText: (val: string) => void;
  kind: QuestionKind;
  setKind: (val: QuestionKind) => void;
}

export function QuestionSetupTab({
  text,
  setText,
  kind,
  setKind,
}: QuestionSetupTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center h-5 w-5 rounded bg-blue-100 text-blue-600">
          <Settings2 className="h-3 w-3" />
        </div>
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">
          QUESTION SETUP
        </h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1.5">
            Question Text <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[80px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What was the highest weight that you have reached?"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1.5">
            Question Type <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white h-10 font-medium"
            value={kind}
            onChange={(e) => setKind(e.target.value as QuestionKind)}
          >
            {QUESTION_TYPE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
