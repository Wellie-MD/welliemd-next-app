import { useEffect, useRef, useState } from "react";
import { Users, Calendar, Activity } from "lucide-react";

interface ProgramEligibilityProps {
  sexRequirement: "any" | "male" | "female";
  minAge: number | null;
  maxAge: number | null;
  minBmi: number | null;
  maxBmi: number | null;
  setSexRequirement: (val: "any" | "male" | "female") => void;
  setMinAge: (val: number | null) => void;
  setMaxAge: (val: number | null) => void;
  setMinBmi: (val: number | null) => void;
  setMaxBmi: (val: number | null) => void;
}

function toNullableNumber(raw: string): number | null {
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Saving is a non-optimistic mutate + refetch (see useSaveProgram), so committing on every
 * keystroke would reset the input mid-typing once the refetch lands. Buffer locally, commit on
 * blur. The resync-from-props effect is skipped while focused, so a refetch landing while the
 * admin is mid-edit (blur -> commit -> refocus -> type again, all within one round-trip) can't
 * stomp the new, not-yet-committed keystrokes.
 */
function useDraftNumberField(committed: number | null, commit: (val: number | null) => void) {
  const [draft, setDraft] = useState(committed);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setDraft(committed);
  }, [committed]);

  return {
    value: draft ?? "",
    onChange: (raw: string) => setDraft(toNullableNumber(raw)),
    onFocus: () => {
      isFocused.current = true;
    },
    onBlur: () => {
      isFocused.current = false;
      if (draft !== committed) commit(draft);
    },
  };
}

export function ProgramEligibility({
  sexRequirement,
  minAge,
  maxAge,
  minBmi,
  maxBmi,
  setSexRequirement,
  setMinAge,
  setMaxAge,
  setMinBmi,
  setMaxBmi,
}: ProgramEligibilityProps) {
  const minAgeField = useDraftNumberField(minAge, setMinAge);
  const maxAgeField = useDraftNumberField(maxAge, setMaxAge);
  const minBmiField = useDraftNumberField(minBmi, setMinBmi);
  const maxBmiField = useDraftNumberField(maxBmi, setMaxBmi);
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-[15px] font-extrabold text-slate-900">Eligibility</h3>
        <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed font-medium">
          Who can see this program on Explore Treatments. If a patient's profile is missing a value
          a rule below depends on, the program is hidden for that patient rather than shown by default.
        </p>
      </div>

      <div className="divide-y divide-slate-100 p-6 space-y-4">
        {/* Sex requirement */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-[#eff6ff] p-2 border border-[#dbeafe]">
              <Users className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-900">Biological sex</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Restrict to patients of a specific biological sex.
              </div>
            </div>
          </div>
          <select
            value={sexRequirement}
            onChange={(e) => setSexRequirement(e.target.value as "any" | "male" | "female")}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 outline-none shadow-sm focus:border-blue-400"
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Age range */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-[#eff6ff] p-2 border border-[#dbeafe]">
              <Calendar className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-900">Age range</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Leave a bound blank for no limit.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minAgeField.value}
              onChange={(e) => minAgeField.onChange(e.target.value)}
              onFocus={minAgeField.onFocus}
              onBlur={minAgeField.onBlur}
              className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none shadow-sm focus:border-blue-400"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={maxAgeField.value}
              onChange={(e) => maxAgeField.onChange(e.target.value)}
              onFocus={maxAgeField.onFocus}
              onBlur={maxAgeField.onBlur}
              className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none shadow-sm focus:border-blue-400"
            />
          </div>
        </div>

        {/* BMI range */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-[#eff6ff] p-2 border border-[#dbeafe]">
              <Activity className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-900">BMI range</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Leave a bound blank for no limit.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="0.1"
              placeholder="Min"
              value={minBmiField.value}
              onChange={(e) => minBmiField.onChange(e.target.value)}
              onFocus={minBmiField.onFocus}
              onBlur={minBmiField.onBlur}
              className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none shadow-sm focus:border-blue-400"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input
              type="number"
              min={0}
              step="0.1"
              placeholder="Max"
              value={maxBmiField.value}
              onChange={(e) => maxBmiField.onChange(e.target.value)}
              onFocus={maxBmiField.onFocus}
              onBlur={maxBmiField.onBlur}
              className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none shadow-sm focus:border-blue-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
